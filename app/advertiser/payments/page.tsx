"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import AdvertiserLayout from "@/components/advertiser/advertiser-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  DollarSign, 
  ExternalLink, 
  Search, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Receipt
} from "lucide-react"
import Link from "next/link"

interface Payment {
  id: string
  order_id: string
  paypal_invoice_id: string
  invoice_number: string
  invoice_status: string
  invoice_url: string | null
  total_amount: number
  platform_fee: number
  publisher_amount: number
  invoice_sent_at: string | null
  paid_at: string | null
  created_at: string
  order: {
    title: string
    status: string
    website: {
      name: string
      url: string
    }
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: Clock },
  SENT: { label: "Invoice Sent", color: "bg-blue-100 text-blue-700", icon: Receipt },
  PAID: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: AlertCircle },
  REFUNDED: { label: "Refunded", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
}

export default function AdvertiserPayments() {
  const { user } = useAuth()
  const supabase = createClient()

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Stats
  const [stats, setStats] = useState({
    totalPaid: 0,
    pendingAmount: 0,
    totalInvoices: 0,
    completedOrders: 0
  })

  useEffect(() => {
    if (user) {
      fetchPayments()
    }
  }, [user])

  const fetchPayments = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          order:orders!inner(
            title,
            status,
            advertiser_id,
            website:websites(name, url)
          )
        `)
        .eq('order.advertiser_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const paymentsData = data as any[]
      setPayments(paymentsData)

      // Calculate stats
      const totalPaid = paymentsData
        .filter(p => p.invoice_status === 'PAID')
        .reduce((sum, p) => sum + parseFloat(p.total_amount), 0)

      const pendingAmount = paymentsData
        .filter(p => p.invoice_status === 'SENT')
        .reduce((sum, p) => sum + parseFloat(p.total_amount), 0)

      const completedOrders = paymentsData
        .filter(p => p.invoice_status === 'PAID' && p.order.status === 'paid')
        .length

      setStats({
        totalPaid,
        pendingAmount,
        totalInvoices: paymentsData.length,
        completedOrders
      })

    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.order.website.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || payment.invoice_status === statusFilter

    return matchesSearch && matchesStatus
  })

  const openInvoice = (invoiceUrl: string) => {
    let url = invoiceUrl
    
    // Fix old API URLs to public URLs
    if (url.includes('api.sandbox.paypal.com') || url.includes('api-m.sandbox.paypal.com')) {
      const invoiceId = url.split('/').pop()
      url = `https://www.sandbox.paypal.com/invoice/p/#${invoiceId}`
    } else if (url.includes('api.paypal.com') || url.includes('api-m.paypal.com')) {
      const invoiceId = url.split('/').pop()
      url = `https://www.paypal.com/invoice/p/#${invoiceId}`
    }
    
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <AdvertiserLayout>
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </AdvertiserLayout>
    )
  }

  return (
    <AdvertiserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment History</h1>
          <p className="text-slate-600">Track all your invoices and payments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalPaid.toFixed(2)}</div>
              <p className="text-xs text-slate-500">{stats.completedOrders} completed orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.pendingAmount.toFixed(2)}</div>
              <p className="text-xs text-slate-500">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <Receipt className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-slate-500">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${payments.reduce((sum, p) => sum + parseFloat(String(p.platform_fee || 0)), 0).toFixed(2)}
              </div>
              <p className="text-xs text-slate-500">15% of total</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>All Payments</CardTitle>
            <CardDescription>View and manage your payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by invoice, order, or website..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="SENT">Invoice Sent</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payments Table */}
            <div className="space-y-4">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No payments found</p>
                  <p className="text-sm">Your payment history will appear here</p>
                </div>
              ) : (
                filteredPayments.map((payment) => {
                  const statusInfo = statusConfig[payment.invoice_status] || statusConfig.SENT
                  const StatusIcon = statusInfo.icon

                  return (
                    <div
                      key={payment.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900">{payment.order.title}</h3>
                                <Badge className={statusInfo.color}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">
                                {payment.order.website.name} • {payment.invoice_number}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {payment.paid_at ? (
                                <span>Paid: {new Date(payment.paid_at).toLocaleDateString()}</span>
                              ) : (
                                <span>Created: {new Date(payment.created_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-2">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900">
                              ${payment.total_amount}
                            </div>
                            <div className="text-xs text-slate-500">
                              Fee: ${payment.platform_fee} • Publisher: ${payment.publisher_amount}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Link href={`/advertiser/orders/${payment.order_id}`}>
                              <Button variant="outline" size="sm">
                                View Order
                              </Button>
                            </Link>
                            {payment.invoice_url && (
                              <Button
                                size="sm"
                                onClick={() => openInvoice(payment.invoice_url!)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Invoice
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Payment Lifecycle Progress */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <div className={`flex items-center gap-1 ${payment.invoice_sent_at ? 'text-green-600' : 'text-slate-400'}`}>
                            <CheckCircle className="w-4 h-4" />
                            <span>Invoice Sent</span>
                          </div>
                          <div className="h-px flex-1 bg-slate-200 mx-2"></div>
                          
                          <div className={`flex items-center gap-1 ${payment.paid_at ? 'text-green-600' : 'text-slate-400'}`}>
                            <CheckCircle className="w-4 h-4" />
                            <span>Paid</span>
                          </div>
                          <div className="h-px flex-1 bg-slate-200 mx-2"></div>
                          
                          <div className={`flex items-center gap-1 ${payment.order.status === 'paid' ? 'text-green-600' : 'text-slate-400'}`}>
                            <CheckCircle className="w-4 h-4" />
                            <span>Publisher Paid</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdvertiserLayout>
  )
}
