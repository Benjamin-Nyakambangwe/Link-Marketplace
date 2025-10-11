import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MOZ_API_URL = 'https://api.moz.com/jsonrpc'
const DA_TOLERANCE = 5

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const { website_id, url, da } = await request.json()

    if (!website_id || !url || da === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: website_id, url, and da are required' },
        { status: 400 }
      )
    }

    // Validate Moz API key
    const mozApiKey = process.env.MOZ_API_KEY
    if (!mozApiKey) {
      console.error('MOZ_API_KEY environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Call Moz API
    const mozResponse = await fetch(MOZ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-moz-token': mozApiKey,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `verify-da-${website_id}-${Date.now()}`,
        method: 'data.site.metrics.fetch',
        params: {
          data: {
            site_query: {
              query: url,
              scope: 'domain',
            },
          },
        },
      }),
    })

    // Handle HTTP errors
    if (!mozResponse.ok) {
      const errorText = await mozResponse.text()
      console.error('Moz API HTTP error:', {
        status: mozResponse.status,
        statusText: mozResponse.statusText,
        body: errorText,
      })
      return NextResponse.json(
        { error: 'Failed to fetch data from Moz API' },
        { status: mozResponse.status }
      )
    }

    // Parse response
    const mozData = await mozResponse.json()

    // Handle JSON-RPC errors
    if (mozData.error) {
      console.error('Moz API JSON-RPC error:', mozData.error)
      return NextResponse.json(
        { error: mozData.error.message || 'Moz API returned an error' },
        { status: 500 }
      )
    }

    // Extract Domain Authority from response
    const moz_da = mozData?.result?.site_metrics?.domain_authority

    if (moz_da === undefined || moz_da === null) {
      console.error('Domain Authority not found in Moz API response:', mozData)
      return NextResponse.json(
        { error: 'Could not retrieve Domain Authority from Moz API' },
        { status: 500 }
      )
    }

    // Verify DA within tolerance
    const da_verified = Math.abs(da - moz_da) <= DA_TOLERANCE

    // Update database
    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from('websites')
      .update({
        da_verified,
        moz_da,
      })
      .eq('id', website_id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update website record' },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      da_verified,
      moz_da,
      submitted_da: da,
      difference: Math.abs(da - moz_da),
      tolerance: DA_TOLERANCE,
    })

  } catch (error) {
    console.error('Unexpected error during DA verification:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}