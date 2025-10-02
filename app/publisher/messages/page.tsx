"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Search, Send, User } from "lucide-react"
import PublisherLayout from "@/components/publisher/publisher-layout"
import { useState } from "react"

// Mock data
const messageThreads = [
  {
    id: "thread-1",
    orderId: "ORD-001",
    advertiser: {
      name: "TechCorp Inc.",
      email: "marketing@techcorp.com",
      avatar: "TC",
    },
    lastMessage: {
      content: "That sounds perfect! Looking forward to seeing the placement. Please send us the URL once it's live.",
      timestamp: "2024-01-11T11:20:00Z",
      isFromPublisher: false,
    },
    unreadCount: 0,
    status: "in_progress",
  },
  {
    id: "thread-2",
    orderId: "ORD-002",
    advertiser: {
      name: "Marketing Pro",
      email: "team@marketingpro.com",
      avatar: "MP",
    },
    lastMessage: {
      content: "Thanks for the quick turnaround! The guest post looks great.",
      timestamp: "2024-01-10T16:45:00Z",
      isFromPublisher: false,
    },
    unreadCount: 2,
    status: "completed",
  },
  {
    id: "thread-3",
    orderId: "ORD-003",
    advertiser: {
      name: "SEO Masters",
      email: "orders@seomasters.com",
      avatar: "SM",
    },
    lastMessage: {
      content: "I've updated the content as requested. Please review and let me know if you need any changes.",
      timestamp: "2024-01-09T14:30:00Z",
      isFromPublisher: true,
    },
    unreadCount: 1,
    status: "pending",
  },
]

const conversationMessages = [
  {
    id: "1",
    senderId: "advertiser",
    senderName: "TechCorp Inc.",
    content:
      "Hi! Thanks for accepting our order. We're looking for a natural placement in one of your recent tech articles.",
    timestamp: "2024-01-10T10:30:00Z",
    isFromPublisher: false,
  },
  {
    id: "2",
    senderId: "publisher",
    senderName: "You",
    content:
      "Hello! I've reviewed your requirements and I have a perfect article from last week about productivity tools. I'll place your link naturally within that content.",
    timestamp: "2024-01-11T09:15:00Z",
    isFromPublisher: true,
  },
  {
    id: "3",
    senderId: "advertiser",
    senderName: "TechCorp Inc.",
    content: "That sounds perfect! Looking forward to seeing the placement. Please send us the URL once it's live.",
    timestamp: "2024-01-11T11:20:00Z",
    isFromPublisher: false,
  },
]

export default function PublisherMessages() {
  const [selectedThread, setSelectedThread] = useState(messageThreads[0])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const filteredThreads = messageThreads.filter(
    (thread) =>
      thread.advertiser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.orderId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setNewMessage("")
      console.log("Message sent:", newMessage)
    }, 500)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-700"
      case "in_progress":
        return "bg-blue-100 text-blue-700"
      case "completed":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  return (
    <PublisherLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-teal-600" />
            <span>Messages</span>
          </h1>
          <p className="text-slate-600">Communicate with advertisers about your orders</p>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Message Threads List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`p-4 border-b cursor-pointer hover:bg-slate-50 transition-colors ${
                      selectedThread.id === thread.id ? "bg-teal-50 border-r-2 border-r-teal-600" : ""
                    }`}
                    onClick={() => setSelectedThread(thread)}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                          {thread.advertiser.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm truncate">{thread.advertiser.name}</p>
                          <div className="flex items-center space-x-2">
                            {thread.unreadCount > 0 && (
                              <Badge className="bg-teal-600 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                                {thread.unreadCount}
                              </Badge>
                            )}
                            <span className="text-xs text-slate-500">{formatTime(thread.lastMessage.timestamp)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500">Order: {thread.orderId}</span>
                          <Badge className={`text-xs ${getStatusColor(thread.status)}`}>
                            {thread.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 truncate">
                          {thread.lastMessage.isFromPublisher ? "You: " : ""}
                          {thread.lastMessage.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {selectedThread.advertiser.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedThread.advertiser.name}</CardTitle>
                    <CardDescription>Order: {selectedThread.orderId}</CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(selectedThread.status)}>
                  {selectedThread.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {conversationMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.isFromPublisher ? "justify-end" : "justify-start"}`}>
                    <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                      {!message.isFromPublisher && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {selectedThread.advertiser.avatar}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          message.isFromPublisher
                            ? "bg-teal-600 text-white"
                            : "bg-slate-100 text-slate-900 border border-slate-200"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium opacity-70">
                            {message.isFromPublisher ? "You" : message.senderName}
                          </span>
                          <span className="text-xs opacity-50">{formatTime(message.timestamp)}</span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                      {message.isFromPublisher && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-br from-teal-600 to-teal-700 text-white text-xs">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isLoading}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
            </div>
          </Card>
        </div>
      </div>
    </PublisherLayout>
  )
}
