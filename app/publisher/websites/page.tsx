"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Globe, Plus, Edit, Eye, FileText, Search, Filter, TrendingUp, Users, DollarSign, Loader2 } from "lucide-react"
import Link from "next/link"
import PublisherLayout from "@/components/publisher/publisher-layout"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Website {
  id: string
  url: string
  name: string
  primary_niche: string
  domain_authority: number | null
  monthly_visitors: number | null
  status: string
  created_at: string
}

export default function MyWebsites() {
  const { user } = useAuth()
  const [websites, setWebsites] = useState<Website[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredWebsites, setFilteredWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchWebsites()
    }
  }, [user])

  useEffect(() => {
    const filtered = websites.filter(
      (website) =>
        website.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        website.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        website.primary_niche.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredWebsites(filtered)
  }, [websites, searchTerm])

  const fetchWebsites = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', user?.id)
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

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const toggleWebsiteStatus = async (websiteId: string) => {
    try {
      const website = websites.find(w => w.id === websiteId)
      if (!website) return

      const newStatus = website.status === 'active' ? 'paused' : 'active'

      const { error } = await supabase
        .from('websites')
        .update({ status: newStatus })
        .eq('id', websiteId)

      if (error) {
        console.error('Error updating website:', error)
        return
      }

      // Update local state
      setWebsites(prev => prev.map(w => 
        w.id === websiteId 
          ? { ...w, status: newStatus }
          : w
      ))
    } catch (err) {
      console.error('Error toggling website status:', err)
    }
  }

  if (loading) {
    return (
      <PublisherLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="ml-2 text-slate-600">Loading your websites...</span>
        </div>
      </PublisherLayout>
    )
  }

  return (
    <PublisherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Websites</h1>
            <p className="text-slate-600">Manage your websites and service offerings</p>
          </div>
          <Link href="/publisher/websites/new">
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Website
            </Button>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search websites by URL or niche..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="sm:w-auto bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Websites Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredWebsites.map((website) => (
            <Card key={website.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${website.url}&sz=64`}
                      alt={`${website.name} favicon`}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{website.name}</span>
                      </CardTitle>
                      <CardDescription className="mt-1">{website.primary_niche}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={website.status === "approved" ? "default" : "secondary"}
                    className={
                      website.status === "approved" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    }
                  >
                    {website.status === "approved" ? "Approved" : "Pending Review"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center space-x-1 text-sm text-slate-500 mb-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>DA</span>
                    </div>
                    <p className="font-semibold">{website.domain_authority || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center space-x-1 text-sm text-slate-500 mb-1">
                      <Users className="w-3 h-3" />
                      <span>Visits</span>
                    </div>
                    <p className="font-semibold">{website.monthly_visitors || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center space-x-1 text-sm text-slate-500 mb-1">
                      <DollarSign className="w-3 h-3" />
                      <span>Earned</span>
                    </div>
                    <p className="font-semibold text-green-600">$0</p>
                  </div>
                </div>

                {/* Status and Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Website Status</p>
                    <p className="text-xs text-slate-500">
                      {website.status === 'active' ? "Accepting new orders" : "Not accepting orders"}
                    </p>
                  </div>
                  <Switch
                    checked={website.status === 'active'}
                    onCheckedChange={() => toggleWebsiteStatus(website.id)}
                  />
                </div>

                {/* Quick Stats */}
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>0 total orders</span>
                  <span>0 pending orders</span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link href={`/publisher/websites/${website.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Details
                    </Button>
                  </Link>
                  <Link href="/publisher/orders" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Eye className="w-4 h-4 mr-2" />
                      View Orders
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {!loading && filteredWebsites.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Globe className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No websites found</h3>
              <p className="text-slate-600 mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first website"}
              </p>
              {!searchTerm && (
                <Link href="/publisher/websites/new">
                  <Button className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Website
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PublisherLayout>
  )
}
