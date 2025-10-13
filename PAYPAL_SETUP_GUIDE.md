# PayPal Payment System Setup Guide

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# ================================================
# SUPABASE (Required for payment system)
# ================================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key  # Required for admin access

# ================================================
# PAYPAL API CREDENTIALS
# ================================================
# Get these from: https://developer.paypal.com/dashboard/

# For Sandbox (Testing):
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_API_URL=https://api-m.sandbox.paypal.com

# For Production:
# PAYPAL_CLIENT_ID=your_paypal_live_client_id
# PAYPAL_CLIENT_SECRET=your_paypal_live_client_secret
# PAYPAL_API_URL=https://api-m.paypal.com

# PayPal Business Details
PAYPAL_BUSINESS_NAME="Your Marketplace Name"
PAYPAL_BUSINESS_EMAIL=billing@yourmarketplace.com

# PayPal Webhook ID (Get from PayPal Dashboard after creating webhook)
PAYPAL_WEBHOOK_ID=your_webhook_id

# ================================================
# PLATFORM SETTINGS
# ================================================
# Platform commission percentage (e.g., 15 for 15%)
PLATFORM_FEE_PERCENTAGE=15

# Application URL (for PayPal invoices and redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Setup Instructions

### 1. Get Supabase Service Role Key

The payment system needs admin access to read user emails.

**To get it:**
1. Go to your Supabase Dashboard
2. Click on **Project Settings** (gear icon)
3. Go to **API** section
4. Find **Service Role Key** (secret key)
5. Copy and add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important:** Never expose this key in client-side code!

---

### 2. Database Setup

Run the payment system migration in your Supabase SQL Editor:

```bash
lib/supabase/add-payment-system-migration.sql
```

This creates:
- `payments` table (tracks invoices)
- `payouts` table (tracks publisher payouts)
- Updates to `orders` table
- PayPal email field in `profiles`

---

### 2. PayPal Developer Account Setup

#### Create/Access PayPal Developer Account:
1. Go to https://developer.paypal.com
2. Sign in or create account
3. Go to **Dashboard** > **My Apps & Credentials**

#### Create App (if needed):
1. Click **Create App**
2. App Name: "Click Optima"
3. App Type: **Merchant**
4. Click **Create App**

#### Get API Credentials:
1. In your app, you'll see:
   - **Client ID** (copy this)
   - **Secret** (click "Show" then copy)
2. For testing: Use **Sandbox** credentials
3. For production: Switch to **Live** and get those credentials

---

### 3. Configure Webhooks

PayPal will notify your app when payments happen.

#### Create Webhook:
1. Go to **Dashboard** > **Webhooks**
2. Click **Create Webhook**
3. **Webhook URL**: `https://yourdomain.com/api/payments/webhooks/paypal`
   - For local testing: Use ngrok or similar: `https://abc123.ngrok.io/api/payments/webhooks/paypal`
4. **Event types** - Select these:
   - ✅ `INVOICING.INVOICE.PAID` - When advertiser pays
   - ✅ `PAYMENT.PAYOUTS-ITEM.SUCCEEDED` - When publisher receives money
   - ✅ `PAYMENT.PAYOUTS-ITEM.FAILED` - When payout fails
   - ✅ `INVOICING.INVOICE.CANCELLED` - When invoice is cancelled
5. Click **Save**
6. Copy the **Webhook ID** and add to your `.env.local`

---

### 4. PayPal Sandbox Testing

#### Create Test Accounts:
1. Go to **Dashboard** > **Sandbox** > **Accounts**
2. You'll see default accounts or create new ones:
   - **Business Account** (for receiving platform payments)
   - **Personal Accounts** (for testing as advertiser/publisher)

#### Test the Flow:
1. **Publisher accepts order** → Invoice sent to advertiser
2. **Advertiser logs in** to sandbox.paypal.com with test personal account
3. **Pays the invoice**
4. **Webhook fires** → Your app updates order to "in_progress"
5. **Publisher completes work** → Advertiser approves
6. **Payout sent** to publisher's test PayPal account
7. **Webhook fires** → Order marked as "paid"

