"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, Clock, Play, CheckCircle, AlertCircle, MessageSquare, 
  User, Globe, DollarSign, Calendar, FileText, Send, ExternalLink,
  Download, Eye, Star, MapPin, Loader2, Check
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

import AdvertiserLayout from "@/components/advertiser/advertiser-layout"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

interface OrderStep {
  id: string
  step_number: number
  step_name: string
  step_description: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  assignee: 'publisher' | 'advertiser' | 'both'
  started_at: string | null
  completed_at: string | null
  notes: string | null
}

interface OrderDetails {
  id: string
  title: string
  description: string
  total_amount: number
  status: string
  payment_status?: string
  published_url?: string
  created_at: string
  requested_completion_date: string | null
  website: {
    id: string
    name: string
    url: string
    domain_authority: number | null
    monthly_visitors: number | null
    niche: string | null
  }
  publisher: {
    id: string
    user_role: string | null
  }
  order_items: Array<{
    service_name: string
    service_description: string
    quantity: number
    unit_price: number
    total_price: number
    custom_requirements: any
  }>
  order_steps: OrderStep[]
  order_messages?: Array<{
    id: string
    message: string
    sender_type: 'advertiser' | 'publisher'
    created_at: string
  }>
  payment?: {
    invoice_url: string | null
    invoice_status: string
    paid_at: string | null
    total_amount: number
    platform_fee: number
    publisher_amount: number
  }
}

const statusConfig = {
  pending: { label: "Pending Approval", color: "bg-orange-100 text-orange-700", icon: Clock },
  accepted: { label: "Accepted", color: "bg-blue-100 text-blue-700", icon: Play },
  payment_pending: { label: "Payment Required", color: "bg-yellow-100 text-yellow-700", icon: DollarSign },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Play },
  review: { label: "Under Review", color: "bg-purple-100 text-purple-700", icon: Eye },
  revision: { label: "Needs Revision", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
  payment_processing: { label: "Processing Payment", color: "bg-blue-100 text-blue-700", icon: DollarSign },
  paid: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-700", icon: AlertCircle },
  disputed: { label: "Disputed", color: "bg-red-100 text-red-700", icon: AlertCircle },
}

const stepStatusConfig = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Play },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
  skipped: { label: "Skipped", color: "bg-gray-100 text-gray-600", icon: AlertCircle },
}

