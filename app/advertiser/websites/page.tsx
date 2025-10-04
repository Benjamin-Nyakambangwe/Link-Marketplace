"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Filter, Star, Globe, Users, TrendingUp, DollarSign, Clock, MapPin, Eye, FileText, Link as LinkIcon, Video, Image, Cannabis, Bitcoin, BookHeart, Coins } from "lucide-react"
import { CircleFlag } from "react-circle-flags"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  geographic_focus: string
  available_services: any[]
  pricing_addons: any[]
  content_restrictions: any
  minimum_order_value: number
  response_time_hours: number
  status: string
  user_id: string
  created_at: string
}

const contentNicheIcons: Record<string, { icon: any; label: string }> = {
  cbd: { icon: Cannabis, label: "CBD" },
  adult: { icon: BookHeart, label: "Adult" },
  crypto: { icon: Bitcoin, label: "Crypto" },
  casino: { icon: Coins, label: "Casino" },
}

const allServiceTypes = [
  { type: 'guest_post', icon: FileText, label: 'Guest Post' },
  { type: 'link_placement', icon: LinkIcon, label: 'Link Placement' },
  { type: 'sponsored_content', icon: Star, label: 'Sponsored Content' },
]

const allAddonTypes = [
  { type: 'image_inclusion', icon: Image, label: 'Image Inclusion' },
  { type: 'video_inclusion', icon: Video, label: 'Video Inclusion' },
  { type: 'rush_delivery', icon: Clock, label: 'Rush Delivery' },
]

const niches = [
  "All Niches",
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
  "Other"
]

const sortOptions = [
  { value: "created_at", label: "Newest First" },
  { value: "domain_authority", label: "Domain Authority" },
  { value: "monthly_visitors", label: "Monthly Visitors" },
  { value: "minimum_order_value", label: "Min Order Value" },
]

