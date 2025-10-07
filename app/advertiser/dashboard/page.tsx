"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search, ShoppingCart, DollarSign, TrendingUp, Clock, Eye, MessageSquare, Star } from "lucide-react"
import Link from "next/link"
import AdvertiserLayout from "@/components/advertiser/advertiser-layout"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

const statsTemplate = [
  {
    name: "Active Orders",
    value: "0",
    change: "",
    changeType: "positive",
    icon: ShoppingCart,
    key: "activeOrders",
  },
  {
    name: "Total Spent",
    value: "$0",
    change: "",
    changeType: "positive",
    icon: DollarSign,
    key: "totalSpent",
  },
  {
    name: "Links Placed",
    value: "0",
    change: "",
    changeType: "positive",
    icon: TrendingUp,
    key: "linksPlaced",
  },
  {
    name: "Pending Payments",
    value: "$0",
    change: "",
    changeType: "positive",
    icon: Clock,
    key: "pendingPayments",
  },
]

const quickActions = [
  {
    title: "Browse New Listings",
    description: "Find high-quality websites for your campaigns",
    icon: Search,
    href: "/advertiser/listings",
    color: "bg-blue-500",
  },
  {
    title: "View My Orders",
    description: "Track progress of your active campaigns",
    icon: ShoppingCart,
    href: "/advertiser/orders",
    color: "bg-green-500",
  },
  {
    title: "Check Messages",
    description: "Communicate with publishers",
    icon: MessageSquare,
    href: "/advertiser/messages",
    color: "bg-purple-500",
  },
]

export default function AdvertiserDashboard() {
  const { user } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(statsTemplate)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [topPerformingWebsites, setTopPerformingWebsites] = useState<any[]>([])
  const [userName, setUserName] = useState("")

  useEffect(() => {
    if (user) {
      // @ts-ignore
      setUserName(user.user_metadata?.full_name || "Advertiser")
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return
    setLoading(true)

    try {
      // Fetch orders for stats
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, status, total_amount")
        .eq("advertiser_id", user.id)

      if (ordersError) throw ordersError

      const activeOrders = ordersData.filter(
        (o) => !["completed", "paid", "cancelled"].includes(o.status)
      ).length
      const linksPlaced = ordersData.filter((o) => ["completed", "paid"].includes(o.status)).length

      // Fetch payments for stats
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("total_amount, invoice_status")
        .in(
          "order_id",
          ordersData.map((o) => o.id)
        )

      if (paymentsError) throw paymentsError

      const totalSpent = paymentsData
        .filter((p) => p.invoice_status === "PAID")
        .reduce((sum, p) => sum + p.total_amount, 0)
      const pendingPayments = paymentsData
        .filter((p) => p.invoice_status === "SENT")
        .reduce((sum, p) => sum + p.total_amount, 0)

      setStats((prevStats) =>
        prevStats.map((stat) => {
          switch (stat.key) {
            case "activeOrders":
              return { ...stat, value: activeOrders.toString() }
            case "totalSpent":
              return { ...stat, value: `$${totalSpent.toLocaleString()}` }
            case "linksPlaced":
              return { ...stat, value: linksPlaced.toString() }
            case "pendingPayments":
              return { ...stat, value: `$${pendingPayments.toLocaleString()}` }
            default:
              return stat
          }
        })
      )

      // Fetch recent orders
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          status,
          total_amount,
          requested_completion_date,
          website:websites(url),
          order_items(service_name)
        `
        )
        .eq("advertiser_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3)

      if (recentOrdersError) throw recentOrdersError

      const formattedRecentOrders = recentOrdersData.map((o) => ({
        id: o.id,
        // @ts-ignore
        website: o.website?.url,
        // @ts-ignore
        service: o.order_items[0]?.service_name || "Multiple Services",
        status: o.status.replace("_", " "),
        amount: `$${o.total_amount}`,
        progress: 50, // Placeholder
        dueDate: new Date(o.requested_completion_date).toLocaleDateString(),
      }))
      setRecentOrders(formattedRecentOrders)

      // Fetch top performing websites
      const completedOrders = ordersData.filter((o) => ["completed", "paid"].includes(o.status))
      const { data: websitesData, error: websitesError } = await supabase
        .from("websites")
        .select("id, url, primary_niche")
        .in(
          "id",
          // @ts-ignore
          [...new Set(completedOrders.map((o) => o.website_id))]
        )

      if (websitesError) throw websitesError

      const websiteOrderCounts = completedOrders.reduce((acc, order) => {
        // @ts-ignore
        acc[order.website_id] = (acc[order.website_id] || 0) + 1
        return acc
      }, {})

      const topWebsites = (websitesData || [])
        // @ts-ignore
        .sort((a, b) => websiteOrderCounts[b.id] - websiteOrderCounts[a.id])
        .slice(0, 3)
        .map((w) => ({
          name: w.url,
          // @ts-ignore
          orders: websiteOrderCounts[w.id],
          avgRating: 4.8, // Placeholder
          lastOrder: "recent", // Placeholder
          category: w.primary_niche,
        }))
      setTopPerformingWebsites(topWebsites)
    } catch (error) {
      console.error("Failed to fetch advertiser dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdvertiserLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {userName}! Here's what's happening with your campaigns.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? <Skeleton className="h-8 w-24 mt-1" /> : stat.value}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-teal-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`text-sm ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <div className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className={`h-10 w-10 ${action.color} rounded-lg flex items-center justify-center mr-3`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{action.title}</p>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest campaign orders</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/advertiser/orders">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading
                  ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                  : recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{order.website}</p>
                              <p className="text-sm text-gray-600">
                                {order.service} • {order.id}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{order.amount}</p>
                              <Badge
                                variant={
                                  order.status === "Completed"
                                    ? "default"
                                    : order.status === "In Progress"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 mr-4">
                              <Progress value={order.progress} className="h-2" />
                            </div>
                            <p className="text-sm text-gray-600">Due {order.dueDate}</p>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Websites */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Websites</CardTitle>
            <CardDescription>Websites you've worked with most successfully</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {loading
                ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
                : topPerformingWebsites.map((website) => (
                    <div key={website.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{website.name}</h3>
                        <Badge variant="outline">{website.category}</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Orders completed:</span>
                          <span className="font-medium">{website.orders}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Average rating:</span>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-medium">{website.avgRating}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Last order:</span>
                          <span className="font-medium">{website.lastOrder}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3 bg-transparent">
                        <Eye className="h-4 w-4 mr-2" />
                        View Listings
                      </Button>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdvertiserLayout>
  )
}
