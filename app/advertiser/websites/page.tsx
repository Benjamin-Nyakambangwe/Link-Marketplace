"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Filter, Star, Globe, Users, TrendingUp, DollarSign, Clock, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

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
  minimum_order_value: number
  response_time_hours: number
  status: string
  user_id: string
  created_at: string
}

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
      <div className="max-w-7xl mx-auto space-y-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="space-y-6">
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

          {/* Website Grid */}
          <div className="lg:col-span-3">
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredWebsites.map((website) => {
                  const lowestPrice = getLowestServicePrice(website.available_services)
                  
                  return (
                    <Card key={website.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-1">{website.name}</CardTitle>
                            <CardDescription className="text-sm text-blue-600 hover:underline">
                              {website.url}
                            </CardDescription>
                          </div>
                          {website.logo_url && (
                            <img 
                              src={website.logo_url} 
                              alt={website.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                        </div>
                        <Badge variant="secondary" className="w-fit">
                          {website.primary_niche}
                        </Badge>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {website.description}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">{formatNumber(website.monthly_visitors)} visitors</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">DA {website.domain_authority}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">{website.response_time_hours}h response</span>
                          </div>
                          {website.geographic_focus && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-700">{website.geographic_focus}</span>
                            </div>
                          )}
                        </div>

                        {/* Services Preview */}
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">
                            Available Services ({website.available_services?.length || 0})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {website.available_services?.slice(0, 3).map((service, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {service.name}
                              </Badge>
                            ))}
                            {(website.available_services?.length || 0) > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{(website.available_services?.length || 0) - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center space-x-2 text-sm">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">
                              {lowestPrice ? `From $${lowestPrice}` : 'Custom pricing'}
                            </span>
                          </div>
                          <Button size="sm" className="bg-teal-600 hover:bg-teal-700" asChild>
                            <Link href={`/advertiser/websites/${website.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdvertiserLayout>
  )
} 