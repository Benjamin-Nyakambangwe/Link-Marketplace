import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import crypto from 'crypto'

/**
 * GET /api/payments/webhooks/paypal
 * Test endpoint to verify webhook URL is reachable
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'Webhook endpoint is active',
    timestamp: new Date().toISOString(),
    message: 'This endpoint is ready to receive PayPal webhooks'
  })
}

/**
 * POST /api/payments/webhooks/paypal
 * 
 * Handles PayPal webhook events:
 * - INVOICING.INVOICE.PAID - When advertiser pays invoice
 * - PAYMENT.PAYOUTS-ITEM.SUCCEEDED - When publisher payout succeeds
 * - PAYMENT.PAYOUTS-ITEM.FAILED - When publisher payout fails
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 WEBHOOK RECEIVED!')
    
    const body = await request.text()
    const headers = Object.fromEntries(request.headers)
    
    console.log('Headers:', JSON.stringify(headers, null, 2))
    console.log('Body preview:', body.substring(0, 200))
    
    // 1. Verify webhook signature (important for security!)
    // TEMPORARILY DISABLED for testing - ENABLE IN PRODUCTION!
    const isValid = await verifyPayPalWebhook(body, headers)
    if (!isValid) {
      console.error('⚠️ Invalid PayPal webhook signature - ALLOWING FOR TESTING')
      // return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    console.log('✅ PayPal Webhook Event:', event.event_type)
    console.log('📦 Event data:', JSON.stringify(event, null, 2))

    // 2. Route to appropriate handler based on event type
    switch (event.event_type) {
      case 'INVOICING.INVOICE.PAID':
        return await handleInvoicePaid(event)
      
      case 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED':
        return await handlePayoutSucceeded(event)
      
      case 'PAYMENT.PAYOUTS-ITEM.FAILED':
        return await handlePayoutFailed(event)
      
      case 'INVOICING.INVOICE.CANCELLED':
        return await handleInvoiceCancelled(event)
      
      default:
        console.log('Unhandled webhook event:', event.event_type)
        return NextResponse.json({ received: true })
    }

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handles INVOICING.INVOICE.PAID event
 * Triggered when advertiser pays the invoice
 */