---

### 5. Production Deployment

When ready to go live:

1. **Switch to Live Credentials**:
   ```bash
   PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_secret
   PAYPAL_API_URL=https://api-m.paypal.com
   ```

2. **Update Webhook URL**:
   - In PayPal Dashboard, update webhook to production URL
   - Get new Webhook ID for live environment

3. **Business Account Verification**:
   - Ensure your PayPal Business account is fully verified
   - Add bank account for receiving funds
   - Complete any required documentation

---

## How the Payment Flow Works

### Flow Diagram:

```
1. Advertiser creates order
   ↓
2. Publisher accepts order
   ↓ (Triggers: /api/payments/create-invoice)
3. PayPal invoice sent to advertiser
   Status: payment_pending
   ↓
4. Advertiser pays invoice
   ↓ (Webhook: INVOICING.INVOICE.PAID)
5. Order status → in_progress
   Publisher notified: "Payment received!"
   ↓
6. Publisher completes work & submits URL
   Status: review
   ↓
7. Advertiser reviews & approves
   ↓ (Triggers: /api/payments/create-payout)
8. Payout sent to publisher
   Status: payment_processing
   ↓ (Webhook: PAYMENT.PAYOUTS-ITEM.SUCCEEDED)
9. Order status → paid
   Publisher notified: "You've been paid!"
   ✅ Complete!
```

### Money Flow:

```
Advertiser pays $150
  ↓
Your PayPal Business Account
  ├─ Platform Fee (15%): $22.50 (you keep)
  └─ Publisher Amount (85%): $127.50 (sent to publisher)
```

---

## Troubleshooting

### Webhooks not working?

1. **Check webhook URL** is accessible (use ngrok for local testing)
2. **Verify webhook events** are selected in PayPal Dashboard
3. **Check logs** in PayPal Dashboard > Webhooks > Your Webhook > Recent Deliveries
4. **Test webhook** manually in PayPal Dashboard

### Invoice creation failing?

1. **Verify API credentials** are correct
2. **Check PayPal API status**: https://www.paypal-status.com/
3. **Review error logs** in your API route
4. **Test API call** directly with Postman

### Payout failing?

1. **Publisher PayPal email** must be valid
2. **PayPal account** must accept payments
3. **Sufficient funds** in your PayPal Business account
4. **Country restrictions** - PayPal Payouts not available in all countries

---

## API Endpoints

| Endpoint | Purpose | Triggered By |
|----------|---------|-------------|
| `POST /api/payments/create-invoice` | Creates PayPal invoice | Publisher accepts order |
| `POST /api/payments/create-payout` | Sends payout to publisher | Advertiser approves work |
| `POST /api/payments/webhooks/paypal` | Handles PayPal events | PayPal webhooks |

---

## Security Notes

✅ **Webhook signature verification** - Prevents unauthorized calls
✅ **User authentication** - All endpoints check auth
✅ **Authorization** - Only order participants can take actions
✅ **RLS policies** - Database enforces access control
✅ **HTTPS required** - PayPal webhooks require SSL

---

## Support Resources

- **PayPal Developer Docs**: https://developer.paypal.com/docs/
- **Invoicing API**: https://developer.paypal.com/docs/api/invoicing/v2/
- **Payouts API**: https://developer.paypal.com/docs/api/payments.payouts-batch/v1/
- **Webhooks Guide**: https://developer.paypal.com/api/rest/webhooks/
- **PayPal Support**: https://developer.paypal.com/support/

---

## Next Steps

Once PayPal is configured:

1. ✅ Run database migration
2. ✅ Add environment variables
3. ✅ Configure webhooks
4. ✅ Test with sandbox accounts
5. ✅ Update publisher profiles to add PayPal email
6. ✅ Test full order flow
7. ✅ Monitor first few transactions closely
8. ✅ Switch to production when ready

Good luck! 🚀

