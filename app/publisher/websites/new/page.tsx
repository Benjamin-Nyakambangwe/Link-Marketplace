"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Globe, ArrowLeft, DollarSign, LinkIcon, FileText, Star, ImageIcon, Video, Zap } from "lucide-react"
import Link from "next/link"
import PublisherLayout from "@/components/publisher/publisher-layout"
import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const niches = [
  "Technology",
  "Health & Wellness",
  "Travel",
  "Finance",
  "Fashion & Beauty",
  "Food & Cooking",
  "Sports & Fitness",
  "Business",
  "Education",
  "Entertainment",
  "Real Estate",
  "E-commerce",
]

const contentNiches = [
  { key: "cbd", label: "CBD", description: "Cannabis and CBD-related content" },
  { key: "casino", label: "Casino/Gambling", description: "Gambling and casino content" },
  { key: "adult", label: "Adult", description: "Adult-oriented content" },
  { key: "pharma", label: "Pharmaceutical", description: "Pharmaceutical and medical products" },
  { key: "finance", label: "Finance/Investment", description: "Financial services and investment" },
  { key: "legal", label: "Legal", description: "Legal services and advice" },
  { key: "health", label: "Health/Medical", description: "Health and medical content" },
  { key: "crypto", label: "Cryptocurrency", description: "Cryptocurrency and blockchain" },
  { key: "tech", label: "Tech/Software", description: "Technology and software" },
  { key: "travel", label: "Travel/Hospitality", description: "Travel and hospitality" },
  { key: "fashion", label: "Fashion/Beauty", description: "Fashion and beauty" },
  { key: "realestate", label: "Real Estate", description: "Real estate and property" },
  { key: "ecommerce", label: "E-commerce", description: "E-commerce and retail" },
]