async function handleInvoicePaid(event: any) {
  // Use admin client to bypass RLS
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
  
  try {
    // PayPal sends invoice data nested under event.resource.invoice
    const invoice = event.resource.invoice || event.resource
    const invoiceId = invoice.id
    const transactionId = invoice.payments?.transactions?.[0]?.payment_id
    const paidAmount = parseFloat(invoice.amount?.value || invoice.amount?.total || 0)

    console.log(`💰 Invoice paid: ${invoiceId}`)
    console.log(`💳 Transaction: ${transactionId}`)
    console.log(`💵 Amount: $${paidAmount}`)

    // 1. Find payment record
    console.log(`🔍 Looking for payment with invoice ID: ${invoiceId}`)
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*, orders(*)')
      .eq('paypal_invoice_id', invoiceId)
      .single()

    if (paymentError || !payment) {
      console.error('❌ Payment not found for invoice:', invoiceId, paymentError)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    console.log(`✅ Found payment record for order: ${payment.order_id}`)

    // 2. Update payment record
    console.log(`📝 Updating payment status to PAID...`)
    const { error: updatePaymentError } = await supabaseAdmin
      .from('payments')
      .update({
        invoice_status: 'PAID',
        paid_at: new Date().toISOString(),
        paypal_transaction_id: transactionId
      })
      .eq('id', payment.id)

    if (updatePaymentError) {
      console.error('❌ Error updating payment:', updatePaymentError)
    } else {
      console.log('✅ Payment updated successfully')
    }

    // 3. Update order status to in_progress
    console.log(`📝 Updating order status to in_progress...`)
    const { error: updateOrderError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'in_progress',
        payment_status: 'paid'
      })
      .eq('id', payment.order_id)

    if (updateOrderError) {
      console.error('❌ Error updating order:', updateOrderError)
    } else {
      console.log('✅ Order updated successfully')
    }

    // 4. Update workflow steps
    // Mark step 2 (Complete Work) as in_progress
    console.log(`📝 Updating workflow step 2 to in_progress...`)
    const { error: updateStepError } = await supabaseAdmin
      .from('order_steps')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('order_id', payment.order_id)
      .eq('step_number', 2)

    if (updateStepError) {
      console.error('❌ Error updating step:', updateStepError)
    } else {
      console.log('✅ Step updated successfully')
    }

    // TODO: Send notification to publisher
    console.log(`✅ Payment confirmed for order ${payment.order_id}. Publisher can start work.`)

    return NextResponse.json({ 
      success: true,
      message: 'Invoice payment processed'
    })

  } catch (error: any) {
    console.error('Error handling invoice paid:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Handles PAYMENT.PAYOUTS-ITEM.SUCCEEDED event
 * Triggered when payout to publisher succeeds
 */
async function handlePayoutSucceeded(event: any) {
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
  
  try {
    const payoutItemId = event.resource.payout_item_id
    const payoutBatchId = event.resource.payout_batch_id
    const senderItemId = event.resource.payout_item?.sender_item_id
    
    console.log(`💸 Payout succeeded:`, {
      payoutItemId,
      payoutBatchId,
      senderItemId
    })

    // 1. Find payout record (try by payout_item_id first, then by batch_id)
    let payout = null
    let payoutError = null

    // Try to find by payout_item_id
    const { data: payoutByItemId, error: error1 } = await supabaseAdmin
      .from('payouts')
      .select('*')
      .eq('paypal_payout_item_id', payoutItemId)
      .single()

    if (payoutByItemId) {
      payout = payoutByItemId
    } else {
      // Try to find by batch_id
      console.log(`🔍 Not found by item_id, trying batch_id: ${payoutBatchId}`)
      const { data: payoutByBatchId, error: error2 } = await supabaseAdmin
        .from('payouts')
        .select('*')
        .eq('paypal_payout_batch_id', payoutBatchId)
        .single()

      if (payoutByBatchId) {
        payout = payoutByBatchId
      } else {
        payoutError = error2 || error1
      }
    }

    if (!payout) {
      console.error('❌ Payout not found:', { payoutItemId, payoutBatchId, senderItemId })
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    console.log(`✅ Found payout record for order: ${payout.order_id}`)

    // 2. Update payout status (and save item_id if we didn't have it)
    const updateData: any = {
      payout_status: 'SUCCESS',
      completed_at: new Date().toISOString()
    }
    
    // If we found by batch_id but don't have item_id stored, save it now
    if (!payout.paypal_payout_item_id && payoutItemId) {
      updateData.paypal_payout_item_id = payoutItemId
      console.log(`📝 Saving missing payout_item_id: ${payoutItemId}`)
    }

    await supabaseAdmin
      .from('payouts')
      .update(updateData)
      .eq('id', payout.id)

    // 3. Update order to final 'paid' status
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'paid'
      })
      .eq('id', payout.order_id)

    // TODO: Send notification to publisher
    console.log(`✅ Payout successful for order ${payout.order_id}. Publisher has been paid.`)

    return NextResponse.json({ 
      success: true,
      message: 'Payout success processed'
    })

  } catch (error: any) {
    console.error('Error handling payout succeeded:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Handles PAYMENT.PAYOUTS-ITEM.FAILED event
 * Triggered when payout to publisher fails
 */
async function handlePayoutFailed(event: any) {
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
  
  try {
    const payoutItemId = event.resource.payout_item_id
    const errorMessage = event.resource.errors?.[0]?.message || 'Payout failed'
    
    console.error(`❌ Payout failed: ${payoutItemId}, Reason: ${errorMessage}`)

    // 1. Find payout record
    const { data: payout, error: payoutError } = await supabaseAdmin
      .from('payouts')
      .select('*')
      .eq('paypal_payout_item_id', payoutItemId)
      .single()

    if (payoutError || !payout) {
      console.error('❌ Payout not found:', payoutItemId)
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    // 2. Update payout status
    await supabaseAdmin
      .from('payouts')
      .update({
        payout_status: 'FAILED',
        failure_reason: errorMessage
      })
      .eq('id', payout.id)

    // 3. Update order status back to completed (from payment_processing)
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'completed',
        payment_status: 'failed'
      })
      .eq('id', payout.order_id)

    // TODO: Send alert to admin to manually handle the payout
    // TODO: Notify publisher about the issue
    console.error(`⚠️ Admin action required: Payout failed for order ${payout.order_id}`)

    return NextResponse.json({ 
      success: true,
      message: 'Payout failure recorded'
    })

  } catch (error: any) {
    console.error('Error handling payout failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Handles INVOICING.INVOICE.CANCELLED event
 */
async function handleInvoiceCancelled(event: any) {
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
  
  try {
    const invoiceId = event.resource.id
    
    console.log(`🚫 Invoice cancelled: ${invoiceId}`)
    
    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({ invoice_status: 'CANCELLED' })
      .eq('paypal_invoice_id', invoiceId)

    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('Error handling invoice cancelled:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Verifies PayPal webhook signature
 * Important: Prevents unauthorized webhook calls
 */
async function verifyPayPalWebhook(body: string, headers: any): Promise<boolean> {
  try {
    // In production, you should verify the webhook signature
    // For now, we'll do basic verification
    
    // Check required headers
    if (!headers['paypal-transmission-id'] || !headers['paypal-transmission-sig']) {
      return false
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken()
    if (!accessToken) {
      return false
    }

    // Verify webhook signature via PayPal API
    const verifyPayload = {
      transmission_id: headers['paypal-transmission-id'],
      transmission_time: headers['paypal-transmission-time'],
      cert_url: headers['paypal-cert-url'],
      auth_algo: headers['paypal-auth-algo'],
      transmission_sig: headers['paypal-transmission-sig'],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID, // You'll get this when setting up webhooks
      webhook_event: JSON.parse(body)
    }

    const response = await fetch(
      `${process.env.PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(verifyPayload)
      }
    )

    if (!response.ok) {
      return false
    }

    const result = await response.json()
    return result.verification_status === 'SUCCESS'

  } catch (error) {
    console.error('Webhook verification error:', error)
    // In development, you might want to return true to test
    // In production, always return false on error
    return process.env.NODE_ENV === 'development'
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
      return null
    }

    const data = await response.json()
    return data.access_token

  } catch (error) {
    return null
  }
}

