import type { User } from '@supabase/supabase-js'

export type UserRole = 'advertiser' | 'publisher'

export interface AuthUser extends User {
  user_role?: UserRole
}

export function getUserRole(user: User | null): UserRole | null {
  if (!user) return null
  
  // Check both user_metadata and app_metadata for role
  return user.user_metadata?.user_role || user.app_metadata?.user_role || null
}

export function getDefaultDashboard(role: UserRole | null): string {
  switch (role) {
    case 'advertiser':
      return '/advertiser/dashboard'
    case 'publisher':
      return '/publisher/dashboard'
    default:
      return '/'
  }
}

export function getRedirectPath(user: User | null, currentPath: string): string {
  const role = getUserRole(user)
  
  // If user is not authenticated
  if (!user) {
    // If they're on a protected route, redirect to login
    if (currentPath.startsWith('/advertiser') || currentPath.startsWith('/publisher')) {
      return `/auth/login?redirectTo=${encodeURIComponent(currentPath)}`
    }
    return currentPath
  }

  // If user is authenticated but doesn't have a role (shouldn't happen but handle gracefully)
  if (!role) {
    return '/auth/login?message=Please complete your profile setup'
  }

  // If user is authenticated and on auth pages, redirect to their dashboard
  if (currentPath.startsWith('/auth/')) {
    return getDefaultDashboard(role)
  }

  // Check if user is accessing the wrong role's section
  if (role === 'advertiser' && currentPath.startsWith('/publisher')) {
    return '/advertiser/dashboard'
  }
  
  if (role === 'publisher' && currentPath.startsWith('/advertiser')) {
    return '/publisher/dashboard'
  }

  // If on root page and authenticated, redirect to dashboard
  if (currentPath === '/') {
    return getDefaultDashboard(role)
  }

  return currentPath
}

export function isProtectedRoute(path: string): boolean {
  return path.startsWith('/advertiser') || path.startsWith('/publisher')
}

export function isAuthRoute(path: string): boolean {
  return path.startsWith('/auth/')
}

export function shouldRedirect(user: User | null, currentPath: string): boolean {
  const role = getUserRole(user)
  
  // Always redirect if no user and on protected route
  if (!user && isProtectedRoute(currentPath)) {
    return true
  }
  
  // Redirect authenticated users away from auth pages
  if (user && role && isAuthRoute(currentPath)) {
    return true
  }
  
  // Redirect to dashboard if on root and authenticated
  if (user && role && currentPath === '/') {
    return true
  }
  
  // Redirect if user is in wrong role section
  if (user && role) {
    if (role === 'advertiser' && currentPath.startsWith('/publisher')) {
      return true
    }
    if (role === 'publisher' && currentPath.startsWith('/advertiser')) {
      return true
    }
  }
  
  return false
} 