export default function AddWebsite() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    websiteUrl: "",
    niche: "",
    domainAuthority: "",
    monthlyVisits: "",
    engagementRate: "",
    geographicFocus: "",
    trafficSource: "",
    description: "",
    targetAudience: "",
    contactEmail: "",
    // Service acceptance
    acceptsLinkPlacement: false,
    basePriceLinkPlacement: "",
    acceptsGuestPost: false,
    basePriceGuestPost: "",
    acceptsSponsoredContent: false,
    basePriceSponsoredContent: "",
    // Link types
    acceptsDofollow: false,
    acceptsNofollow: false,
    acceptsSponsored: false,
    acceptsUgc: false,
    // Placement specifics
    acceptsHomepage: false,
    premiumPriceHomepage: "",
    acceptsExistingContent: false,
    basePriceExistingContent: "",
    acceptsNewContent: false,
    // Content niches
    contentNicheAcceptance: {} as Record<string, boolean>,
    contentNichePricing: {} as Record<string, string>,
    // Guest post specifics
    minWordCount: "",
    maxLinks: "",
    pricePerAdditionalWord: "",
    // Add-ons
    acceptsImageInclusion: false,
    priceImageInclusion: "",
    acceptsVideoInclusion: false,
    priceVideoInclusion: "",
    acceptsFastTurnaround: false,
    priceFastTurnaround: "",
    fastTurnaroundDays: "",
    // Notes
    specialConditions: "",
    listingActive: true,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleContentNicheToggle = (niche: string, accepted: boolean) => {
    setFormData((prev) => ({
      ...prev,
      contentNicheAcceptance: {
        ...prev.contentNicheAcceptance,
        [niche]: accepted,
      },
    }))
  }

  const handleContentNichePricing = (niche: string, price: string) => {
    setFormData((prev) => ({
      ...prev,
      contentNichePricing: {
        ...prev.contentNichePricing,
        [niche]: price,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!user) {
      setError("You must be logged in to add a website")
      setIsLoading(false)
      return
    }

    try {
      // Build available services array based on form data
      const availableServices = []
      
      // Guest Posts
      if (formData.acceptsGuestPost) {
        availableServices.push({
          type: "guest_post",
          name: "Guest Post",
          description: "Full-length guest article with backlinks",
          base_price: formData.basePriceGuestPost ? parseFloat(formData.basePriceGuestPost) : 200,
          pricing_model: "fixed",
          min_words: formData.minWordCount ? parseInt(formData.minWordCount) : 500,
          max_words: 2000,
          turnaround_days: 7,
          revisions_included: 2,
          dofollow_link: formData.acceptsDofollow || false,
          max_links: formData.maxLinks ? parseInt(formData.maxLinks) : 2
        })
      }
      
      // Link Placement
      if (formData.acceptsLinkPlacement) {
        availableServices.push({
          type: "link_placement",
          name: "Link Placement",
          description: "Link insertion in existing content",
          base_price: formData.basePriceLinkPlacement ? parseFloat(formData.basePriceLinkPlacement) : 100,
          pricing_model: "fixed",
          turnaround_days: 3,
          dofollow_link: formData.acceptsDofollow || false
        })
      }
      
      // Sponsored Content
      if (formData.acceptsSponsoredContent) {
        availableServices.push({
          type: "sponsored_content",
          name: "Sponsored Content",
          description: "Sponsored article or content placement",
          base_price: formData.basePriceSponsoredContent ? parseFloat(formData.basePriceSponsoredContent) : 300,
          pricing_model: "fixed",
          turnaround_days: 5,
          revisions_included: 1,
          dofollow_link: formData.acceptsDofollow || false
        })
      }

      // Build pricing addons array
      const pricingAddons = []
      
      if (formData.acceptsImageInclusion && formData.priceImageInclusion) {
        pricingAddons.push({
          type: "image_inclusion",
          name: "Image Inclusion",
          price: parseFloat(formData.priceImageInclusion)
        })
      }
      
      if (formData.acceptsVideoInclusion && formData.priceVideoInclusion) {
        pricingAddons.push({
          type: "video_inclusion", 
          name: "Video Inclusion",
          price: parseFloat(formData.priceVideoInclusion)
        })
      }
      
      if (formData.acceptsFastTurnaround && formData.priceFastTurnaround) {
        pricingAddons.push({
          type: "rush_delivery",
          name: `Rush Delivery (${formData.fastTurnaroundDays || 1} day)`,
          price: parseFloat(formData.priceFastTurnaround)
        })
      }

      // Build content restrictions object
      const contentRestrictions = {
        accepted_niches: Object.keys(formData.contentNicheAcceptance).filter(
          niche => formData.contentNicheAcceptance[niche]
        ),
        niche_pricing: formData.contentNichePricing,
        link_types: {
          dofollow: formData.acceptsDofollow,
          nofollow: formData.acceptsNofollow,
          sponsored: formData.acceptsSponsored,
          ugc: formData.acceptsUgc
        },
        special_conditions: formData.specialConditions || null
      }

      // Prepare data for database using new schema structure
      const websiteData = {
        user_id: user.id,
        url: formData.websiteUrl,
        name: formData.websiteUrl.replace(/^https?:\/\//, ''), // Extract domain as name
        description: formData.description,
        domain_authority: formData.domainAuthority ? parseInt(formData.domainAuthority) : null,
        monthly_visitors: formData.monthlyVisits ? parseInt(formData.monthlyVisits.replace(/,/g, '')) : null,
        primary_niche: formData.niche,
        target_audience: formData.targetAudience || formData.description,
        content_language: 'en',
        geographic_focus: formData.geographicFocus || 'Global',
        
        // JSON-based service configuration
        available_services: availableServices,
        pricing_addons: pricingAddons,
        
        // Content restrictions and special conditions
        content_restrictions: contentRestrictions,
        
        // Business settings
        minimum_order_value: 50,
        accepts_guest_posts: formData.acceptsGuestPost || false,
        requires_approval: true,
        response_time_hours: 24,
        
        // Status
        status: formData.listingActive ? 'active' : 'paused'
      }

      const { data, error } = await supabase
        .from('websites')
        .insert([websiteData])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        console.error('Error details:', JSON.stringify(error))
        
        // Handle empty error objects or network issues
        if (!error.message || Object.keys(error).length === 0) {
          setError("Connection error. Please check your internet connection and try again.")
        } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_INTERNET_DISCONNECTED')) {
          setError("Network connection error. Please check your internet connection and try again.")
        } else {
          setError(error.message || "Failed to save website. Please try again.")
        }
        setIsLoading(false)
        return
      }

      // Success! Redirect to websites list
      router.push('/publisher/websites?success=Website added successfully')
      
    } catch (err) {
      console.error('Unexpected error:', err)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <PublisherLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/publisher/websites">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Websites
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Add New Website</h1>
            <p className="text-slate-600">Set up your website and service offerings</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-teal-600" />
                <span>Basic Information</span>
              </CardTitle>
              <CardDescription>
                Provide essential details about your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL *</Label>
                  <Input
                    id="websiteUrl"
                    placeholder="https://example.com"
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="niche">Primary Niche *</Label>
                  <Select value={formData.niche} onValueChange={(value) => handleInputChange("niche", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your niche" />
                    </SelectTrigger>
                    <SelectContent>
                      {niches.map((niche) => (
                        <SelectItem key={niche} value={niche}>
                          {niche}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyVisits">Monthly Visitors</Label>
                  <Input
                    id="monthlyVisits"
                    type="number"
                    placeholder="50000"
                    value={formData.monthlyVisits}
                    onChange={(e) => handleInputChange("monthlyVisits", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domainAuthority">Domain Authority</Label>
                  <Input
                    id="domainAuthority"
                    type="number"
                    placeholder="45"
                    min="0"
                    max="100"
                    value={formData.domainAuthority}
                    onChange={(e) => handleInputChange("domainAuthority", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engagementRate">Engagement Rate (%)</Label>
                  <Input
                    id="engagementRate"
                    type="number"
                    placeholder="3.5"
                    step="0.1"
                    value={formData.engagementRate || ""}
                    onChange={(e) => handleInputChange("engagementRate", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="geographicFocus">Geographic Focus</Label>
                  <Input
                    id="geographicFocus"
                    placeholder="US, Global, Europe, etc."
                    value={formData.geographicFocus || ""}
                    onChange={(e) => handleInputChange("geographicFocus", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trafficSource">Primary Traffic Source</Label>
                  <Input
                    id="trafficSource"
                    placeholder="Organic search, social media, direct, etc."
                    value={formData.trafficSource}
                    onChange={(e) => handleInputChange("trafficSource", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your website, audience, and content focus..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  placeholder="Tech professionals, startup founders, developers..."
                  value={formData.targetAudience || ""}
                  onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Service Offerings & Base Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-teal-600" />
                <span>Service Offerings & Base Pricing</span>
              </CardTitle>
              <CardDescription>Define what services you offer and your base pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="w-4 h-4 text-teal-600" />
                      <Label>Link Placement</Label>
                    </div>
                    <Switch
                      checked={formData.acceptsLinkPlacement}
                      onCheckedChange={(checked) => handleInputChange("acceptsLinkPlacement", checked)}
                    />
                  </div>
                  {formData.acceptsLinkPlacement && (
                    <div className="space-y-2">
                      <Label htmlFor="basePriceLinkPlacement">Base Price ($)</Label>
                      <Input
                        id="basePriceLinkPlacement"
                        type="number"
                        placeholder="150"
                        value={formData.basePriceLinkPlacement}
                        onChange={(e) => handleInputChange("basePriceLinkPlacement", e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <Label>Guest Post</Label>
                    </div>
                    <Switch
                      checked={formData.acceptsGuestPost}
                      onCheckedChange={(checked) => handleInputChange("acceptsGuestPost", checked)}
                    />
                  </div>
                  {formData.acceptsGuestPost && (
                    <div className="space-y-2">
                      <Label htmlFor="basePriceGuestPost">Base Price ($)</Label>
                      <Input
                        id="basePriceGuestPost"
                        type="number"
                        placeholder="200"
                        value={formData.basePriceGuestPost}
                        onChange={(e) => handleInputChange("basePriceGuestPost", e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-teal-600" />
                      <Label>Sponsored Content</Label>
                    </div>
                    <Switch
                      checked={formData.acceptsSponsoredContent}
                      onCheckedChange={(checked) => handleInputChange("acceptsSponsoredContent", checked)}
                    />
                  </div>
                  {formData.acceptsSponsoredContent && (
                    <div className="space-y-2">
                      <Label htmlFor="basePriceSponsoredContent">Base Price ($)</Label>
                      <Input
                        id="basePriceSponsoredContent"
                        type="number"
                        placeholder="300"
                        value={formData.basePriceSponsoredContent}
                        onChange={(e) => handleInputChange("basePriceSponsoredContent", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Link Type Acceptance */}
          <Card>
            <CardHeader>
              <CardTitle>Link Type Acceptance</CardTitle>
              <CardDescription>Specify which types of links you accept</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.acceptsDofollow}
                    onCheckedChange={(checked) => handleInputChange("acceptsDofollow", checked)}
                  />
                  <Label>Dofollow Links</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.acceptsNofollow}
                    onCheckedChange={(checked) => handleInputChange("acceptsNofollow", checked)}
                  />
                  <Label>Nofollow Links</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.acceptsSponsored}
                    onCheckedChange={(checked) => handleInputChange("acceptsSponsored", checked)}
                  />
                  <Label>Sponsored Attribute</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.acceptsUgc}
                    onCheckedChange={(checked) => handleInputChange("acceptsUgc", checked)}
                  />
                  <Label>UGC Attribute</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Niche Acceptance & Premium Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Content Niche Acceptance & Premium Pricing</CardTitle>
              <CardDescription>
                Select which content niches you accept and set premium pricing for specialized content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentNiches.map((niche) => (
                  <div key={niche.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Switch
                          checked={formData.contentNicheAcceptance[niche.key] || false}
                          onCheckedChange={(checked) => handleContentNicheToggle(niche.key, checked)}
                        />
                        <Label className="font-medium">{niche.label}</Label>
                      </div>
                      <p className="text-sm text-slate-500">{niche.description}</p>
                    </div>
                    {formData.contentNicheAcceptance[niche.key] && (
                      <div className="ml-4 w-32">
                        <Label htmlFor={`premium-${niche.key}`} className="text-xs">
                          Premium Price ($)
                        </Label>
                        <Input
                          id={`premium-${niche.key}`}
                          type="number"
                          placeholder="50"
                          value={formData.contentNichePricing[niche.key] || ""}
                          onChange={(e) => handleContentNichePricing(niche.key, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Guest Post Specifics */}
          {formData.acceptsGuestPost && (
            <Card>
              <CardHeader>
                <CardTitle>Guest Post Specifics</CardTitle>
                <CardDescription>Define your guest post requirements and pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minWordCount">Minimum Word Count</Label>
                    <Input
                      id="minWordCount"
                      type="number"
                      placeholder="800"
                      value={formData.minWordCount}
                      onChange={(e) => handleInputChange("minWordCount", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLinks">Maximum Links</Label>
                    <Input
                      id="maxLinks"
                      type="number"
                      placeholder="3"
                      value={formData.maxLinks}
                      onChange={(e) => handleInputChange("maxLinks", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerAdditionalWord">Price per Additional Word ($)</Label>
                    <Input
                      id="pricePerAdditionalWord"
                      type="number"
                      step="0.01"
                      placeholder="0.10"
                      value={formData.pricePerAdditionalWord}
                      onChange={(e) => handleInputChange("pricePerAdditionalWord", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Services / Add-ons */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Services & Add-ons</CardTitle>
              <CardDescription>Offer additional services to increase your earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="w-4 h-4 text-teal-600" />
                        <Label>Image Inclusion</Label>
                      </div>
                      <Switch
                        checked={formData.acceptsImageInclusion}
                        onCheckedChange={(checked) => handleInputChange("acceptsImageInclusion", checked)}
                      />
                    </div>
                    {formData.acceptsImageInclusion && (
                      <div className="space-y-2">
                        <Label htmlFor="priceImageInclusion">Add-on Price ($)</Label>
                        <Input
                          id="priceImageInclusion"
                          type="number"
                          placeholder="25"
                          value={formData.priceImageInclusion}
                          onChange={(e) => handleInputChange("priceImageInclusion", e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Video className="w-4 h-4 text-teal-600" />
                        <Label>Video Inclusion</Label>
                      </div>
                      <Switch
                        checked={formData.acceptsVideoInclusion}
                        onCheckedChange={(checked) => handleInputChange("acceptsVideoInclusion", checked)}
                      />
                    </div>
                    {formData.acceptsVideoInclusion && (
                      <div className="space-y-2">
                        <Label htmlFor="priceVideoInclusion">Add-on Price ($)</Label>
                        <Input
                          id="priceVideoInclusion"
                          type="number"
                          placeholder="50"
                          value={formData.priceVideoInclusion}
                          onChange={(e) => handleInputChange("priceVideoInclusion", e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-teal-600" />
                        <Label>Fast Turnaround</Label>
                      </div>
                      <Switch
                        checked={formData.acceptsFastTurnaround}
                        onCheckedChange={(checked) => handleInputChange("acceptsFastTurnaround", checked)}
                      />
                    </div>
                    {formData.acceptsFastTurnaround && (
                      <div className="space-y-2">
                        <Label htmlFor="priceFastTurnaround">Add-on Price ($)</Label>
                        <Input
                          id="priceFastTurnaround"
                          type="number"
                          placeholder="75"
                          value={formData.priceFastTurnaround}
                          onChange={(e) => handleInputChange("priceFastTurnaround", e.target.value)}
                        />
                        <Label htmlFor="fastTurnaroundDays">Turnaround Days</Label>
                        <Input
                          id="fastTurnaroundDays"
                          type="number"
                          placeholder="2"
                          value={formData.fastTurnaroundDays}
                          onChange={(e) => handleInputChange("fastTurnaroundDays", e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Conditions & Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Special Conditions & Notes</CardTitle>
              <CardDescription>Add any special requirements or conditions for your services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="specialConditions">Special Conditions</Label>
                  <Textarea
                    id="specialConditions"
                    placeholder="Any special requirements, editorial guidelines, or conditions for your services..."
                    value={formData.specialConditions}
                    onChange={(e) => handleInputChange("specialConditions", e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label className="font-medium">Listing Active</Label>
                    <p className="text-sm text-slate-500">Make this website visible to advertisers</p>
                  </div>
                  <Switch
                    checked={formData.listingActive}
                    onCheckedChange={(checked) => handleInputChange("listingActive", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/publisher/websites" className="flex-1">
              <Button type="button" variant="outline" className="w-full bg-transparent">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-teal-600 hover:bg-teal-700">
              {isLoading ? "Saving..." : "Save Website"}
            </Button>
          </div>
        </form>
      </div>
    </PublisherLayout>
  )
}
