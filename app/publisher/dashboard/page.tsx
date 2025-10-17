"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, Clock, DollarSign, Calendar, Plus, Settings, Eye, CreditCard, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import PublisherLayout from "@/components/publisher/publisher-layout"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

// Mock data
// const stats = {
//   activeWebsites: 3,
//   pendingOrders: 7,
//   monthlyEarnings: 2450,
//   lifetimeEarnings: 18750,
//   nextPayout: { amount: 1200, date: "2024-01-15" },
// }

// const recentOrders = [
//   {
//     id: "ORD-001",
//     listingId: "LST-001",
//     advertiser: "TechCorp Inc.",
//     website: "techblog.com",
//     status: "pending",
//     amount: 150,
//     createdAt: "2024-01-10",
//   },
//   {
//     id: "ORD-002",
//     listingId: "LST-002",
//     advertiser: "Marketing Pro",
//     website: "healthtips.com",
//     status: "in_progress",
//     amount: 200,
//     createdAt: "2024-01-09",
//   },
//   {
//     id: "ORD-003",
//     listingId: "LST-003",
//     advertiser: "SEO Masters",
//     website: "techblog.com",
//     status: "completed",
//     amount: 175,
//     createdAt: "2024-01-08",
//   },
// ]

// const websitePerformance = [
//   { url: "techblog.com", da: 45, monthlyVisits: "125K", earnings: 850 },
//   { url: "healthtips.com", da: 38, monthlyVisits: "89K", earnings: 650 },
//   { url: "travelguide.net", da: 42, monthlyVisits: "156K", earnings: 950 },
// ]

