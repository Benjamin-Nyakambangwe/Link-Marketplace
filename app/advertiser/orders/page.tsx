"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Eye, Clock, Play, CheckCircle, AlertCircle, DollarSign, Calendar, MessageSquare, RefreshCw, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

import AdvertiserLayout from "@/components/advertiser/advertiser-layout"
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
  publisher: {
    id: string
    user_role: string | null
  }
  order_items: Array<{
    service_name: string
    quantity: number
    total_price: number
  }>
  workflow_progress?: {
    completed_steps: number
    total_steps: number
    current_step?: {
      step_number: number
      step_name: string
      assignee: string
    }
  }
}

const statusConfig = {
  pending: { label: "Pending Approval", color: "bg-orange-100 text-orange-700", icon: Clock },
  accepted: { label: "Accepted", color: "bg-blue-100 text-blue-700", icon: Play },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Play },
  review: { label: "Under Review", color: "bg-purple-100 text-purple-700", icon: Eye },
  revision: { label: "Needs Revision", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-700", icon: AlertCircle },
  disputed: { label: "Disputed", color: "bg-red-100 text-red-700", icon: AlertCircle },
}

export default function MyOrders() {
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
  const [serviceFilter, setServiceFilter] = useState("all")

  // Stats
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    needs_attention: 0,
    total_spent: 0
  })

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [orders, searchTerm, statusFilter, serviceFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)

      // Fetch orders placed by this advertiser
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
          publisher_id,
          order_items (
            service_name,
            quantity,
            total_price
          )
        `)
        .eq('advertiser_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        setError('Failed to load orders. Please try again.')
        return
      }

      // Enrich orders with website and publisher data
      const ordersWithDetails = await Promise.all(
        (data || []).map(async (order) => {
          // Get website data
          const { data: websiteData } = await supabase
            .from('websites')
            .select('id, name, url')
            .eq('id', order.website_id)
            .single()

          // Get publisher data
          const { data: publisherData } = await supabase
            .from('profiles')
            .select('id, user_role')
            .eq('id', order.publisher_id)
            .single()

          // Get workflow progress
          const { data: stepsData } = await supabase
            .from('order_steps')
            .select('step_number, step_name, status, assignee')
            .eq('order_id', order.id)
            .order('step_number', { ascending: true })

          const completedSteps = stepsData?.filter(step => step.status === 'completed').length || 0
          const totalSteps = stepsData?.length || 0
          const currentStep = stepsData?.find(step => step.status === 'in_progress')

          return {
            ...order,
            website: websiteData || { id: '', name: 'Unknown', url: '' },
            publisher: publisherData || { id: '', user_role: 'Unknown' },
            workflow_progress: {
              completed_steps: completedSteps,
              total_steps: totalSteps,
              current_step: currentStep
            }
          }
        })
      )

      setOrders(ordersWithDetails)
      calculateStats(ordersWithDetails)
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
      in_progress: orderData.filter(o => ['accepted', 'in_progress', 'review'].includes(o.status)).length,
      completed: orderData.filter(o => o.status === 'completed').length,
      needs_attention: orderData.filter(o => ['revision', 'disputed', 'cancelled'].includes(o.status)).length,
      total_spent: orderData
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
        order.website.name.toLowerCase().includes(search) ||
        order.id.toLowerCase().includes(search)
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    if (serviceFilter !== "all") {
      filtered = filtered.filter(order => 
        order.order_items.some(item => item.service_name.toLowerCase().includes(serviceFilter.toLowerCase()))
      )
    }

    setFilteredOrders(filtered)
  }

  const getProgressPercentage = (order: Order) => {
    if (!order.workflow_progress) return 0
    const { completed_steps, total_steps } = order.workflow_progress
    if (total_steps === 0) return 0
    return Math.round((completed_steps / total_steps) * 100)
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

  const services = Array.from(new Set(
    orders.flatMap(order => order.order_items.map(item => item.service_name))
  ))

  if (loading) {
    return (
      <AdvertiserLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdvertiserLayout>
    )
  }

  return (
    <AdvertiserLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600">Track and manage all your campaign orders</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={fetchOrders}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
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
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{orderStats.pending}</p>
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
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{orderStats.in_progress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{orderStats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Needs Attention</p>
                  <p className="text-2xl font-bold text-gray-900">{orderStats.needs_attention}</p>
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
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders, websites, or publishers..."
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

              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service} value={service}>
                      {service}
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
            <CardTitle>Orders ({filteredOrders.length})</CardTitle>
            <CardDescription>
              View and manage your campaign orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600 mb-4">
                  {orders.length === 0 
                    ? "You haven't placed any orders yet." 
                    : "No orders match your current filters."
                  }
                </p>
                {orders.length === 0 && (
                  <Button asChild>
                    <Link href="/advertiser/websites">Browse Websites</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Publisher</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
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
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {order.description}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              ID: {order.id.substring(0, 8)}...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.website.name}</div>
                            <div className="text-sm text-gray-500">{order.website.url}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {'Publisher'}
                            </div>
                            <div className="text-sm text-gray-500">{order.publisher.user_role}</div>
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
                              <div className="text-xs text-gray-500">
                                +{order.order_items.length - 2} more
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Progress 
                                value={getProgressPercentage(order)} 
                                className="w-16 h-2" 
                              />
                              <span className="text-xs text-gray-500">
                                {getProgressPercentage(order)}%
                              </span>
                            </div>
                            {order.workflow_progress?.current_step && (
                              <div className="text-xs text-blue-600">
                                Step {order.workflow_progress.current_step.step_number}: {order.workflow_progress.current_step.step_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${order.total_amount}</div>
                        </TableCell>
                        <TableCell>
                          <div>{formatDate(order.created_at)}</div>
                          {order.requested_completion_date && (
                            <div className="text-xs text-gray-500">
                              Due: {formatDate(order.requested_completion_date)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/advertiser/orders/${order.id}`}>
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
    </AdvertiserLayout>
  )
}
