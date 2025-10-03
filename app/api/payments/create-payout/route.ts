import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * POST /api/payments/create-payout
 * 
 * Creates a PayPal payout when advertiser approves work
 * Triggered from: app/advertiser/orders/[id]/page.tsx -> approveOrder()
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 1. Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get order ID from request
    const { orderId } = await request.json()
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // 3. Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        title,
        total_amount,
        status,
        payment_status,
        advertiser_id,
        publisher_id
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 4. Verify the requesting user is the advertiser
    if (order.advertiser_id !== user.id) {
      return NextResponse.json({ error: 'Only advertiser can approve payout' }, { status: 403 })
    }

    // 5. Verify order is in correct state (should be 'completed' when advertiser approves)
    if (order.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Order must be in completed status (advertiser approval)',
        currentStatus: order.status 
      }, { status: 400 })
    }

    // 6. Verify payment exists and was paid
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
    }

    if (payment.invoice_status !== 'PAID') {
      return NextResponse.json({ 
        error: 'Invoice must be paid before creating payout',
        invoiceStatus: payment.invoice_status
      }, { status: 400 })
    }

    // 7. Check if payout already exists
    const { data: existingPayout } = await supabase
      .from('payouts')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (existingPayout) {
      return NextResponse.json({ 
        error: 'Payout already exists for this order',
        payout: existingPayout
      }, { status: 400 })
    }

    // 8. Get publisher PayPal email
    const { data: publisherProfile, error: publisherError } = await supabase
      .from('profiles')
      .select('paypal_email')
      .eq('id', order.publisher_id)
      .single()

    if (publisherError || !publisherProfile?.paypal_email) {
      return NextResponse.json({ 
        error: 'Publisher PayPal email not found. Publisher must set up payment info.',
        publisherId: order.publisher_id
      }, { status: 400 })
    }

    // 9. Create payout record in database (status: PENDING)
    // Use admin client to bypass RLS for system operations
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: payout, error: payoutInsertError } = await supabaseAdmin
      .from('payouts')
      .insert({
        payment_id: payment.id,
        publisher_id: order.publisher_id,
        order_id: orderId,
        amount: payment.publisher_amount,
        publisher_paypal_email: publisherProfile.paypal_email,
        payout_status: 'PENDING',
        initiated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (payoutInsertError) {
      console.error('Error creating payout record:', payoutInsertError)
      throw new Error('Failed to create payout record')
    }

    // 10. Create PayPal payout
    const paypalPayout = await createPayPalPayout({
      payoutId: payout.id,
      orderId,
      orderTitle: order.title,
      amount: payment.publisher_amount,
      publisherEmail: publisherProfile.paypal_email
    })

    if (!paypalPayout.success) {
      // Update payout status to FAILED
      await supabaseAdmin
        .from('payouts')
        .update({
          payout_status: 'FAILED',
          failure_reason: paypalPayout.error
        })
        .eq('id', payout.id)

      return NextResponse.json({ 
        error: paypalPayout.error || 'Failed to create PayPal payout',
        payout
      }, { status: 500 })
    }

    // 11. Update payout with PayPal details
    const { data: updatedPayout, error: updateError } = await supabaseAdmin
      .from('payouts')
      .update({
        paypal_payout_batch_id: paypalPayout.batch_id,
        paypal_payout_item_id: paypalPayout.item_id,
        payout_status: 'PROCESSING'
      })
      .eq('id', payout.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating payout:', updateError)
    }

    // 12. Update order status to payment_processing (payout initiated successfully)
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'payment_processing',
        payment_status: 'processing'
      })
      .eq('id', orderId)

    console.log(`✅ Payout initiated for order ${orderId}. Batch ID: ${paypalPayout.batch_id}`)

    // 13. Return success
    return NextResponse.json({
      success: true,
      payout: updatedPayout || payout,
      message: 'Payout initiated successfully'
    })

  } catch (error: any) {
    console.error('Error creating payout:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payout' },
      { status: 500 }
    )
  }
}

/**
 * Creates a PayPal payout using PayPal Payouts API
 */
async function createPayPalPayout(params: {
  payoutId: string
  orderId: string
  orderTitle: string
  amount: number
  publisherEmail: string
}) {
  try {
    const { payoutId, orderId, orderTitle, amount, publisherEmail } = params

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken()
    if (!accessToken) {
      return { success: false, error: 'Failed to get PayPal access token' }
    }

    // Create payout batch
    const batchId = `PAYOUT-${payoutId.substring(0, 8).toUpperCase()}-${Date.now()}`
    
    const payoutPayload = {
      sender_batch_header: {
        sender_batch_id: batchId,
        email_subject: 'You received a payment from Link Marketplace',
        email_message: `Payment for order: ${orderTitle}. Thank you for your work!`
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            value: amount.toFixed(2),
            currency: 'USD'
          },
          receiver: publisherEmail,
          note: `Payment for order #${orderId.substring(0, 8)}`,
          sender_item_id: payoutId
        }
      ]
    }

    const response = await fetch(
      `${process.env.PAYPAL_API_URL}/v1/payments/payouts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payoutPayload)
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('PayPal payout error:', errorData)
      return { 
        success: false, 
        error: errorData.message || 'Failed to create payout' 
      }
    }

    const result = await response.json()
    console.log('PayPal payout response:', JSON.stringify(result, null, 2))

    // Extract payout item ID from links or items array
    let itemId = null
    
    // Try to get from items array first
    if (result.items && result.items.length > 0) {
      itemId = result.items[0].payout_item_id
    }
    
    // If not in items, try to extract from links
    if (!itemId && result.links) {
      const itemLink = result.links.find((link: any) => link.rel === 'item' || link.href.includes('/payouts-item/'))
      if (itemLink) {
        itemId = itemLink.href.split('/').pop()
      }
    }

    // Use payoutId as fallback (we set it as sender_item_id)
    if (!itemId) {
      console.warn('Could not extract payout_item_id from response, using sender_item_id')
      itemId = payoutId
    }

    return {
      success: true,
      batch_id: result.batch_header.payout_batch_id,
      item_id: itemId,
      status: result.batch_header.batch_status
    }

  } catch (error: any) {
    console.error('PayPal Payout API error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Gets PayPal OAuth access token
 */
async function getPayPalAccessToken(): Promise<string | null> {
  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64')

    const response = await fetch(
      `${process.env.PAYPAL_API_URL}/v1/oauth2/token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      }
    )

    if (!response.ok) {
      console.error('Failed to get PayPal access token')
      return null
    }

    const data = await response.json()
    return data.access_token

  } catch (error) {
    console.error('Error getting PayPal access token:', error)
    return null
  }
}

