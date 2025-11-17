"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Globe, Users, TrendingUp, Clock, MapPin, DollarSign, Plus, Minus, ShoppingCart, Star, Check, X, FileText, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"

import AdvertiserLayout from "@/components/advertiser/advertiser-layout"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

interface Website {
  id: string
  name: string
  url: string
  description: string
  logo_url: string | null
  monthly_visitors: number
  domain_authority: number
  average_engagement_rate: number
  primary_niche: string
  target_audience: string
  content_language: string
  geographic_focus: string
  available_services: any[]
  pricing_addons: any[]
  minimum_order_value: number
  accepts_guest_posts: boolean
  requires_approval: boolean
  response_time_hours: number
  status: string
  user_id: string
  created_at: string
}

interface OrderItem {
  service: any
  quantity: number
  customizations: {
    content_niche?: string
    link_type?: string
    word_count?: number
    [key: string]: any
  }
}

interface SelectedAddon {
  addon: any
  quantity: number
}

export default function WebsiteDetail() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const websiteId = params.id as string

  const [website, setWebsite] = useState<Website | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Order creation state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([])
  const [orderTitle, setOrderTitle] = useState("")
  const [orderDescription, setOrderDescription] = useState("")
  const [requirements, setRequirements] = useState("")
  const [contentBrief, setContentBrief] = useState("")
  const [requestedCompletionDate, setRequestedCompletionDate] = useState("")
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)

  useEffect(() => {
    if (websiteId) {
      fetchWebsite()
    }
  }, [websiteId])

  const fetchWebsite = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('id', websiteId)
        .eq('status', 'active')
        .single()

      if (error) {
        console.error('Error fetching website:', error)
        setError('Website not found or unavailable.')
        return
      }

      setWebsite(data)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const addServiceToOrder = (service: any) => {
    const existingItem = orderItems.find(item => item.service.type === service.type)
    if (existingItem) {
      setOrderItems(orderItems.map(item => 
        item.service.type === service.type 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      // Initialize with default customizations
      const defaultCustomizations: any = {}
      
      // Set default link type if available
      const linkTypes = (website as any)?.content_restrictions?.link_types
      if (linkTypes) {
        if (linkTypes.dofollow) defaultCustomizations.link_type = 'dofollow'
        else if (linkTypes.nofollow) defaultCustomizations.link_type = 'nofollow'
        else if (linkTypes.sponsored) defaultCustomizations.link_type = 'sponsored'
        else if (linkTypes.ugc) defaultCustomizations.link_type = 'ugc'
      }
      
      // Set default word count for guest posts
      if (service.type === 'guest_post' && service.min_words) {
        defaultCustomizations.word_count = service.min_words
      }
      
      setOrderItems([...orderItems, { 
        service, 
        quantity: 1, 
        customizations: defaultCustomizations 
      }])
    }
  }

  const updateOrderItemQuantity = (serviceType: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(orderItems.filter(item => item.service.type !== serviceType))
    } else {
      setOrderItems(orderItems.map(item => 
        item.service.type === serviceType 
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const updateOrderItemCustomization = (serviceType: string, key: string, value: any) => {
    setOrderItems(orderItems.map(item => 
      item.service.type === serviceType 
        ? { ...item, customizations: { ...item.customizations, [key]: value } }
        : item
    ))
  }

  const calculateItemPrice = (item: OrderItem) => {
    let price = item.service.base_price
    
    // Add content niche premium pricing
    if (item.customizations.content_niche && (website as any)?.content_restrictions?.niche_pricing) {
      const nichePremium = (website as any).content_restrictions.niche_pricing[item.customizations.content_niche]
      if (nichePremium) {
        price += parseFloat(nichePremium)
      }
    }
    
    // Add word count pricing for guest posts
    if (item.service.type === 'guest_post' && item.customizations.word_count && item.service.min_words) {
      const extraWords = Math.max(0, item.customizations.word_count - item.service.min_words)
      const pricePerWord = item.service.price_per_word || 0.10
      price += extraWords * pricePerWord
    }
    
    return price * item.quantity
  }

  const toggleAddon = (addon: any) => {
    const existing = selectedAddons.find(item => item.addon.type === addon.type)
    if (existing) {
      setSelectedAddons(selectedAddons.filter(item => item.addon.type !== addon.type))
    } else {
      setSelectedAddons([...selectedAddons, { addon, quantity: 1 }])
    }
  }

  const calculateTotal = () => {
    const servicesTotal = orderItems.reduce((total, item) => 
      total + calculateItemPrice(item), 0
    )
    const addonsTotal = selectedAddons.reduce((total, item) => 
      total + (item.addon.price * item.quantity), 0
    )
    return servicesTotal + addonsTotal
  }

  const createOrder = async () => {
    if (!user || !website) return
    
    setIsCreatingOrder(true)
    setError("")

    try {
      const total = calculateTotal()
      
      if (total < website.minimum_order_value) {
        setError(`Order total must be at least $${website.minimum_order_value}`)
        setIsCreatingOrder(false)
        return
      }

      if (orderItems.length === 0) {
        setError("Please select at least one service")
        setIsCreatingOrder(false)
        return
      }

      if (!orderTitle.trim()) {
        setError("Please provide an order title")
        setIsCreatingOrder(false)
        return
      }

      const orderPayload = {
        p_advertiser_id: user.id,
        p_website_id: website.id,
        p_title: orderTitle,
        p_description: orderDescription,
        p_requirements: requirements,
        p_content_brief: contentBrief,
        p_subtotal: orderItems.reduce((total, item) => total + (item.service.base_price * item.quantity), 0),
        p_addon_total: selectedAddons.reduce((total, item) => total + (item.addon.price * item.quantity), 0),
        p_total_amount: total,
        p_requested_completion_date: requestedCompletionDate || null,
        p_status: website.requires_approval ? 'pending' : 'accepted',
        p_order_items: orderItems.map(item => ({
          service_type: item.service.type,
          service_name: item.service.name,
          description: item.service.description,
          quantity: item.quantity,
          unit_price: calculateItemPrice(item) / item.quantity,
          total_price: calculateItemPrice(item),
          service_config: {
            ...item.service,
            customizations: item.customizations
          }
        })),
        p_order_addons: selectedAddons.map(addon => ({
          addon_type: addon.addon.type,
          addon_name: addon.addon.name,
          price: addon.addon.price
        }))
      }

      const { data: orderId, error: rpcError } = await supabase.rpc(
        'create_order_with_items',
        orderPayload
      )

      if (rpcError) {
        console.error('Error creating order:', JSON.stringify(rpcError, null, 2))
        setError(`Failed to create order: ${rpcError.message}. Please try again.`)
        setIsCreatingOrder(false)
        return
      }

      router.push(`/advertiser/orders/${orderId}?success=Order created successfully`)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred.')
      setIsCreatingOrder(false)
    }
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

  if (loading) {
    return (
      <AdvertiserLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </AdvertiserLayout>
    )
  }

  if (error && !website) {
    return (
      <AdvertiserLayout>
        <div className="max-w-2xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Link href="/advertiser/websites">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Browse
              </Button>
            </Link>
          </div>
        </div>
      </AdvertiserLayout>
    )
  }

  if (!website) return null

  return (
    <AdvertiserLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/advertiser/websites">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
          <div className="flex items-center space-x-4">
            {website.logo_url && (
              <img 
                src={website.logo_url} 
                alt={website.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{website.name}</h1>
              <a 
                href={website.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {website.url}
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Website Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Website Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{website.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Users className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <div className="text-lg font-semibold">{formatNumber(website.monthly_visitors)}</div>
                    <div className="text-xs text-gray-500">Monthly Visitors</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <div className="text-lg font-semibold">{website.domain_authority}</div>
                    <div className="text-xs text-gray-500">Domain Authority</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <div className="text-lg font-semibold">{website.response_time_hours}h</div>
                    <div className="text-xs text-gray-500">Response Time</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Star className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <div className="text-lg font-semibold">{website.average_engagement_rate}%</div>
                    <div className="text-xs text-gray-500">Engagement</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Niche:</span> {website.primary_niche}
                  </div>
                  <div>
                    <span className="font-medium">Target Audience:</span> {website.target_audience || 'General'}
                  </div>
                  <div>
                    <span className="font-medium">Geographic Focus:</span> {website.geographic_focus || 'Global'}
                  </div>
                  <div>
                    <span className="font-medium">Language:</span> {website.content_language}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  {website.accepts_guest_posts && (
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Guest Posts</span>
                    </Badge>
                  )}
                  {website.requires_approval && (
                    <Badge variant="outline">Requires Approval</Badge>
                  )}
                  <Badge variant="outline">Min Order: ${website.minimum_order_value}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Link Type Acceptance */}
            <Card>
              <CardHeader>
                <CardTitle>Link Type Acceptance</CardTitle>
                <CardDescription>
                  Types of links accepted by this website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Check both service-level and content restrictions for dofollow */}
                  {(website.available_services?.some((s: any) => s.dofollow_link) || 
                    (website as any).content_restrictions?.link_types?.dofollow) && (
                    <Badge variant="secondary" className="flex items-center space-x-1 justify-center">
                      <Check className="w-3 h-3" />
                      <span>Dofollow Links</span>
                    </Badge>
                  )}
                  {(website as any).content_restrictions?.link_types?.nofollow && (
                    <Badge variant="secondary" className="flex items-center space-x-1 justify-center">
                      <Check className="w-3 h-3" />
                      <span>Nofollow Links</span>
                    </Badge>
                  )}
                  {(website as any).content_restrictions?.link_types?.sponsored && (
                    <Badge variant="secondary" className="flex items-center space-x-1 justify-center">
                      <Check className="w-3 h-3" />
                      <span>Sponsored Attribute</span>
                    </Badge>
                  )}
                  {(website as any).content_restrictions?.link_types?.ugc && (
                    <Badge variant="secondary" className="flex items-center space-x-1 justify-center">
                      <Check className="w-3 h-3" />
                      <span>UGC Attribute</span>
                    </Badge>
                  )}
                  
                  {/* Show message if no specific link types are configured */}
                  {!(website as any).content_restrictions?.link_types && 
                   !website.available_services?.some((s: any) => s.dofollow_link) && (
                    <div className="col-span-full text-sm text-gray-500 text-center py-2">
                      Contact publisher for link type requirements
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Guest Post Specifications */}
            {website.accepts_guest_posts && (
              <Card>
                <CardHeader>
                  <CardTitle>Guest Post Specifications</CardTitle>
                  <CardDescription>
                    Requirements and guidelines for guest post submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {website.available_services?.find((s: any) => s.type === 'guest_post')?.min_words && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-lg">
                          {website.available_services.find((s: any) => s.type === 'guest_post').min_words}+
                        </div>
                        <div className="text-xs text-gray-500">Minimum Words</div>
                      </div>
                    )}
                    {website.available_services?.find((s: any) => s.type === 'guest_post')?.max_links && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-lg">
                          {website.available_services.find((s: any) => s.type === 'guest_post').max_links}
                        </div>
                        <div className="text-xs text-gray-500">Maximum Links</div>
                      </div>
                    )}
                    {website.available_services?.find((s: any) => s.type === 'guest_post')?.revisions_included && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-lg">
                          {website.available_services.find((s: any) => s.type === 'guest_post').revisions_included}
                        </div>
                        <div className="text-xs text-gray-500">Revisions Included</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Guidelines & Restrictions */}
            <Card>
              <CardHeader>
                <CardTitle>Content Guidelines & Restrictions</CardTitle>
                <CardDescription>
                  Content types accepted and any premium pricing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    This website accepts content in the <Badge variant="outline">{website.primary_niche}</Badge> niche.
                  </div>
                  
                  {/* Note: Content niche restrictions would be displayed here if stored in the database */}
                  <div className="text-sm text-gray-500">
                    Special content types and premium pricing may apply. Contact the publisher for specific requirements.
                  </div>
                  
                  {website.requires_approval && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-yellow-100">Approval Required</Badge>
                        <span className="text-sm text-yellow-800">
                          All content must be approved by the publisher before publication
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Special Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Special Conditions & Notes</CardTitle>
                <CardDescription>
                  Important information and requirements from the publisher
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Display special conditions if available */}
                  {(website as any).content_restrictions?.special_conditions ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 mb-1">Publisher Requirements:</div>
                      <div className="text-sm text-blue-800">
                        {(website as any).content_restrictions.special_conditions}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Please ensure your content meets the website's quality standards and editorial guidelines.
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900">Response Time</div>
                      <div className="text-gray-600">{website.response_time_hours} hours average</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900">Content Language</div>
                      <div className="text-gray-600">{website.content_language.toUpperCase()}</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Contact the publisher directly for specific editorial guidelines, content restrictions, or custom requirements.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Services */}
            <Card>
              <CardHeader>
                <CardTitle>Available Services</CardTitle>
                <CardDescription>
                  Select and customize the services you'd like to order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {website.available_services?.map((service, index) => {
                  const orderItem = orderItems.find(item => item.service.type === service.type)
                  const isAdded = !!orderItem
                  
                  return (
                    <div key={index} className={`border rounded-lg p-4 ${isAdded ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>From ${service.base_price}</span>
                          <span>{service.turnaround_days} days</span>
                          {service.revisions_included && (
                            <span>{service.revisions_included} revisions</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addServiceToOrder(service)}
                          variant={isAdded ? "secondary" : "default"}
                        className="ml-4"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                      {/* Customization Options - Show when service is added */}
                      {isAdded && orderItem && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                          <div className="font-medium text-sm text-blue-900">Customize Your Order:</div>
                          
                          {/* Content Niche Selector */}
                          {(website as any)?.content_restrictions?.accepted_niches?.length > 0 && (
                            <div className="space-y-2">
                              <Label htmlFor={`niche-${service.type}`} className="text-sm">
                                Content Niche {(website as any).content_restrictions.niche_pricing && <span className="text-gray-500">(affects pricing)</span>}
                              </Label>
                              <Select 
                                value={orderItem.customizations.content_niche || ''} 
                                onValueChange={(value) => updateOrderItemCustomization(service.type, 'content_niche', value)}
                              >
                                <SelectTrigger id={`niche-${service.type}`}>
                                  <SelectValue placeholder="Select content niche" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(website as any).content_restrictions.accepted_niches.map((niche: string) => {
                                    const premium = (website as any).content_restrictions.niche_pricing?.[niche]
                                    return (
                                      <SelectItem key={niche} value={niche}>
                                        {niche.charAt(0).toUpperCase() + niche.slice(1)}
                                        {premium && ` (+$${premium})`}
                                      </SelectItem>
                                    )
                                  })}
                                </SelectContent>
                              </Select>
                      </div>
                    )}
                          
                          {/* Link Type Selector */}
                          {(website as any)?.content_restrictions?.link_types && (
                            <div className="space-y-2">
                              <Label className="text-sm">Link Type</Label>
                              <div className="grid grid-cols-2 gap-2">
                                {(website as any).content_restrictions.link_types.dofollow && (
                                  <div 
                                    className={`border rounded p-2 cursor-pointer text-sm ${orderItem.customizations.link_type === 'dofollow' ? 'border-blue-500 bg-blue-100' : 'border-gray-200'}`}
                                    onClick={() => updateOrderItemCustomization(service.type, 'link_type', 'dofollow')}
                                  >
                                    <Check className={`w-3 h-3 inline mr-1 ${orderItem.customizations.link_type === 'dofollow' ? 'text-blue-600' : 'text-transparent'}`} />
                                    Dofollow
                  </div>
                                )}
                                {(website as any).content_restrictions.link_types.nofollow && (
                                  <div 
                                    className={`border rounded p-2 cursor-pointer text-sm ${orderItem.customizations.link_type === 'nofollow' ? 'border-blue-500 bg-blue-100' : 'border-gray-200'}`}
                                    onClick={() => updateOrderItemCustomization(service.type, 'link_type', 'nofollow')}
                                  >
                                    <Check className={`w-3 h-3 inline mr-1 ${orderItem.customizations.link_type === 'nofollow' ? 'text-blue-600' : 'text-transparent'}`} />
                                    Nofollow
                                  </div>
                                )}
                                {(website as any).content_restrictions.link_types.sponsored && (
                                  <div 
                                    className={`border rounded p-2 cursor-pointer text-sm ${orderItem.customizations.link_type === 'sponsored' ? 'border-blue-500 bg-blue-100' : 'border-gray-200'}`}
                                    onClick={() => updateOrderItemCustomization(service.type, 'link_type', 'sponsored')}
                                  >
                                    <Check className={`w-3 h-3 inline mr-1 ${orderItem.customizations.link_type === 'sponsored' ? 'text-blue-600' : 'text-transparent'}`} />
                                    Sponsored
                                  </div>
                                )}
                                {(website as any).content_restrictions.link_types.ugc && (
                                  <div 
                                    className={`border rounded p-2 cursor-pointer text-sm ${orderItem.customizations.link_type === 'ugc' ? 'border-blue-500 bg-blue-100' : 'border-gray-200'}`}
                                    onClick={() => updateOrderItemCustomization(service.type, 'link_type', 'ugc')}
                                  >
                                    <Check className={`w-3 h-3 inline mr-1 ${orderItem.customizations.link_type === 'ugc' ? 'text-blue-600' : 'text-transparent'}`} />
                                    UGC
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Word Count for Guest Posts */}
                          {service.type === 'guest_post' && service.min_words && (
                            <div className="space-y-2">
                              <Label htmlFor={`wordcount-${service.type}`} className="text-sm">
                                Word Count 
                                {service.price_per_word && (
                                  <span className="text-gray-500 ml-1">
                                    (${service.price_per_word}/word over {service.min_words})
                                  </span>
                                )}
                              </Label>
                              <Input
                                id={`wordcount-${service.type}`}
                                type="number"
                                min={service.min_words}
                                max={service.max_words || 5000}
                                value={orderItem.customizations.word_count || service.min_words}
                                onChange={(e) => updateOrderItemCustomization(service.type, 'word_count', parseInt(e.target.value))}
                              />
                              <div className="text-xs text-gray-500">
                                Min: {service.min_words} {service.max_words && `| Max: ${service.max_words}`}
                              </div>
                            </div>
                          )}

                          {/* Article Upload for Guest Posts */}
                          {service.type === 'guest_post' && (
                            <div className="space-y-2">
                              <Label htmlFor={`article-${service.type}`} className="text-sm font-medium">
                                Upload Article Document *
                              </Label>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                                <input
                                  id={`article-${service.type}`}
                                  type="file"
                                  accept=".doc,.docx,.txt,.pdf,.odt"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      // Check file size (max 5MB)
                                      if (file.size > 5 * 1024 * 1024) {
                                        alert('File size must be less than 5MB')
                                        e.target.value = ''
                                        return
                                      }
                                      
                                      const reader = new FileReader()
                                      reader.onload = (event) => {
                                        const base64 = event.target?.result as string
                                        updateOrderItemCustomization(service.type, 'article_file', {
                                          name: file.name,
                                          type: file.type,
                                          size: file.size,
                                          data: base64
                                        })
                                      }
                                      reader.readAsDataURL(file)
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label
                                  htmlFor={`article-${service.type}`}
                                  className="cursor-pointer flex flex-col items-center"
                                >
                                  {orderItem.customizations.article_file ? (
                                    <div className="text-center">
                                      <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                      <p className="text-sm font-medium text-green-700">
                                        {orderItem.customizations.article_file.name}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {(orderItem.customizations.article_file.size / 1024).toFixed(1)} KB
                                      </p>
                                      <p className="text-xs text-blue-600 mt-2">Click to change file</p>
                                    </div>
                                  ) : (
                                    <>
                                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                      <p className="text-sm text-gray-600">
                                        <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        DOC, DOCX, TXT, PDF, ODT (max 5MB)
                                      </p>
                                    </>
                                  )}
                                </label>
                              </div>
                              {orderItem.customizations.article_file && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateOrderItemCustomization(service.type, 'article_file', null)}
                                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Remove File
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Link Details for Link Placement */}
                          {service.type === 'link_placement' && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor={`target-url-${service.type}`} className="text-sm font-medium">
                                  Target URL *
                                </Label>
                                <Input
                                  id={`target-url-${service.type}`}
                                  type="url"
                                  placeholder="https://yourwebsite.com/page"
                                  value={orderItem.customizations.target_url || ''}
                                  onChange={(e) => updateOrderItemCustomization(service.type, 'target_url', e.target.value)}
                                />
                                <div className="text-xs text-gray-500">
                                  The URL you want to link to
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`anchor-text-${service.type}`} className="text-sm font-medium">
                                  Anchor Text *
                                </Label>
                                <Input
                                  id={`anchor-text-${service.type}`}
                                  type="text"
                                  placeholder="e.g., best SEO tools"
                                  value={orderItem.customizations.anchor_text || ''}
                                  onChange={(e) => updateOrderItemCustomization(service.type, 'anchor_text', e.target.value)}
                                />
                                <div className="text-xs text-gray-500">
                                  The clickable text for your link
                                </div>
                              </div>
                            </>
                          )}

                          {/* Link Details for Sponsored Content */}
                          {service.type === 'sponsored_content' && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor={`article-${service.type}`} className="text-sm font-medium">
                                  Article Document (optional)
                                </Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-blue-400 transition-colors">
                                  <input
                                    id={`article-${service.type}`}
                                    type="file"
                                    accept=".doc,.docx,.txt,.pdf,.odt"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        if (file.size > 5 * 1024 * 1024) {
                                          alert('File size must be less than 5MB')
                                          e.target.value = ''
                                          return
                                        }
                                        const reader = new FileReader()
                                        reader.onload = (event) => {
                                          const base64 = event.target?.result as string
                                          updateOrderItemCustomization(service.type, 'article_file', {
                                            name: file.name,
                                            type: file.type,
                                            size: file.size,
                                            data: base64
                                          })
                                        }
                                        reader.readAsDataURL(file)
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor={`article-${service.type}`}
                                    className="cursor-pointer flex flex-col items-center"
                                  >
                                    {orderItem.customizations.article_file ? (
                                      <div className="text-center">
                                        <FileText className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                        <p className="text-xs font-medium text-green-700">
                                          {orderItem.customizations.article_file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {(orderItem.customizations.article_file.size / 1024).toFixed(1)} KB
                                        </p>
                                      </div>
                                    ) : (
                                      <>
                                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                        <p className="text-xs text-gray-600">
                                          Click to upload or let publisher create content
                                        </p>
                                      </>
                                    )}
                                  </label>
                                </div>
                                {orderItem.customizations.article_file && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateOrderItemCustomization(service.type, 'article_file', null)}
                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Remove
                                  </Button>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`target-url-${service.type}`} className="text-sm font-medium">
                                  Your URL to Link
                                </Label>
                                <Input
                                  id={`target-url-${service.type}`}
                                  type="url"
                                  placeholder="https://yourwebsite.com"
                                  value={orderItem.customizations.target_url || ''}
                                  onChange={(e) => updateOrderItemCustomization(service.type, 'target_url', e.target.value)}
                                />
                              </div>
                            </>
                          )}
                          
                          <div className="pt-2 border-t">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium">Item Price:</span>
                              <span className="text-lg font-bold text-blue-600">${calculateItemPrice(orderItem).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Add-on Services */}
            {website.pricing_addons && website.pricing_addons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Add-on Services</CardTitle>
                  <CardDescription>
                    Optional extras to enhance your order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {website.pricing_addons.map((addon, index) => {
                      const isSelected = selectedAddons.some(item => item.addon.type === addon.type)
                      return (
                        <div
                          key={index}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleAddon(addon)}
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox checked={isSelected} />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{addon.name}</div>
                              <div className="text-xs text-gray-600">${addon.price}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Order Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                {orderItems.length > 0 ? (
                  <div className="space-y-4">
                    {orderItems.map((item, index) => (
                      <div key={index} className="border-b pb-3">
                        <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium">{item.service.name}</div>
                            {/* Show customizations */}
                            {Object.keys(item.customizations).length > 0 && (
                              <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                {item.customizations.content_niche && (
                                  <div>• Niche: {item.customizations.content_niche}</div>
                                )}
                                {item.customizations.link_type && (
                                  <div>• Link: {item.customizations.link_type}</div>
                                )}
                                {item.customizations.word_count && (
                                  <div>• Words: {item.customizations.word_count}</div>
                                )}
                                {item.customizations.target_url && (
                                  <div className="break-all">• URL: {item.customizations.target_url}</div>
                                )}
                                {item.customizations.anchor_text && (
                                  <div>• Anchor: {item.customizations.anchor_text}</div>
                                )}
                                {item.customizations.article_file && (
                                  <div className="italic text-green-600">• Document: {item.customizations.article_file.name} ✓</div>
                                )}
                        </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateOrderItemQuantity(item.service.type, 0)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderItemQuantity(item.service.type, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderItemQuantity(item.service.type, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          </div>
                          <div className="font-semibold">${calculateItemPrice(item).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No services selected</p>
                )}

                {/* Selected Addons */}
                {selectedAddons.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Add-ons:</div>
                      {selectedAddons.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.addon.name}</span>
                          <span>${item.addon.price}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Total */}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${calculateTotal()}</span>
                </div>

                {calculateTotal() > 0 && calculateTotal() < website.minimum_order_value && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      Minimum order value is ${website.minimum_order_value}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Order Details Form */}
                {orderItems.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="order-title" className="text-sm">Order Title *</Label>
                        <Input
                          id="order-title"
                          placeholder="Brief title for your order"
                          value={orderTitle}
                          onChange={(e) => setOrderTitle(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="order-description" className="text-sm">Description</Label>
                        <Textarea
                          id="order-description"
                          placeholder="Describe your campaign goals..."
                          rows={3}
                          value={orderDescription}
                          onChange={(e) => setOrderDescription(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="content-brief" className="text-sm">Content Brief</Label>
                        <Textarea
                          id="content-brief"
                          placeholder="Target keywords, topics, tone, audience details..."
                          rows={3}
                          value={contentBrief}
                          onChange={(e) => setContentBrief(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="requirements" className="text-sm">Additional Requirements</Label>
                        <Textarea
                          id="requirements"
                          placeholder="Any special requirements or guidelines..."
                          rows={2}
                          value={requirements}
                          onChange={(e) => setRequirements(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="completion-date" className="text-sm">Requested Completion</Label>
                        <Input
                          id="completion-date"
                          type="date"
                          value={requestedCompletionDate}
                          onChange={(e) => setRequestedCompletionDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full"
                  onClick={createOrder}
                  disabled={
                    orderItems.length === 0 || 
                    calculateTotal() < website.minimum_order_value ||
                    !orderTitle.trim() ||
                    isCreatingOrder
                  }
                >
                  {isCreatingOrder ? 'Creating Order...' : 'Place Order'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdvertiserLayout>
  )
} 