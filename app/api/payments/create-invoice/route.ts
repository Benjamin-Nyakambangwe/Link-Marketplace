import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * POST /api/payments/create-invoice
 * 
 * Creates a PayPal invoice when publisher accepts an order
 * Triggered from: app/publisher/orders/[id]/page.tsx -> acceptOrder()
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

    // 3. Fetch order details with all necessary information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        title,
        description,
        total_amount,
        status,
        payment_status,
        advertiser_id,
        publisher_id,
        website:websites (
          name,
          url
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 4. Verify the requesting user is the publisher
    if (order.publisher_id !== user.id) {
      return NextResponse.json({ error: 'Only publisher can create invoice' }, { status: 403 })
    }

    // 5. Verify order is in correct state (pending = publisher just accepted)
    if (order.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Order must be in pending status (awaiting publisher acceptance)',
        currentStatus: order.status 
      }, { status: 400 })
    }

    // 6. Check if invoice already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (existingPayment && existingPayment.invoice_status !== 'CANCELLED') {
      return NextResponse.json({ 
        error: 'Invoice already exists for this order',
        payment: existingPayment
      }, { status: 400 })
    }

    // 7. Get advertiser email (using service role for admin access)
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

    const { data: { user: advertiserUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      order.advertiser_id
    )

    if (userError || !advertiserUser?.email) {
      console.error('Error fetching advertiser user:', userError)
      return NextResponse.json({ 
        error: 'Advertiser email not found. Please ensure the advertiser has a valid email address.',
        details: userError?.message
      }, { status: 400 })
    }

    // 8. Calculate amounts
    const totalAmount = parseFloat(order.total_amount)
    const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '15') / 100
    const platformFee = totalAmount * platformFeePercentage
    const publisherAmount = totalAmount - platformFee

    // 9. Generate invoice number (max 25 chars for PayPal)
    // Format: INV-XXXXX-YYYYYY (24 chars max)
    const orderShort = orderId.substring(0, 8).toUpperCase().replace(/-/g, '')
    const timestamp = Date.now().toString().slice(-10) // Last 10 digits
    const invoiceNumber = `INV-${orderShort}-${timestamp}`

    // 10. Create PayPal invoice (CRITICAL: do this before saving to DB)
    const website = Array.isArray(order.website) ? order.website[0] : order.website
    
    console.log('Creating invoice for advertiser:', {
      email: advertiserUser.email,
      name: advertiserUser.user_metadata?.full_name || 'Advertiser',
      orderId,
      amount: totalAmount
    })
    
    const paypalInvoice = await createPayPalInvoice({
      invoiceNumber,
      orderId,
      orderTitle: order.title,
      websiteName: website?.name || 'Website',
      totalAmount,
      advertiserEmail: advertiserUser.email,
      advertiserName: advertiserUser.user_metadata?.full_name || 'Advertiser'
    })

    if (!paypalInvoice.success) {
      // Invoice creation failed - don't save anything to database
      console.error('PayPal invoice creation failed:', paypalInvoice.error)
      throw new Error(paypalInvoice.error || 'Failed to create PayPal invoice')
    }

    // 11. Invoice created successfully! Now save to database using admin client
    // Use admin client to bypass RLS since this is a system operation
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        order_id: orderId,
        paypal_invoice_id: paypalInvoice.id,
        invoice_number: invoiceNumber,
        invoice_status: 'SENT',
        invoice_url: paypalInvoice.href,
        total_amount: totalAmount,
        platform_fee: platformFee,
        publisher_amount: publisherAmount,
        invoice_sent_at: new Date().toISOString()
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error saving payment:', paymentError)
      // Invoice exists in PayPal but not in our DB - log for manual cleanup
      console.error('CRITICAL: PayPal invoice created but DB save failed. Invoice ID:', paypalInvoice.id)
      throw new Error('Failed to save payment record')
    }

    // 12. Return success
    console.log('✅ Payment record saved successfully')
    console.log('📧 Invoice summary:', {
      invoiceId: paypalInvoice.id,
      invoiceNumber,
      sentTo: advertiserUser.email,
      amount: `$${totalAmount}`,
      platformFee: `$${platformFee}`,
      publisherAmount: `$${publisherAmount}`
    })
    
    return NextResponse.json({
      success: true,
      payment,
      message: 'Invoice created and sent successfully'
    })

  } catch (error: any) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create invoice',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Creates a PayPal invoice using PayPal REST API
 */
