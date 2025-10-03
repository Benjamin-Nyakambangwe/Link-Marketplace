"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import PublisherLayout from "@/components/publisher/publisher-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  DollarSign, 
  Search, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Mail,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

interface Payout {
  id: string
  order_id: string
  payment_id: string
  amount: number
  payout_status: string
  publisher_paypal_email: string
  paypal_payout_batch_id: string | null
  paypal_payout_item_id: string | null
  initiated_at: string | null
  completed_at: string | null
  failure_reason: string | null
  created_at: string
  order: {
    title: string
    total_amount: number
    status: string
    website: {
      name: string
      url: string
    }
  }
  payment: {
    invoice_status: string
    paid_at: string | null
    total_amount: number
    platform_fee: number
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  PROCESSING: { label: "Processing", color: "bg-blue-100 text-blue-700", icon: TrendingUp },
  SUCCESS: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700", icon: AlertCircle },
}

export default function PublisherPayouts() {
  const { user } = useAuth()
  const supabase = createClient()

  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paypalEmail, setPaypalEmail] = useState<string | null>(null)

  // Stats
  const [stats, setStats] = useState({
    totalEarned: 0,
    pendingAmount: 0,
    processingAmount: 0,
    totalPayouts: 0
  })

  useEffect(() => {
    if (user) {
      fetchPaypalEmail()
      fetchPayouts()
    }
  }, [user])

  const fetchPaypalEmail = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('paypal_email')
      .eq('id', user?.id)
      .single()

    setPaypalEmail(data?.paypal_email || null)
  }

  const fetchPayouts = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          order:orders!inner(
            title,
            total_amount,
            status,
            publisher_id,
            website:websites(name, url)
          ),
          payment:payments(
            invoice_status,
            paid_at,
            total_amount,
            platform_fee
          )
        `)
        .eq('publisher_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const payoutsData = data.map(p => ({
        ...p,
        payment: p.payment?.[0] || p.payment
      })) as any[]
      
      setPayouts(payoutsData)

      // Calculate stats
      const totalEarned = payoutsData
        .filter(p => p.payout_status === 'SUCCESS')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0)

      const pendingAmount = payoutsData
        .filter(p => p.payout_status === 'PENDING')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0)

      const processingAmount = payoutsData
        .filter(p => p.payout_status === 'PROCESSING')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0)

      setStats({
        totalEarned,
        pendingAmount,
        processingAmount,
        totalPayouts: payoutsData.length
      })

    } catch (error) {
      console.error('Error fetching payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = 
      payout.order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.order.website.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.publisher_paypal_email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || payout.payout_status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <PublisherLayout>
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </PublisherLayout>
    )
  }

  return (
    <PublisherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payouts</h1>
          <p className="text-slate-600">Track your earnings and payment history</p>
        </div>

        {/* PayPal Email Warning */}
        {!paypalEmail && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <div className="font-medium mb-1">PayPal Email Not Set</div>
              <p className="text-sm mb-2">You need to add your PayPal email to receive payouts.</p>
              <Link href="/publisher/settings">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Mail className="w-4 h-4 mr-2" />
                  Add PayPal Email
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <Wallet className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalEarned.toFixed(2)}</div>
              <p className="text-xs text-slate-500">Received in your PayPal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.processingAmount.toFixed(2)}</div>
              <p className="text-xs text-slate-500">Being sent to you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.pendingAmount.toFixed(2)}</div>
              <p className="text-xs text-slate-500">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayouts}</div>
              <p className="text-xs text-slate-500">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Current PayPal Email */}
        {paypalEmail && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">PayPal Email</p>
                    <p className="text-sm text-blue-700">{paypalEmail}</p>
                  </div>
                </div>
                <Link href="/publisher/settings">
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>All Payouts</CardTitle>
            <CardDescription>View your complete payout history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by order, website..."
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
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SUCCESS">Paid</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payouts List */}
            <div className="space-y-4">
              {filteredPayouts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No payouts yet</p>
                  <p className="text-sm">Your earnings will appear here when orders are completed</p>
                </div>
              ) : (
                filteredPayouts.map((payout) => {
                  const statusInfo = statusConfig[payout.payout_status] || statusConfig.PENDING
                  const StatusIcon = statusInfo.icon

                  return (
                    <div
                      key={payout.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900">{payout.order.title}</h3>
                                <Badge className={statusInfo.color}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">
                                {payout.order.website.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {payout.completed_at ? (
                                <span>Paid: {new Date(payout.completed_at).toLocaleDateString()}</span>
                              ) : payout.initiated_at ? (
                                <span>Initiated: {new Date(payout.initiated_at).toLocaleDateString()}</span>
                              ) : (
                                <span>Created: {new Date(payout.created_at).toLocaleDateString()}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>{payout.publisher_paypal_email}</span>
                            </div>
                          </div>

                          {payout.failure_reason && (
                            <Alert className="border-red-200 bg-red-50 mt-2">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-red-900 text-sm">
                                <strong>Failure reason:</strong> {payout.failure_reason}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <div className="flex flex-col md:items-end gap-2">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              ${payout.amount}
                            </div>
                            {payout.payment && (
                              <div className="text-xs text-slate-500">
                                Order: ${payout.payment.total_amount} • Fee: ${payout.payment.platform_fee}
                              </div>
                            )}
                          </div>

                          <Link href={`/publisher/orders/${payout.order_id}`}>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View Order
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Payout Lifecycle Progress */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <div className={`flex items-center gap-1 ${payout.payment?.paid_at ? 'text-green-600' : 'text-slate-400'}`}>
                            <CheckCircle className="w-4 h-4" />
                            <span>Advertiser Paid</span>
                          </div>
                          <div className="h-px flex-1 bg-slate-200 mx-2"></div>
                          
                          <div className={`flex items-center gap-1 ${payout.order.status === 'completed' || payout.order.status === 'payment_processing' || payout.order.status === 'paid' ? 'text-green-600' : 'text-slate-400'}`}>
                            <CheckCircle className="w-4 h-4" />
                            <span>Work Approved</span>
                          </div>
                          <div className="h-px flex-1 bg-slate-200 mx-2"></div>
                          
                          <div className={`flex items-center gap-1 ${payout.initiated_at ? 'text-green-600' : 'text-slate-400'}`}>
                            <CheckCircle className="w-4 h-4" />
                            <span>Payout Initiated</span>
                          </div>
                          <div className="h-px flex-1 bg-slate-200 mx-2"></div>
                          
                          <div className={`flex items-center gap-1 ${payout.payout_status === 'SUCCESS' ? 'text-green-600' : 'text-slate-400'}`}>
                            <CheckCircle className="w-4 h-4" />
                            <span>Received</span>
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
    </PublisherLayout>
  )
}
