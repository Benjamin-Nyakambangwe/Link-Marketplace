"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DollarSign,
  TrendingUp,
  CalendarIcon,
  Download,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
} from "lucide-react"
import PublisherLayout from "@/components/publisher/publisher-layout"
import { useState } from "react"

// Mock data
const payoutSummary = {
  totalEarned: 18750,
  totalPaidOut: 15200,
  pendingBalance: 3550,
  nextPayoutDate: "2024-01-15",
  nextPayoutAmount: 1200,
}

const payouts = [
  {
    id: "PAY-001",
    amount: 1250,
    status: "paid",
    payoutDate: "2024-01-01",
    ordersIncluded: ["ORD-001", "ORD-002", "ORD-003"],
    paymentMethod: "Bank Transfer",
    transactionId: "TXN-12345",
  },
  {
    id: "PAY-002",
    amount: 980,
    status: "paid",
    payoutDate: "2023-12-15",
    ordersIncluded: ["ORD-004", "ORD-005"],
    paymentMethod: "PayPal",
    transactionId: "TXN-12346",
  },
  {
    id: "PAY-003",
    amount: 1450,
    status: "processing",
    payoutDate: "2024-01-15",
    ordersIncluded: ["ORD-006", "ORD-007", "ORD-008"],
    paymentMethod: "Bank Transfer",
    transactionId: null,
  },
  {
    id: "PAY-004",
    amount: 750,
    status: "pending",
    payoutDate: "2024-01-30",
    ordersIncluded: ["ORD-009"],
    paymentMethod: "Bank Transfer",
    transactionId: null,
  },
]

const transactions = [
  {
    id: "TXN-001",
    orderId: "ORD-001",
    type: "order_completion",
    amount: 135,
    commission: 15,
    netAmount: 120,
    date: "2024-01-10",
    status: "completed",
    advertiser: "TechCorp Inc.",
  },
  {
    id: "TXN-002",
    orderId: "ORD-002",
    type: "order_completion",
    amount: 180,
    commission: 20,
    netAmount: 160,
    date: "2024-01-09",
    status: "completed",
    advertiser: "Marketing Pro",
  },
  {
    id: "TXN-003",
    orderId: "ORD-003",
    type: "order_completion",
    amount: 158,
    commission: 18,
    netAmount: 140,
    date: "2024-01-08",
    status: "completed",
    advertiser: "SEO Masters",
  },
]

const statusConfig = {
  paid: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-700", icon: Clock },
  pending: { label: "Pending", color: "bg-orange-100 text-orange-700", icon: Clock },
  failed: { label: "Failed", color: "bg-red-100 text-red-700", icon: AlertCircle },
}

export default function PublisherPayouts() {
  const [activeTab, setActiveTab] = useState("payouts")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  const filteredPayouts = payouts.filter((payout) => {
    const matchesSearch = payout.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payout.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.advertiser.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <PublisherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-teal-600" />
            <span>Payout History</span>
          </h1>
          <p className="text-slate-600">Track your earnings, payouts, and transaction history</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${payoutSummary.totalEarned.toLocaleString()}</div>
              <p className="text-xs text-slate-500">Lifetime earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${payoutSummary.totalPaidOut.toLocaleString()}</div>
              <p className="text-xs text-slate-500">Successfully transferred</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">${payoutSummary.pendingBalance.toLocaleString()}</div>
              <p className="text-xs text-slate-500">Awaiting payout</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
              <CalendarIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${payoutSummary.nextPayoutAmount.toLocaleString()}</div>
              <p className="text-xs text-slate-500">{payoutSummary.nextPayoutDate}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === "payouts" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("payouts")}
            className={activeTab === "payouts" ? "bg-white shadow-sm" : ""}
          >
            Payouts
          </Button>
          <Button
            variant={activeTab === "transactions" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("transactions")}
            className={activeTab === "transactions" ? "bg-white shadow-sm" : ""}
          >
            Transactions
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={activeTab === "payouts" ? "Search payouts..." : "Search by order ID or advertiser..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {activeTab === "payouts" && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" className="sm:w-auto bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {activeTab === "payouts" ? (
          <Card>
            <CardHeader>
              <CardTitle>Payout History ({filteredPayouts.length})</CardTitle>
              <CardDescription>Your payout history and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payout ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payout Date</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Orders Included</TableHead>
                      <TableHead>Transaction ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.map((payout) => {
                      const StatusIcon = statusConfig[payout.status as keyof typeof statusConfig].icon
                      return (
                        <TableRow key={payout.id}>
                          <TableCell className="font-medium">{payout.id}</TableCell>
                          <TableCell>
                            <span className="font-semibold">${payout.amount}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig[payout.status as keyof typeof statusConfig].color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[payout.status as keyof typeof statusConfig].label}
                            </Badge>
                          </TableCell>
                          <TableCell>{payout.payoutDate}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <CreditCard className="w-4 h-4 text-slate-400" />
                              <span>{payout.paymentMethod}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {payout.ordersIncluded.map((orderId) => (
                                <Badge key={orderId} variant="outline" className="text-xs bg-transparent">
                                  {orderId}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {payout.transactionId ? (
                              <span className="text-sm font-mono">{payout.transactionId}</span>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredPayouts.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No payouts found</h3>
                  <p className="text-slate-600">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Payouts will appear here once orders are completed"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Transaction History ({filteredTransactions.length})</CardTitle>
              <CardDescription>Detailed breakdown of your earnings by order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Advertiser</TableHead>
                      <TableHead>Gross Amount</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Net Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.orderId}</TableCell>
                        <TableCell>{transaction.advertiser}</TableCell>
                        <TableCell>${transaction.amount}</TableCell>
                        <TableCell className="text-red-600">-${transaction.commission}</TableCell>
                        <TableCell className="font-semibold text-green-600">${transaction.netAmount}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No transactions found</h3>
                  <p className="text-slate-600">
                    {searchTerm ? "Try adjusting your search" : "Transactions will appear here as orders are completed"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PublisherLayout>
  )
}