export default function BrowseWebsites() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [websites, setWebsites] = useState<Website[]>([])
  const [filteredWebsites, setFilteredWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNiche, setSelectedNiche] = useState("All Niches")
  const [minDomainAuthority, setMinDomainAuthority] = useState("")
  const [maxOrderValue, setMaxOrderValue] = useState("")
  const [sortBy, setSortBy] = useState("created_at")

  useEffect(() => {
    fetchWebsites()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [websites, searchQuery, selectedNiche, minDomainAuthority, maxOrderValue, sortBy])

  const fetchWebsites = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching websites:', error)
        setError('Failed to load websites. Please try again.')
        return
      }

      setWebsites(data || [])
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...websites]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(website => 
        website.name.toLowerCase().includes(query) ||
        website.description.toLowerCase().includes(query) ||
        website.primary_niche.toLowerCase().includes(query) ||
        website.target_audience?.toLowerCase().includes(query)
      )
    }

    // Niche filter
    if (selectedNiche !== "All Niches") {
      filtered = filtered.filter(website => website.primary_niche === selectedNiche)
    }

    // Domain Authority filter
    if (minDomainAuthority) {
      filtered = filtered.filter(website => website.domain_authority >= parseInt(minDomainAuthority))
    }

    // Max Order Value filter
    if (maxOrderValue) {
      filtered = filtered.filter(website => website.minimum_order_value <= parseFloat(maxOrderValue))
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'domain_authority':
          return b.domain_authority - a.domain_authority
        case 'monthly_visitors':
          return b.monthly_visitors - a.monthly_visitors
        case 'minimum_order_value':
          return a.minimum_order_value - b.minimum_order_value
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredWebsites(filtered)
  }

  const getLowestServicePrice = (services: any[]) => {
    if (!services || services.length === 0) return null
    return Math.min(...services.map(service => service.base_price || 0))
  }

  const formatNumber = (num: number) => {
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
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-96" />
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          </div>
        </div>
      </AdvertiserLayout>
    )
  }

  return (
    <AdvertiserLayout>
      <div className="max-w-9xl ml-5 mr-5 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Browse Websites</h1>
            <p className="text-slate-600">Find the perfect websites for your advertising campaigns</p>
          </div>
          <div className="text-sm text-slate-500">
            {filteredWebsites.length} websites available
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="search"
                      placeholder="Search websites..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Niche */}
                <div className="space-y-2">
                  <Label>Niche</Label>
                  <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                    <SelectTrigger>
                      <SelectValue />
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

                {/* Domain Authority */}
                <div className="space-y-2">
                  <Label htmlFor="domain-authority">Min Domain Authority</Label>
                  <Input
                    id="domain-authority"
                    type="number"
                    placeholder="e.g. 30"
                    value={minDomainAuthority}
                    onChange={(e) => setMinDomainAuthority(e.target.value)}
                  />
                </div>

                {/* Max Order Value */}
                <div className="space-y-2">
                  <Label htmlFor="max-order">Max Order Value ($)</Label>
                  <Input
                    id="max-order"
                    type="number"
                    placeholder="e.g. 500"
                    value={maxOrderValue}
                    onChange={(e) => setMaxOrderValue(e.target.value)}
                  />
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedNiche("All Niches")
                    setMinDomainAuthority("")
                    setMaxOrderValue("")
                    setSortBy("created_at")
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Website Table */}
          <div className="lg:col-span-9">
            {filteredWebsites.length === 0 ? (
              <Card className="p-12 text-center">
                <Globe className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No websites found</h3>
                <p className="text-slate-600 mb-4">
                  Try adjusting your filters or search terms to find more results.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedNiche("All Niches")
                    setMinDomainAuthority("")
                    setMaxOrderValue("")
                  }}
                >
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <TooltipProvider>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">Website</TableHead>
                          <TableHead className="text-center">Price</TableHead>
                          <TableHead className="text-center">Authority</TableHead>
                          <TableHead className="text-center">Traffic</TableHead>
                          <TableHead className="text-center">Country</TableHead>
                          <TableHead className="w-[200px]">Primary Niche</TableHead>
                          <TableHead className="text-center">Services</TableHead>
                          <TableHead className="text-center">Accepted Niches</TableHead>
                          <TableHead className="text-center">Addons</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWebsites.map((website) => {
                          const lowestPrice = getLowestServicePrice(website.available_services)
                          const acceptedNiches = website.content_restrictions?.accepted_niches || []
                          
                          return (
                            <TableRow key={website.id} className="hover:bg-slate-50">
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={`https://www.google.com/s2/favicons?domain=${website.url}&sz=64`}
                                    alt={`${website.name} favicon`}
                                    width={24}
                                    height={24}
                                    className="rounded"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-medium text-slate-900 truncate">{website.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{website.url}</p>
                                  </div>
                                </div>
                              </TableCell>
                              
                              <TableCell className="text-center">
                                <span className="font-semibold text-teal-600">
                                  {lowestPrice ? `$${lowestPrice}` : 'N/A'}
                                </span>
                              </TableCell>
                              
                              <TableCell className="text-center">
                                <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                                  {website.domain_authority || 'N/A'}
                                </Badge>
                              </TableCell>
                              
                              <TableCell className="text-center">
                                <span className="text-sm text-slate-700">
                                  {formatNumber(website.monthly_visitors)}
                                </span>
                              </TableCell>
                              
                              <TableCell className="text-center">
                                {website.geographic_focus && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <CircleFlag
                                        countryCode={website.geographic_focus.toLowerCase()}
                                        className="w-6 h-6 mx-auto"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {website.geographic_focus}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </TableCell>
                              
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {website.primary_niche}
                                </Badge>
                              </TableCell>
                              
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  {allServiceTypes.map((serviceType) => {
                                    const isAvailable = website.available_services?.some(s => s.type === serviceType.type)
                                    const ServiceIcon = serviceType.icon
                                    return (
                                      <Tooltip key={serviceType.type}>
                                        <TooltipTrigger>
                                          <ServiceIcon className={`w-4 h-4 ${isAvailable ? 'text-teal-600' : 'text-slate-300'}`} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {serviceType.label} {isAvailable ? '(Available)' : '(Not Available)'}
                                        </TooltipContent>
                                      </Tooltip>
                                    )
                                  })}
                                </div>
                              </TableCell>
                              
                              <TableCell>
                                <div className="flex items-center justify-center flex-wrap gap-1">
                                  {Object.keys(contentNicheIcons).map((nicheKey) => {
                                    const isAccepted = acceptedNiches.includes(nicheKey)
                                    const IconComponent = contentNicheIcons[nicheKey].icon
                                    return (
                                      <Tooltip key={nicheKey}>
                                        <TooltipTrigger>
                                          <IconComponent
                                            className={`w-4 h-4 ${
                                              isAccepted ? 'text-teal-600' : 'text-slate-300'
                                            }`}
                                          />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {contentNicheIcons[nicheKey].label}
                                          {isAccepted ? ' (Accepted)' : ' (Not Accepted)'}
                                        </TooltipContent>
                                      </Tooltip>
                                    )
                                  })}
                                </div>
                              </TableCell>
                              
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  {allAddonTypes.map((addonType) => {
                                    const addon = website.pricing_addons?.find(a => a.type === addonType.type)
                                    const isAvailable = !!addon
                                    const AddonIcon = addonType.icon
                                    return (
                                      <Tooltip key={addonType.type}>
                                        <TooltipTrigger>
                                          <AddonIcon className={`w-4 h-4 ${isAvailable ? 'text-teal-600' : 'text-slate-300'}`} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {addonType.label} {isAvailable ? `- $${addon.price}` : '(Not Available)'}
                                        </TooltipContent>
                                      </Tooltip>
                                    )
                                  })}
                                </div>
                              </TableCell>
                              
                              <TableCell className="text-center">
                                <Button size="sm" className="bg-teal-600 hover:bg-teal-700" asChild>
                                  <Link href={`/advertiser/websites/${website.id}`}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TooltipProvider>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdvertiserLayout>
  )
} 