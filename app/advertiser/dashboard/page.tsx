"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search, ShoppingCart, DollarSign, TrendingUp, Clock, Eye, MessageSquare, Star } from "lucide-react"
import Link from "next/link"
import AdvertiserLayout from "@/components/advertiser/advertiser-layout"

const stats = [
  {
    name: "Active Orders",
    value: "12",
    change: "+2 from last month",
    changeType: "positive",
    icon: ShoppingCart,
  },
  {
    name: "Total Spent",
    value: "$4,250",
    change: "+15% from last month",
    changeType: "positive",
    icon: DollarSign,
  },
  {
    name: "Links Placed",
    value: "28",
    change: "+8 from last month",
    changeType: "positive",
    icon: TrendingUp,
  },
  {
    name: "Avg. Response Time",
    value: "2.4 hrs",
    change: "-30 min from last month",
    changeType: "positive",
    icon: Clock,
  },
]

const recentOrders = [
  {
    id: "ORD-001",
    website: "techblog.com",
    service: "Guest Post",
    status: "In Progress",
    amount: "$150",
    progress: 60,
    dueDate: "2024-01-15",
  },
  {
    id: "ORD-002",
    website: "healthnews.net",
    service: "Link Placement",
    status: "Completed",
    amount: "$75",
    progress: 100,
    dueDate: "2024-01-10",
  },
  {
    id: "ORD-003",
    website: "financetips.org",
    service: "Sponsored Content",
    status: "Pending Review",
    amount: "$200",
    progress: 25,
    dueDate: "2024-01-20",
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

const topPerformingWebsites = [
  {
    name: "techblog.com",
    orders: 5,
    avgRating: 4.8,
    lastOrder: "2 days ago",
    category: "Technology",
  },
  {
    name: "healthnews.net",
    orders: 3,
    avgRating: 4.9,
    lastOrder: "1 week ago",
    category: "Health",
  },
  {
    name: "financetips.org",
    orders: 4,
    avgRating: 4.7,
    lastOrder: "3 days ago",
    category: "Finance",
  },
]

export default function AdvertiserDashboard() {
  return (
    <AdvertiserLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your campaigns.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
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
                {recentOrders.map((order) => (
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
              {topPerformingWebsites.map((website) => (
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