export default function OrderDetail() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  
  // Approval state
  const [approvalNotes, setApprovalNotes] = useState("")
  const [isApproving, setIsApproving] = useState(false)

  useEffect(() => {
    if (params.id && user) {
      fetchOrderDetails()
    }
  }, [params.id, user])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      setError("")

      // Fetch all order details in a single query, with explicit joins
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          website:websites!inner(*),
          publisher:profiles!publisher_id(id, user_role),
          order_items(*),
          order_steps(*),
          order_messages(*),
          payment:payments(invoice_url, invoice_status, paid_at, total_amount, platform_fee, publisher_amount)
        `)
        .eq('id', params.id)
        .single()

      if (error || !data.publisher || !data.website) {
        console.error('Error fetching order or missing related data:', error)
        setError('Order not found or you do not have permission to view it')
        return
      }

      // Handle payment data (can be object or array depending on Supabase response)
      const paymentData = Array.isArray(data.payment) 
        ? data.payment[0] || null 
        : data.payment || null

      const orderData = {
        ...data,
        payment: paymentData
      }

      console.log('Order loaded:', {
        status: orderData.status,
        paymentStatus: orderData.payment_status,
        hasPayment: !!orderData.payment,
        paymentData: orderData.payment
      })

      setOrder(orderData as OrderDetails)

    } catch (err) {
      console.error('Error fetching order:', err)
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      setSendingMessage(true)

      const { error } = await supabase
        .from('order_messages')
        .insert({
          order_id: params.id,
          message: newMessage.trim(),
          sender_type: 'advertiser'
        })

      if (error) {
        console.error('Error sending message:', error)
        return
      }

      setNewMessage("")
      fetchOrderDetails() // Refresh to get new message
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSendingMessage(false)
    }
  }

  const approveOrder = async () => {
    try {
      setIsApproving(true)

      // 1. Mark order as completed (not payment_processing yet)
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          approval_notes: approvalNotes || null
        })
        .eq('id', params.id)

      if (orderError) throw orderError

      // 2. Mark final step as completed
      const finalStep = order?.order_steps.find(s => s.step_number === 3)
      if (finalStep) {
        await supabase
          .from('order_steps')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            notes: approvalNotes || null
          })
          .eq('id', finalStep.id)
      }

      // 3. Initiate payout to publisher (call API)
      // This will update order to payment_processing AFTER payout succeeds
      const response = await fetch('/api/payments/create-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: params.id })
      })

      const result = await response.json()

      if (!response.ok) {
        // Payout failed - order stays in 'completed' status
        // Show error but don't revert (advertiser can try again)
        throw new Error(result.error || 'Failed to initiate payout')
      }

      setApprovalNotes("")
      await fetchOrderDetails()
      
      alert('Order approved! Payment is being sent to the publisher.')

    } catch (err: any) {
      console.error('Error approving order:', err)
      alert(err.message || 'Failed to approve order. Please try again.')
    } finally {
      setIsApproving(false)
    }
  }

  const requestRevision = async () => {
    if (!approvalNotes.trim()) {
      alert('Please provide revision notes')
      return
    }

    try {
      setIsApproving(true)

      // Update order to revision status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'revision',
          approval_notes: approvalNotes
        })
        .eq('id', params.id)

      if (orderError) throw orderError

      // Move step 3 back to in_progress and step 2 back to in_progress
      const secondStep = order?.order_steps.find(s => s.step_number === 2)
      if (secondStep) {
        await supabase
          .from('order_steps')
          .update({ 
            status: 'in_progress',
            notes: `Revision requested: ${approvalNotes}`
          })
          .eq('id', secondStep.id)
      }

      const thirdStep = order?.order_steps.find(s => s.step_number === 3)
      if (thirdStep) {
        await supabase
          .from('order_steps')
          .update({ status: 'pending' })
          .eq('id', thirdStep.id)
      }

      setApprovalNotes("")
      await fetchOrderDetails()
    } catch (err) {
      console.error('Error requesting revision:', err)
      alert('Failed to request revision. Please try again.')
    } finally {
      setIsApproving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatNumber = (num: number | null | undefined) => {
    if (num == null) return '0'
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
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

  const getStepStatusBadge = (status: string) => {
    const config = stepStatusConfig[status as keyof typeof stepStatusConfig] || stepStatusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge variant="secondary" className={`${config.color} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    )
  }

  const getProgressPercentage = () => {
    if (!order?.order_steps.length) return 0
    const completed = order.order_steps.filter(step => 
      step.status === 'completed' || step.status === 'skipped'
    ).length
    return Math.round((completed / order.order_steps.length) * 100)
  }

  const getCurrentStep = () => {
    return order?.order_steps.find(step => step.status === 'in_progress') ||
           order?.order_steps.find(step => step.status === 'pending')
  }

  if (loading) {
    return (
      <AdvertiserLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </AdvertiserLayout>
    )
  }

  if (error || !order) {
    return (
      <AdvertiserLayout>
        <div className="max-w-7xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-red-700">
              {error || 'Order not found'}
            </AlertDescription>
          </Alert>
        </div>
      </AdvertiserLayout>
    )
  }

  return (
    <AdvertiserLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/advertiser/orders">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{order.title}</h1>
              <p className="text-gray-600">Order #{order.id.substring(0, 8)}... • {order.website.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(order.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Order Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-gray-500">{getProgressPercentage()}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2" />
                  {getCurrentStep() && (
                    <p className="text-sm text-blue-600">
                      Current: {getCurrentStep()?.step_name}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Order Date</p>
                    <p className="text-gray-900">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Due Date</p>
                    <p className="text-gray-900">
                      {order.requested_completion_date 
                        ? formatDate(order.requested_completion_date)
                        : 'Not specified'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-gray-900 font-semibold text-lg">${order.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Description</p>
                  <p className="text-gray-900">{order.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Services & Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Services & Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.order_items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{item.service_name}</h4>
                        <span className="text-lg font-bold">${item.total_price}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.service_description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span>Quantity: {item.quantity}</span>
                        <span>Unit Price: ${item.unit_price}</span>
                      </div>
                      {item.custom_requirements && (
                        <div className="p-3 bg-gray-50 rounded-md">
                          <h5 className="font-medium text-sm mb-2">Custom Requirements:</h5>
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(item.custom_requirements, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Workflow Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Workflow Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.order_steps.map((step, index) => (
                    <div key={step.id} className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : step.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          step.step_number
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{step.step_name}</h4>
                          {getStepStatusBadge(step.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{step.step_description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Assignee: {step.assignee}</span>
                          {step.started_at && (
                            <span>Started: {formatDate(step.started_at)}</span>
                          )}
                          {step.completed_at && (
                            <span>Completed: {formatDate(step.completed_at)}</span>
                          )}
                        </div>
                        {step.notes && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                            <strong>Notes:</strong> {step.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Communication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Communication</span>
                </CardTitle>
                <CardDescription>
                  Chat with the publisher about this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Messages */}
                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {order.order_messages && order.order_messages.length > 0 ? (
                      order.order_messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`flex ${message.sender_type === 'advertiser' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender_type === 'advertiser'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium">
                                {message.sender_type === 'advertiser' ? 'You' : 'Publisher'}
                              </span>
                              <span className="text-xs opacity-70">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No messages yet. Start a conversation!</p>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                      className="min-h-[80px]"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || sendingMessage}
                      className="self-end"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Required Card */}
            {order.status === 'payment_pending' && order.payment && (
              <Card className="border-2 border-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span>Payment Required</span>
                  </CardTitle>
                  <CardDescription>Publisher has accepted your order. Please pay to proceed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Order Total:</span>
                      <span className="font-bold text-lg">${order.payment.total_amount}</span>
                    </div>
                    <div className="text-xs text-gray-500 border-t border-blue-200 pt-2">
                      <div className="flex justify-between">
                        <span>Platform Fee (15%):</span>
                        <span>${order.payment.platform_fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Publisher Receives:</span>
                        <span>${order.payment.publisher_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      let invoiceUrl = order.payment?.invoice_url || ''
                      
                      // Fix old API URLs to public URLs
                      if (invoiceUrl.includes('api.sandbox.paypal.com') || invoiceUrl.includes('api-m.sandbox.paypal.com')) {
                        const invoiceId = invoiceUrl.split('/').pop()
                        invoiceUrl = `https://www.sandbox.paypal.com/invoice/p/#${invoiceId}`
                      } else if (invoiceUrl.includes('api.paypal.com') || invoiceUrl.includes('api-m.paypal.com')) {
                        const invoiceId = invoiceUrl.split('/').pop()
                        invoiceUrl = `https://www.paypal.com/invoice/p/#${invoiceId}`
                      }
                      
                      window.open(invoiceUrl, '_blank')
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View & Pay Invoice
                  </Button>
                  <p className="text-xs text-center text-gray-500">
                    You'll be redirected to PayPal to complete payment
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Payment Processing */}
            {(order.status === 'payment_processing' || order.status === 'paid') && (
              <Alert className="border-green-300 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {order.status === 'payment_processing' ? (
                    <>
                      <div className="font-medium mb-1">💳 Processing Payment</div>
                      <p className="text-sm">Sending ${order.payment?.publisher_amount.toFixed(2)} to publisher...</p>
                    </>
                  ) : (
                    <>
                      <div className="font-medium mb-1">✅ Payment Complete</div>
                      <p className="text-sm">Publisher has been paid. Order complete!</p>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Quick Actions for Advertiser */}
            {order.status === 'review' && (
              <Card>
                <CardHeader>
                  <CardTitle>Review & Approve</CardTitle>
                  <CardDescription>Check the published work and approve or request changes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Show Published URL */}
                  {(order as any).published_url && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 mb-1">Published URL:</div>
                      <a 
                        href={(order as any).published_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all flex items-center gap-1"
                      >
                        {(order as any).published_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="approval-notes" className="text-sm font-medium">
                      Notes (optional)
                    </Label>
                    <Textarea
                      id="approval-notes"
                      placeholder="Add any feedback or comments..."
                      rows={3}
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="bg-green-600 hover:bg-green-700 w-full"
                      onClick={approveOrder}
                      disabled={isApproving}
                    >
                      {isApproving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                      Approve & Complete
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                      onClick={requestRevision}
                      disabled={isApproving}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Request Revision
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {order.status === 'completed' && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                    ✓ This order has been completed successfully!
                  </div>
                  {(order as any).published_url && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 mb-1">Published URL:</div>
                      <a 
                        href={(order as any).published_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all flex items-center gap-1"
                      >
                        {(order as any).published_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Website Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Website Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">{order.website.name}</h3>
                  <p className="text-sm text-gray-500">{order.website.url}</p>
                </div>

                {order.website.niche && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Niche</p>
                    <p className="text-sm text-gray-900">{order.website.niche}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {order.website.domain_authority && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Domain Authority</p>
                      <p className="text-sm text-gray-900">{order.website.domain_authority}</p>
                    </div>
                  )}
                  {order.website.monthly_visitors && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Visitors</p>
                      <p className="text-sm text-gray-900">{formatNumber(order.website.monthly_visitors)}</p>
                    </div>
                  )}
                </div>

                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={`https://${order.website.url}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Publisher Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Publisher</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      P
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      Publisher
                    </p>
                    <p className="text-sm text-gray-500">{order.publisher.user_role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Payment Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.order_items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.service_name} ({item.quantity}x)</span>
                    <span>${item.total_price}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${order.total_amount}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/advertiser/websites/${order.website.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Website Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdvertiserLayout>
  )
}