export default function PublisherDashboard() {
  const { user } = useAuth()
  const supabase = createClient()

  const [stats, setStats] = useState({
    activeWebsites: 0,
    pendingOrders: 0,
    monthlyEarnings: 0,
    lifetimeEarnings: 0,
    nextPayout: { amount: 0, date: "N/A" },
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [websitePerformance, setWebsitePerformance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      // @ts-ignore
      setUserName(user.user_metadata?.full_name || "Publisher")
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Fetch stats
      const { count: activeWebsites } = await supabase
        .from("websites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active")

      const { count: pendingOrders } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("publisher_id", user.id)
        .eq("status", "pending")

      // Fetch all PAID payments for the publisher
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(
          `
          publisher_amount,
          paid_at,
          order:orders!inner(website_id)
        `
        )
        .eq("order.publisher_id", user.id)
        .eq("invoice_status", "PAID")

      if (paymentsError) throw paymentsError

      // Calculate earnings
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      let monthlyEarnings = 0
      const lifetimeEarnings = paymentsData.reduce((acc, p) => {
        if (new Date(p.paid_at) >= firstDayOfMonth) {
          monthlyEarnings += p.publisher_amount
        }
        return acc + p.publisher_amount
      }, 0)

      // Calculate next payout
      const { data: payoutsData, error: payoutsError } = await supabase
        .from("payouts")
        .select("amount")
        .eq("publisher_id", user.id)
        .in("payout_status", ["SUCCESS", "PROCESSING"])

      if (payoutsError) throw payoutsError

      const totalPaidOut = (payoutsData || []).reduce((acc, p) => acc + p.amount, 0)
      const nextPayoutAmount = lifetimeEarnings - totalPaidOut

      // Calculate earnings per website
      const earningsByWebsite = (paymentsData || []).reduce(
        (acc: Record<string, number>, payment) => {
          // @ts-ignore
          const websiteId = payment.order.website_id
          if (!acc[websiteId]) {
            acc[websiteId] = 0
          }
          acc[websiteId] += payment.publisher_amount
          return acc
        },
        {}
      )

      // Fetch recent orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select(
          `
          id,
          status,
          total_amount,
          created_at,
          advertiser:profiles!advertiser_id(full_name),
          website:websites(url)
        `
        )
        .eq("publisher_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3)

      const formattedOrders = ordersData?.map((o: any) => ({
        id: o.id,
        // @ts-ignore
        advertiser: o.advertiser.full_name,
        // @ts-ignore
        website: o.website.url,
        status: o.status,
        amount: o.total_amount,
        createdAt: new Date(o.created_at).toLocaleDateString(),
      }))
      setRecentOrders(formattedOrders || [])

      // Fetch website performance
      const { data: websitesData } = await supabase
        .from("websites")
        .select(
          `
          id,
          url,
          domain_authority,
          monthly_visitors
        `
        )
        .eq("user_id", user.id)
        .order("domain_authority", { ascending: false })
        .limit(3)

      // Note: earnings calculation per website is complex and will be added later
      const performanceData = websitesData?.map((w: any) => ({
        url: w.url,
        da: w.domain_authority,
        monthlyVisits: `${(w.monthly_visitors || 0) / 1000}K`,
        // @ts-ignore
        earnings: earningsByWebsite[w.id] || 0,
      }))
      setWebsitePerformance(performanceData || [])

      setStats({
        activeWebsites: activeWebsites || 0,
        pendingOrders: pendingOrders || 0,
        monthlyEarnings,
        lifetimeEarnings,
        nextPayout: { amount: nextPayoutAmount, date: "Next payout" },
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublisherLayout>
      <div className="space-y-6">
        {/* Welcome Message */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2"> {userName}!</h1>
          <p className="text-slate-600">Here's what's happening with your websites and earnings.</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Websites</CardTitle>
              <Globe className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-1/2" /> : stats.activeWebsites}</div>
              <p className="text-xs text-slate-500">All approved and live</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-1/2" /> : stats.pendingOrders}</div>
              <p className="text-xs text-slate-500">Awaiting your response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-1/2" /> : `$${stats.monthlyEarnings.toLocaleString()}`}
              </div>
              <p className="text-xs text-slate-500">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-1/2" /> : `$${stats.nextPayout.amount.toLocaleString()}`}
              </div>
              <p className="text-xs text-slate-500">{stats.nextPayout.date}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your websites and listings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/publisher/websites/new">
                <Button className="w-full h-20 bg-teal-600 hover:bg-teal-700 flex flex-col items-center justify-center space-y-2">
                  <Plus className="w-6 h-6" />
                  <span>Add New Website</span>
                </Button>
              </Link>
              <Link href="/publisher/websites">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
                >
                  <Settings className="w-6 h-6" />
                  <span>Manage Websites</span>
                </Button>
              </Link>
              <Link href="/publisher/orders">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
                >
                  <Eye className="w-6 h-6" />
                  <span>View Orders</span>
                </Button>
              </Link>
              <Link href="/publisher/payouts">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
                >
                  <CreditCard className="w-6 h-6" />
                  <span>View Payouts</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from advertisers</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{order.advertiser}</span>
                            <Badge
                              variant={
                                order.status === "completed"
                                  ? "default"
                                  : order.status === "in_progress"
                                    ? "secondary"
                                    : "outline"
                              }
                              className={
                                order.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : order.status === "in_progress"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-orange-100 text-orange-700"
                              }
                            >
                              {order.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {order.website} • {order.createdAt}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${order.amount}</p>
                          <Link href={`/publisher/orders/${order.id}`}>
                            <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link href="/publisher/orders">
                      <Button variant="outline" className="w-full bg-transparent">
                        View All Orders
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Website Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Website Performance</CardTitle>
              <CardDescription>Overview of your website metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {websitePerformance.map((site) => (
                      <div key={site.url} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{site.url}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-slate-500 flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              DA {site.da}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {site.monthlyVisits}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">${site.earnings}</p>
                          <p className="text-xs text-slate-500">this month</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link href="/publisher/websites">
                      <Button variant="outline" className="w-full bg-transparent">
                        Manage Websites
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PublisherLayout>
  )
}
