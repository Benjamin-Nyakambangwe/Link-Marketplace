import { Skeleton } from "@/components/ui/skeleton"
import AdvertiserLayout from "@/components/advertiser/advertiser-layout"

export default function MessagesLoading() {
  return (
    <AdvertiserLayout>
      <div className="p-6">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] bg-white rounded-lg border">
          {/* Conversations List */}
          <div className="w-full lg:w-1/3 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <Skeleton className="h-6 w-24 mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="overflow-y-auto flex-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 border-b border-gray-100">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-full" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
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
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`flex space-x-3 ${i % 2 === 1 ? "flex-row-reverse space-x-reverse" : ""}`}>
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 max-w-xs lg:max-w-md">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-end space-x-2">
                <Skeleton className="flex-1 h-20" />
                <div className="flex flex-col space-y-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdvertiserLayout>
  )
}
