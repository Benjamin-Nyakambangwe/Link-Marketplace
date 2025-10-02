'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getRedirectPath } from '@/lib/auth-utils'

interface AuthRedirectProps {
  children: React.ReactNode
  requiredRole?: 'advertiser' | 'publisher'
  fallbackPath?: string
}

export default function AuthRedirect({ 
  children, 
  requiredRole, 
  fallbackPath = '/auth/login' 
}: AuthRedirectProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      const currentPath = window.location.pathname
      const redirectPath = getRedirectPath(user, currentPath)
      
      // If we have a required role and user doesn't match
      if (user && requiredRole && user.user_role !== requiredRole) {
        const correctDashboard = requiredRole === 'advertiser' 
          ? '/advertiser/dashboard' 
          : '/publisher/dashboard'
        router.push(correctDashboard)
        return
      }
      
      // If redirect path is different from current path
      if (redirectPath !== currentPath) {
        router.push(redirectPath)
        return
      }
    }
  }, [user, loading, requiredRole, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 