import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  const baseUrl = 'https://click-optima.com' // Replace with your domain

  // Get all websites
  const { data: websites } = await supabase.from('websites').select('id, created_at')

  // Get all orders
  const { data: orders } = await supabase.from('orders').select('id, created_at')

  const websiteUrls = websites?.map(website => ({
    url: `${baseUrl}/advertiser/websites/${website.id}`,
    lastModified: new Date(website.created_at),
  })) || []

  const advertiserOrderUrls = orders?.map(order => ({
    url: `${baseUrl}/advertiser/orders/${order.id}`,
    lastModified: new Date(order.created_at),
  })) || []

  const publisherOrderUrls = orders?.map(order => ({
    url: `${baseUrl}/publisher/orders/${order.id}`,
    lastModified: new Date(order.created_at),
  })) || []

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
    },
    // ... add other static routes here
    ...websiteUrls,
    ...advertiserOrderUrls,
    ...publisherOrderUrls,
  ]
}
