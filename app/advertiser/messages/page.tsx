"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Send, Paperclip, MoreVertical, Star, Archive, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import AdvertiserLayout from "@/components/advertiser/advertiser-layout"

const conversations = [
  {
    id: 1,
    publisher: {
      name: "John Publisher",
      email: "john@techblog.com",
      avatar: "/placeholder.svg?height=40&width=40",
      website: "techblog.com",
    },
    lastMessage: "Hi! I've started working on your guest post. I'll have the first draft ready by tomorrow.",
    timestamp: "2 hours ago",
    unread: 2,
    orderId: "ORD-001",
    status: "active",
  },
  {
    id: 2,
    publisher: {
      name: "Sarah Wilson",
      email: "sarah@healthnews.net",
      avatar: "/placeholder.svg?height=40&width=40",
      website: "healthnews.net",
    },
    lastMessage: "The article has been published! Here's the live link: https://healthnews.net/wellness-trends-2024",
    timestamp: "1 day ago",
    unread: 0,
    orderId: "ORD-002",
    status: "completed",
  },
  {
    id: 3,
    publisher: {
      name: "Mike Johnson",
      email: "mike@financetips.org",
      avatar: "/placeholder.svg?height=40&width=40",
      website: "financetips.org",
    },
    lastMessage: "I need some clarification on the target keywords for the sponsored content piece.",
    timestamp: "2 days ago",
    unread: 1,
    orderId: "ORD-003",
    status: "pending",
  },
  {
    id: 4,
    publisher: {
      name: "Emma Davis",
      email: "emma@travelguide.com",
      avatar: "/placeholder.svg?height=40&width=40",
      website: "travelguide.com",
    },
    lastMessage: "Thanks for the feedback! I'll make those revisions and send the updated draft.",
    timestamp: "3 days ago",
    unread: 0,
    orderId: "ORD-004",
    status: "revision",
  },
]

const messages = [
  {
    id: 1,
    sender: "publisher",
    name: "John Publisher",
    message:
      "Hi! I've started working on your guest post about AI trends. I'll have the first draft ready by tomorrow. Do you have any specific angle you'd like me to focus on?",
    timestamp: "2 hours ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 2,
    sender: "advertiser",
    name: "You",
    message:
      "Thanks for the update! Please focus on practical applications of AI in business, especially for small to medium enterprises. Looking forward to the draft!",
    timestamp: "1 hour ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 3,
    sender: "publisher",
    name: "John Publisher",
    message:
      "Perfect! I'll make sure to include case studies and practical examples. I'm also planning to add some statistics about AI adoption rates. Would that work for you?",
    timestamp: "45 minutes ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 4,
    sender: "advertiser",
    name: "You",
    message:
      "That sounds excellent! Statistics would definitely add value to the piece. Please go ahead with that approach.",
    timestamp: "30 minutes ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
]

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.publisher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.publisher.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In real app, send message via API
      console.log("Sending message:", newMessage)
      setNewMessage("")
    }
  }

  return (
    <AdvertiserLayout>
      <div className="p-6">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] bg-white rounded-lg border">
          {/* Conversations List */}
          <div className="w-full lg:w-1/3 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation.id === conversation.id ? "bg-teal-50 border-l-4 border-l-teal-500" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.publisher.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {conversation.publisher.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 truncate">{conversation.publisher.name}</p>
                        <div className="flex items-center space-x-2">
                          {conversation.unread > 0 && (
                            <Badge className="bg-teal-500 text-white text-xs px-2 py-1">{conversation.unread}</Badge>
                          )}
                          <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{conversation.publisher.website}</p>
                      <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">
                          {conversation.orderId}
                        </Badge>
                        <Badge
                          variant={
                            conversation.status === "completed"
                              ? "default"
                              : conversation.status === "active"
                                ? "secondary"
                                : conversation.status === "revision"
                                  ? "destructive"
                                  : "outline"
                          }
                          className="text-xs"
                        >
                          {conversation.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.publisher.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {selectedConversation.publisher.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{selectedConversation.publisher.name}</p>
                    <p className="text-sm text-gray-600">{selectedConversation.publisher.website}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{selectedConversation.orderId}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Star className="h-4 w-4 mr-2" />
                        Star Conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex space-x-3 ${
                    message.sender === "advertiser" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {message.sender === "advertiser"
                        ? "You"
                        : message.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 max-w-xs lg:max-w-md ${message.sender === "advertiser" ? "text-right" : ""}`}>
                    <div
                      className={`inline-block p-3 rounded-lg ${
                        message.sender === "advertiser" ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{message.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleSendMessage} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdvertiserLayout>
  )
}
