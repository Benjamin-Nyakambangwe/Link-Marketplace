"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Eye, Clock, Play, CheckCircle, AlertCircle, DollarSign, Calendar, User, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

import PublisherLayout from "@/components/publisher/publisher-layout"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

interface Order {
  id: string
  title: string
  description: string
  total_amount: number
  status: string
  created_at: string
  requested_completion_date: string | null
  website: {
    id: string
    name: string
    url: string
  }
  advertiser: {
    id: string
    user_role: string | null
  }
  order_items: Array<{
    service_name: string
    quantity: number
    total_price: number
  }>
  current_step?: {
    step_number: number
    step_name: string
    status: string
    assignee: string
  }
}

const statusConfig = {
  pending: { label: "Pending", color: "bg-orange-100 text-orange-700", icon: Clock },
  accepted: { label: "Accepted", color: "bg-blue-100 text-blue-700", icon: Play },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Play },
  review: { label: "Under Review", color: "bg-purple-100 text-purple-700", icon: Eye },
  revision: { label: "Needs Revision", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-700", icon: AlertCircle },
  disputed: { label: "Disputed", color: "bg-red-100 text-red-700", icon: AlertCircle },
}

export default function PublisherOrders() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [websiteFilter, setWebsiteFilter] = useState("all")

  // Stats
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    total_revenue: 0
  })

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [orders, searchTerm, statusFilter, websiteFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)

      const { data: websiteIds, error: websiteError } = await supabase
        .from('websites')
        .select('id')
        .eq('user_id', user?.id)

      if (websiteError) {
        console.error('Error fetching websites:', websiteError)
        setError('Failed to load orders. Please try again.')
        setLoading(false)
        return
      }

      if (!websiteIds || websiteIds.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      // Fetch orders for websites owned by this publisher
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          title,
          description,
          total_amount,
          status,
          created_at,
          requested_completion_date,
          website_id,
          advertiser_id,
          order_items (
            service_name,
            quantity,
            total_price
          )
        `)
        .in('website_id', websiteIds.map(w => w.id))
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        setError('Failed to load orders. Please try again.')
        return
      }

      // Enrich orders with website, advertiser, and steps data
      const ordersWithDetails = await Promise.all(
        (data || []).map(async (order) => {
          const { data: websiteData } = await supabase
            .from('websites')
            .select('id, name, url')
            .eq('id', order.website_id)
            .single()

          const { data: advertiserData } = await supabase
            .from('profiles')
            .select('id, user_role')
            .eq('id', order.advertiser_id)
            .single()

          const { data: stepsData } = await supabase
            .from('order_steps')
            .select('step_number, step_name, status, assignee')
            .eq('order_id', order.id)
            .order('step_number', { ascending: true })
          
          if (!websiteData || !advertiserData) {
            return null
          }

          return {
            ...order,
            website: websiteData,
            advertiser: advertiserData,
            current_step: stepsData?.find((step: any) => step.status === 'in_progress'),
          }
        })
      )

      const processedOrders = ordersWithDetails.filter(Boolean) as Order[]

      setOrders(processedOrders)
      calculateStats(processedOrders)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (orderData: Order[]) => {
    const stats = {
      total: orderData.length,
      pending: orderData.filter(o => o.status === 'pending').length,
      in_progress: orderData.filter(o => ['accepted', 'in_progress', 'review', 'revision'].includes(o.status)).length,
      completed: orderData.filter(o => o.status === 'completed').length,
      total_revenue: orderData
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.total_amount, 0)
    }
    setOrderStats(stats)
  }

  const applyFilters = () => {
    let filtered = [...orders]

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(order => 
        order.title.toLowerCase().includes(search) ||
        order.website.name.toLowerCase().includes(search)
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    if (websiteFilter !== "all") {
      filtered = filtered.filter(order => order.website.id === websiteFilter)
    }

    setFilteredOrders(filtered)
  }

  const handleQuickAction = async (orderId: string, action: string) => {
    try {
      let newStatus = ''
      
      switch (action) {
        case 'accept':
          newStatus = 'accepted'
          break
        case 'reject':
          newStatus = 'cancelled'
          break
        case 'start':
          newStatus = 'in_progress'
          break
      }

      if (newStatus) {
        const { error } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId)

        if (error) {
          console.error('Error updating order:', error)
          return
        }

        // Refresh orders
        fetchOrders()
      }
    } catch (err) {
      console.error('Error updating order:', err)
    }
  }

  const getActionButtons = (order: Order) => {
    const buttons = []

    switch (order.status) {
      case 'pending':
        buttons.push(
          <Button
            key="accept"
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white mr-2"
            onClick={() => handleQuickAction(order.id, 'accept')}
          >
            Accept
          </Button>
        )
        buttons.push(
          <Button
            key="reject"
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleQuickAction(order.id, 'reject')}
          >
            Reject
          </Button>
        )
        break
      case 'accepted':
        buttons.push(
          <Button
            key="start"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleQuickAction(order.id, 'start')}
          >
            Start Work
          </Button>
        )
        break
    }

    return buttons
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    )
  }

  const websites = Array.from(new Set(
    orders
      .filter(order => order.website && order.website.id)
      .map(order => ({ id: order.website.id, name: order.website.name }))
  ))

  if (loading) {
    return (
      <PublisherLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </PublisherLayout>
    )
  }

  return (
    <PublisherLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
            <p className="text-slate-600">Manage and track your incoming orders</p>
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Globe className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Orders</p>
                  <p className="text-2xl font-bold text-slate-900">{orderStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending</p>
                  <p className="text-2xl font-bold text-slate-900">{orderStats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Play className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">In Progress</p>
                  <p className="text-2xl font-bold text-slate-900">{orderStats.in_progress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">${orderStats.total_revenue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={websiteFilter} onValueChange={setWebsiteFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by website" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Websites</SelectItem>
                  {websites.map(website => (
                    <SelectItem key={website.id} value={website.id}>
                      {website.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders ({filteredOrders.length})</CardTitle>
            <CardDescription>
              Manage your incoming orders and track their progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No orders found</h3>
                <p className="text-slate-600">
                  {orders.length === 0 
                    ? "You haven't received any orders yet." 
                    : "No orders match your current filters."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Advertiser</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.title}</div>
                            <div className="text-sm text-slate-500 line-clamp-1">
                              {order.description}
                            </div>
                            {order.current_step && (
                              <div className="text-xs text-blue-600 mt-1">
                                Step {order.current_step.step_number}: {order.current_step.step_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {'Advertiser'}
                            </div>
                            <div className="text-sm text-slate-500">{order.advertiser.user_role}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.website.name}</div>
                            <div className="text-sm text-slate-500">{order.website.url}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.order_items.slice(0, 2).map((item, index) => (
                              <div key={index} className="text-sm">
                                {item.service_name} 
                                {item.quantity > 1 && ` (${item.quantity})`}
                              </div>
                            ))}
                            {order.order_items.length > 2 && (
                              <div className="text-xs text-slate-500">
                                +{order.order_items.length - 2} more
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${order.total_amount}</div>
                        </TableCell>
                        <TableCell>
                          <div>{formatDate(order.created_at)}</div>
                          {order.requested_completion_date && (
                            <div className="text-xs text-slate-500">
                              Due: {formatDate(order.requested_completion_date)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {getActionButtons(order)}
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/publisher/orders/${order.id}`}>
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PublisherLayout>
  )
}
