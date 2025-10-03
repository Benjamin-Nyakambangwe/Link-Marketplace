"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, Clock, Play, CheckCircle, AlertCircle, MessageSquare, 
  User, Globe, DollarSign, Calendar, FileText, Send, ExternalLink,
  Check, X, Eye, Upload, Loader2, Link2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import PublisherLayout from "@/components/publisher/publisher-layout"
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
    service_description: string
    quantity: number
    unit_price: number
    total_price: number
    custom_requirements: any
    service_config?: any
  }>
  order_steps: OrderStep[]
  payment?: {
    invoice_url: string | null
    invoice_status: string
    paid_at: string | null
  }
}

const statusConfig = {
  pending: { label: "Pending Approval", color: "bg-orange-100 text-orange-700", icon: Clock },
  accepted: { label: "Accepted", color: "bg-blue-100 text-blue-700", icon: Play },
  payment_pending: { label: "Awaiting Payment", color: "bg-yellow-100 text-yellow-700", icon: DollarSign },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Play },
  review: { label: "Under Review", color: "bg-purple-100 text-purple-700", icon: Eye },
  revision: { label: "Needs Revision", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
  payment_processing: { label: "Processing Payment", color: "bg-blue-100 text-blue-700", icon: DollarSign },
  paid: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-700", icon: X },
  disputed: { label: "Disputed", color: "bg-red-100 text-red-700", icon: AlertCircle },
}

const stepStatusConfig = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Play },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
  skipped: { label: "Skipped", color: "bg-gray-100 text-gray-600", icon: X },
}