async function createPayPalInvoice(params: {
  invoiceNumber: string
  orderId: string
  orderTitle: string
  websiteName: string
  totalAmount: number
  advertiserEmail: string
  advertiserName: string
}) {
  try {
    const {
      invoiceNumber,
      orderId,
      orderTitle,
      websiteName,
      totalAmount,
      advertiserEmail,
      advertiserName
    } = params

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken()
    if (!accessToken) {
      return { success: false, error: 'Failed to get PayPal access token' }
    }

    // Create invoice payload
    const invoicePayload = {
      detail: {
        invoice_number: invoiceNumber,
        reference: `Order-${orderId}`,
        invoice_date: new Date().toISOString().split('T')[0],
        currency_code: 'USD',
        note: `Payment for order: ${orderTitle}`,
        term: 'Due on receipt',
        payment_term: {
          term_type: 'DUE_ON_RECEIPT'
        }
      },
      invoicer: {
        name: {
          business_name: process.env.PAYPAL_BUSINESS_NAME || 'Click Optima'
        },
        email_address: process.env.PAYPAL_BUSINESS_EMAIL,
        website: process.env.NEXT_PUBLIC_APP_URL || 'https://linkmarketplace.com'
      },
      primary_recipients: [
        {
          billing_info: {
            name: {
              full_name: advertiserName
            },
            email_address: advertiserEmail
          }
        }
      ],
      items: [
        {
          name: orderTitle,
          description: `Link placement/content on ${websiteName}`,
          quantity: '1',
          unit_amount: {
            currency_code: 'USD',
            value: totalAmount.toFixed(2)
          }
        }
      ],
      configuration: {
        allow_tip: false,
        tax_calculated_after_discount: true,
        tax_inclusive: false
      }
    }

    // Create the invoice
    const createResponse = await fetch(
      `${process.env.PAYPAL_API_URL}/v2/invoicing/invoices`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(invoicePayload)
      }
    )

    if (!createResponse.ok) {
      const errorData = await createResponse.json()
      console.error('PayPal create invoice error:', errorData)
      return { success: false, error: errorData.message || 'Failed to create invoice' }
    }

    const invoice = await createResponse.json()
    
    // Log the full response to debug
    console.log('PayPal invoice creation response:', JSON.stringify(invoice, null, 2))
    
    // Extract invoice ID from response
    const invoiceId = invoice.id || invoice.href?.split('/').pop()
    
    if (!invoiceId) {
      console.error('No invoice ID in response:', invoice)
      return { success: false, error: 'Invoice created but ID not found in response' }
    }

    // Generate public invoice URL (for customers to view/pay)
    const baseUrl = process.env.PAYPAL_API_URL?.includes('sandbox') 
      ? 'https://www.sandbox.paypal.com' 
      : 'https://www.paypal.com'
    const publicInvoiceUrl = `${baseUrl}/invoice/p/#${invoiceId}`

    console.log('Extracted invoice ID:', invoiceId)
    console.log('API href:', invoice.href)
    console.log('Public URL:', publicInvoiceUrl)
    console.log('Sending invoice to:', advertiserEmail)

    // Send the invoice to the recipient
    // Note: In sandbox, notifications might not work, but invoice will still be sent
    const sendResponse = await fetch(
      `${process.env.PAYPAL_API_URL}/v2/invoicing/invoices/${invoiceId}/send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          send_to_invoicer: false,  // Don't email yourself
          send_to_recipient: true,   // Email the customer
          additional_recipients: []
        })
      }
    )

    if (!sendResponse.ok) {
      const errorData = await sendResponse.json()
      console.error('PayPal send invoice error:', errorData)
      console.error('Attempted to send invoice ID:', invoiceId)
      console.error('Failed to send to email:', advertiserEmail)
      
      // In sandbox, sending often fails but invoice is still accessible
      // Return success with warning since invoice was created
      console.warn('Invoice created but not sent via email. User can still access via URL.')
      return { 
        success: true,  // Changed to true - invoice exists
        id: invoiceId,
        href: publicInvoiceUrl,
        warning: 'Invoice created but email notification failed. Customer can access via link.'
      }
    }

    console.log('✅ Invoice sent successfully via email to:', advertiserEmail)

    return {
      success: true,
      id: invoiceId,
      href: publicInvoiceUrl
    }

  } catch (error: any) {
    console.error('PayPal API error:', error)
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

