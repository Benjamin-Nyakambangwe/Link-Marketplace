"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Download, CalendarIcon, CreditCard, DollarSign, TrendingUp, Receipt, Eye } from "lucide-react"
import { format } from "date-fns"
import AdvertiserLayout from "@/components/advertiser/advertiser-layout"

const transactions = [
  {
    id: "TXN-001",
    orderId: "ORD-001",
    website: "techblog.com",
    publisher: "John Publisher",
    service: "Guest Post",
    amount: "$150.00",
    fee: "$7.50",
    total: "$157.50",
    status: "Completed",
    method: "Credit Card",
    date: "2024-01-15",
    time: "10:30 AM",
    invoiceUrl: "#",
  },
  {
    id: "TXN-002",
    orderId: "ORD-002",
    website: "healthnews.net",
    publisher: "Sarah Wilson",
    service: "Link Placement",
    amount: "$75.00",
    fee: "$3.75",
    total: "$78.75",
    status: "Completed",
    method: "PayPal",
    date: "2024-01-12",
    time: "2:15 PM",
    invoiceUrl: "#",
  },
  {
    id: "TXN-003",
    orderId: "ORD-003",
    website: "financetips.org",
    publisher: "Mike Johnson",
    service: "Sponsored Content",
    amount: "$200.00",
    fee: "$10.00",
    total: "$210.00",
    status: "Pending",
    method: "Credit Card",
    date: "2024-01-10",
    time: "4:45 PM",
    invoiceUrl: "#",
  },
  {
    id: "TXN-004",
    orderId: "ORD-004",
    website: "travelguide.com",
    publisher: "Emma Davis",
    service: "Guest Post",
    amount: "$120.00",
    fee: "$6.00",
    total: "$126.00",
    status: "Completed",
    method: "Credit Card",
    date: "2024-01-08",
    time: "11:20 AM",
    invoiceUrl: "#",
  },
  {
    id: "TXN-005",
    orderId: "ORD-005",
    website: "foodblog.net",
    publisher: "Alex Chen",
    service: "Link Placement",
    amount: "$90.00",
    fee: "$4.50",
    total: "$94.50",
    status: "Failed",
    method: "Credit Card",
    date: "2024-01-05",
    time: "3:30 PM",
    invoiceUrl: "#",
  },
]

const statusColors = {
  Completed: "bg-green-100 text-green-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Failed: "bg-red-100 text-red-800",
  Refunded: "bg-gray-100 text-gray-800",
}

export default function PaymentHistory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.publisher.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
    const matchesMethod = methodFilter === "all" || transaction.method === methodFilter

    return matchesSearch && matchesStatus && matchesMethod
  })

  const totalSpent = transactions
    .filter((t) => t.status === "Completed")
    .reduce((sum, t) => sum + Number.parseFloat(t.total.replace("$", "")), 0)

  const totalFees = transactions
    .filter((t) => t.status === "Completed")
    .reduce((sum, t) => sum + Number.parseFloat(t.fee.replace("$", "")), 0)

  const pendingAmount = transactions
    .filter((t) => t.status === "Pending")
    .reduce((sum, t) => sum + Number.parseFloat(t.total.replace("$", "")), 0)

  return (
    <AdvertiserLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-600 mt-2">View and manage your transaction history</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(2)}</div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">${totalFees.toFixed(2)}</div>
                  <p className="text-sm text-gray-600">Total Fees</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">${pendingAmount.toFixed(2)}</div>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                </div>
                <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All your payment transactions and invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="PayPal">PayPal</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-48 bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Transactions Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="font-medium">{transaction.id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{transaction.orderId}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.website}</div>
                          <div className="text-sm text-gray-600">{transaction.publisher}</div>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.service}</TableCell>
                      <TableCell className="font-medium">{transaction.amount}</TableCell>
                      <TableCell className="text-gray-600">{transaction.fee}</TableCell>
                      <TableCell className="font-medium">{transaction.total}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[transaction.status as keyof typeof statusColors]}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.method}</TableCell>
                      <TableCell>
                        <div className="text-sm">{transaction.date}</div>
                        <div className="text-xs text-gray-600">{transaction.time}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No transactions found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdvertiserLayout>
  )
}