export default function OrderDetail() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState(false)

  // Simplified workflow state
  const [publishedUrl, setPublishedUrl] = useState("")
  const [workNotes, setWorkNotes] = useState("")

  useEffect(() => {
    if (params.id && user) {
      fetchOrderDetails()
    }
  }, [params.id, user])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      setError("")

      // Fetch all order details in a single query
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          website:websites!inner(*),
          advertiser:profiles!advertiser_id(id, user_role),
          order_items(*),
          order_steps(*),
          payment:payments(invoice_url, invoice_status, paid_at)
        `)
        .eq('id', params.id)
        .single()

      if (error || !data.website || !data.advertiser) {
        console.error('Error fetching order or missing related data:', error)
        setError('Order not found or you do not have permission to view it')
        return
      }

      // Verify this order belongs to the publisher's website
      if (data.website.user_id !== user?.id) {
        setError('You do not have permission to view this order')
        return
      }

      // Transform payment array to single object
      const orderData = {
        ...data,
        payment: data.payment?.[0] || null
      }

      setOrder(orderData as OrderDetails)

    } catch (err) {
      console.error('Error fetching order:', err)
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    try {
      setUpdating(true)

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', params.id)

      if (error) {
        console.error('Error updating order status:', error)
        return
      }

      // Refresh order data
      fetchOrderDetails()
    } catch (err) {
      console.error('Error updating order:', err)
    } finally {
      setUpdating(false)
    }
  }

  // Simplified workflow actions
  const acceptOrder = async () => {
    try {
      setUpdating(true)

      // 1. Create PayPal invoice FIRST (before updating order status)
      const response = await fetch('/api/payments/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: params.id })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create invoice')
      }

      // 2. Invoice created successfully, now update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'payment_pending',
          payment_status: 'pending'
        })
        .eq('id', params.id)

      if (orderError) {
        console.error('Error updating order:', orderError)
        throw orderError
      }

      // 3. Mark first step as completed
      const firstStep = order?.order_steps.find(s => s.step_number === 1)
      if (firstStep) {
        await supabase
          .from('order_steps')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', firstStep.id)
      }

      // 4. Refresh order to show payment status
      await fetchOrderDetails()
      
      // Show success or warning message
      if (result.warning) {
        alert(`Order accepted! ${result.warning}`)
      } else {
        alert('Order accepted! Invoice has been sent to the advertiser. You will be notified when payment is received.')
      }

    } catch (err: any) {
      console.error('Error accepting order:', err)
      alert(err.message || 'Failed to accept order. Please try again.')
      
      // Refresh to show correct state
      await fetchOrderDetails()
    } finally {
      setUpdating(false)
    }
  }

  // Helper function to sync steps based on current order status
  const syncSteps = async () => {
    if (!order) return
    
    try {
      setUpdating(true)
      
      if (order.status === 'in_progress' || order.status === 'accepted') {
        // Ensure step 1 is completed and step 2 is in progress
        const firstStep = order.order_steps.find(s => s.step_number === 1)
        const secondStep = order.order_steps.find(s => s.step_number === 2)
        
        if (firstStep?.status !== 'completed') {
          await supabase
            .from('order_steps')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', firstStep!.id)
        }
        
        if (secondStep?.status !== 'in_progress') {
          await supabase
            .from('order_steps')
            .update({ 
              status: 'in_progress',
              started_at: new Date().toISOString()
            })
            .eq('id', secondStep!.id)
        }
      }
      
      await fetchOrderDetails()
    } catch (err) {
      console.error('Error syncing steps:', err)
    } finally {
      setUpdating(false)
    }
  }

  const submitWork = async () => {
    if (!publishedUrl.trim()) {
      alert('Please provide the published URL')
      return
    }

    // Check if payment is received
    if (order?.payment_status !== 'paid') {
      alert('Cannot submit work until payment is received from advertiser.')
      return
    }

    try {
      setUpdating(true)

      // Update order with published URL and status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          published_url: publishedUrl,
          status: 'review'
        })
        .eq('id', params.id)

      if (orderError) throw orderError

      // Mark second step as completed
      const secondStep = order?.order_steps.find(s => s.step_number === 2)
      if (secondStep) {
        await supabase
          .from('order_steps')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            notes: workNotes || null
          })
          .eq('id', secondStep.id)

        // Mark third step as in_progress
        const thirdStep = order?.order_steps.find(s => s.step_number === 3)
        if (thirdStep) {
          await supabase
            .from('order_steps')
            .update({ 
              status: 'in_progress',
              started_at: new Date().toISOString()
            })
            .eq('id', thirdStep.id)
        }
      }

      setPublishedUrl("")
      setWorkNotes("")
      await fetchOrderDetails()
    } catch (err) {
      console.error('Error submitting work:', err)
    } finally {
      setUpdating(false)
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  const getQuickActions = () => {
    const actions = []
    const step2 = order?.order_steps.find(s => s.step_number === 2)

    switch (order?.status) {
      case 'pending':
        actions.push(
          <Button
            key="accept"
            className="bg-green-600 hover:bg-green-700 w-full"
            onClick={acceptOrder}
            disabled={updating}
          >
            {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Accept Order
          </Button>
        )
        actions.push(
          <Button
            key="reject"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 w-full"
            onClick={() => updateOrderStatus('cancelled')}
            disabled={updating}
          >
            <X className="w-4 h-4 mr-2" />
            Reject Order
          </Button>
        )
        break
      
      case 'accepted':
      case 'in_progress':
        // Check if steps need syncing
        const firstStep = order?.order_steps.find(s => s.step_number === 1)
        const needsSync = firstStep?.status === 'pending'
        
        // Always show the work submission form when order is accepted/in_progress
        actions.push(
          <div key="submit-work" className="w-full space-y-3">
            {needsSync && (
              <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-sm mb-3">
                <div className="text-yellow-800 font-medium mb-2">⚠ Steps need syncing</div>
          <Button
                  size="sm"
                  variant="outline"
                  className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-yellow-300"
                  onClick={syncSteps}
            disabled={updating}
          >
                  {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Fix Progress & Continue
                </Button>
              </div>
            )}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 mb-3">
              ✓ Order accepted! Complete your work and submit the published URL below.
            </div>
            <div className="space-y-2">
              <Label htmlFor="published-url" className="text-sm font-medium">
                Published URL *
              </Label>
              <Input
                id="published-url"
                type="url"
                placeholder="https://example.com/your-article"
                value={publishedUrl}
                onChange={(e) => setPublishedUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-notes" className="text-sm font-medium">
                Notes (optional)
              </Label>
              <Textarea
                id="work-notes"
                placeholder="Any notes for the advertiser..."
                rows={3}
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
              />
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 w-full"
              onClick={submitWork}
              disabled={updating || !publishedUrl.trim()}
            >
              {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Submit Completed Work
            </Button>
          </div>
        )
        break

      case 'revision':
        // Show revision notes and allow resubmission
        actions.push(
          <div key="revision-work" className="w-full space-y-3">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 mb-3">
              ⚠ Revision requested by advertiser. Please review the notes and resubmit.
              {(order as any).approval_notes && (
                <div className="mt-2 font-medium">
                  Notes: {(order as any).approval_notes}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="published-url" className="text-sm font-medium">
                Published URL *
              </Label>
              <Input
                id="published-url"
                type="url"
                placeholder="https://example.com/your-article"
                value={publishedUrl}
                onChange={(e) => setPublishedUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-notes" className="text-sm font-medium">
                Notes (optional)
              </Label>
              <Textarea
                id="work-notes"
                placeholder="Describe the changes you made..."
                rows={3}
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
              />
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 w-full"
              onClick={submitWork}
              disabled={updating || !publishedUrl.trim()}
            >
              {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Resubmit Work
          </Button>
          </div>
        )
        break

      case 'review':
        actions.push(
          <div key="review-info" className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            ✓ Work submitted! Waiting for advertiser approval.
          </div>
        )
        break

      case 'completed':
        actions.push(
          <div key="completed-info" className="w-full p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            ✓ Order completed successfully!
          </div>
        )
        break
    }

    return actions
  }

  if (loading) {
    return (
      <PublisherLayout>
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
      </PublisherLayout>
    )
  }

  if (error || !order) {
    return (
      <PublisherLayout>
        <div className="max-w-7xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-red-700">
              {error || 'Order not found'}
            </AlertDescription>
          </Alert>
        </div>
      </PublisherLayout>
    )
  }

  return (
    <PublisherLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/publisher/orders">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{order.title}</h1>
              <p className="text-gray-600">Order #{order.id.substring(0, 8)}...</p>
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
                  <span>Order Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Description</h3>
                  <p className="text-gray-600 mt-1">{order.description}</p>
                </div>

                <Separator />

                {/* Services */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Services Requested</h3>
                  <div className="space-y-3">
                    {order.order_items.map((item, index) => {
                      const config = item.service_config as any
                      const customizations = config?.customizations || {}
                      
                      return (
                        <div key={index} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{item.service_name}</h4>
                          <span className="text-lg font-bold">${item.total_price}</span>
                        </div>
                          <p className="text-sm text-gray-600 mb-3">{item.service_description}</p>
                          
                          {/* Service Specifications */}
                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div>
                              <span className="text-gray-500">Quantity:</span>
                              <span className="ml-2 font-medium">{item.quantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Unit Price:</span>
                              <span className="ml-2 font-medium">${item.unit_price}</span>
                            </div>
                            {customizations.content_niche && (
                              <div>
                                <span className="text-gray-500">Niche:</span>
                                <span className="ml-2 font-medium capitalize">{customizations.content_niche}</span>
                              </div>
                            )}
                            {customizations.link_type && (
                              <div>
                                <span className="text-gray-500">Link Type:</span>
                                <span className="ml-2 font-medium capitalize">{customizations.link_type}</span>
                              </div>
                            )}
                            {customizations.word_count && (
                              <div>
                                <span className="text-gray-500">Word Count:</span>
                                <span className="ml-2 font-medium">{customizations.word_count}</span>
                        </div>
                            )}
                          </div>

                          {/* Article File for Guest Posts */}
                          {customizations.article_file && (
                            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <h5 className="font-medium text-sm text-blue-900">Article Document:</h5>
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded border border-blue-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <FileText className="w-8 h-8 text-blue-600" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {customizations.article_file.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {(customizations.article_file.size / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      // Download the file
                                      const link = document.createElement('a')
                                      link.href = customizations.article_file.data
                                      link.download = customizations.article_file.name
                                      document.body.appendChild(link)
                                      link.click()
                                      document.body.removeChild(link)
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Link Details for Link Placement */}
                          {customizations.target_url && (
                            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
                              <div className="flex items-center space-x-2 mb-2">
                                <Link2 className="w-4 h-4 text-green-600" />
                                <h5 className="font-medium text-sm text-green-900">Link Details:</h5>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs font-medium text-green-800">Target URL:</span>
                                  <div className="bg-white p-2 rounded border border-green-100 mt-1">
                                    <a 
                                      href={customizations.target_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline break-all"
                                    >
                                      {customizations.target_url}
                                    </a>
                                  </div>
                                </div>
                                {customizations.anchor_text && (
                                  <div>
                                    <span className="text-xs font-medium text-green-800">Anchor Text:</span>
                                    <div className="bg-white p-2 rounded border border-green-100 mt-1">
                                      <span className="text-sm text-gray-700">{customizations.anchor_text}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Other Custom Requirements */}
                          {item.custom_requirements && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md">
                              <h5 className="font-medium text-sm mb-1">Additional Requirements:</h5>
                              <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                {typeof item.custom_requirements === 'string' 
                                  ? item.custom_requirements 
                                  : JSON.stringify(item.custom_requirements, null, 2)}
                              </p>
                          </div>
                        )}
                      </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Simplified Workflow Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Order Progress</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={getProgressPercentage()} className="w-32" />
                    <span className="text-sm text-gray-500">{getProgressPercentage()}%</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.order_steps.map((step) => (
                    <div 
                      key={step.id} 
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        step.status === 'completed' ? 'bg-green-50 border border-green-200' :
                        step.status === 'in_progress' ? 'bg-blue-50 border border-blue-200' :
                        'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.status === 'completed' ? 'bg-green-600 text-white' :
                        step.status === 'in_progress' ? 'bg-blue-600 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {step.status === 'completed' ? <Check className="w-4 h-4" /> : step.step_number}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{step.step_name}</h4>
                        <p className="text-xs text-gray-600">{step.step_description}</p>
                        {step.notes && (
                          <p className="text-xs text-gray-600 mt-1 italic">Note: {step.notes}</p>
                        )}
                      </div>
                      {getStepStatusBadge(step.status)}
                    </div>
                  ))}
                </div>
                
                {/* Show Published URL if available */}
                {(order as any).published_url && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-1">Published URL:</div>
                    <a 
                      href={(order as any).published_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {(order as any).published_url}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Status Alert */}
            {order.status === 'payment_pending' && (
              <Alert className="border-yellow-300 bg-yellow-50">
                <Clock className="w-4 h-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <div className="font-medium mb-2">⏳ Waiting for Payment</div>
                  <p className="text-sm">Invoice has been sent to the advertiser. You'll be notified when payment is received.</p>
                  <p className="text-sm mt-2 font-medium">⚠️ Do not start work until payment is confirmed.</p>
                  {order.payment?.invoice_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full"
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
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Invoice
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {order.status === 'in_progress' && order.payment_status === 'paid' && (
              <Alert className="border-green-300 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="font-medium mb-1">✅ Payment Received</div>
                  <p className="text-sm">${order.total_amount} confirmed. You can now start work!</p>
                </AlertDescription>
              </Alert>
            )}

            {order.status === 'paid' && (
              <Alert className="border-green-300 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="font-medium mb-1">💰 You've Been Paid!</div>
                  <p className="text-sm">Payout of ${(order.total_amount * 0.85).toFixed(2)} has been sent to your PayPal account.</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getQuickActions()}
              </CardContent>
            </Card>

            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Order Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Website</Label>
                  <div className="mt-1">
                    <div className="font-medium">{order.website.name}</div>
                    <div className="text-sm text-gray-500">{order.website.url}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Total Amount</Label>
                  <div className="mt-1 text-2xl font-bold text-green-600">
                    ${order.total_amount}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Created</Label>
                  <div className="mt-1 text-sm text-gray-900">
                    {formatDate(order.created_at)}
                  </div>
                </div>

                {order.requested_completion_date && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Due Date</Label>
                    <div className="mt-1 text-sm text-gray-900">
                      {formatDate(order.requested_completion_date)}
                    </div>
                  </div>
                )}

                {getCurrentStep() && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Current Step</Label>
                    <div className="mt-1">
                      <div className="font-medium">{getCurrentStep()?.step_name}</div>
                      <div className="text-sm text-gray-500">
                        Step {getCurrentStep()?.step_number} of {order.order_steps.length}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Advertiser Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Advertiser</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-medium">
                    {'Advertiser'}
                  </div>
                  <div className="text-sm text-gray-500">{order.advertiser.user_role}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublisherLayout>
  )
}
