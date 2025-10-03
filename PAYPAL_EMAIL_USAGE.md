# PayPal Email Usage in the System

## Two Different Email Fields - Here's Why

### 1. **Advertiser Email** (For Invoices)
**Source:** `auth.users.email` (Supabase Auth)
**Used for:** Sending PayPal invoices
**When:** Publisher accepts an order

```javascript
// From: app/api/payments/create-invoice/route.ts
const { data: { user: advertiserUser } } = await supabaseAdmin.auth.admin.getUserById(
  order.advertiser_id
)
// Invoice sent to: advertiserUser.email
```

**Why we use auth email:**
- This is their account email (what they signed up with)
- Standard practice for billing
- They're already verified through auth
- Don't need to ask them to set it separately

**Example:**
- Advertiser signs up with: `advertiser@company.com`
- Invoice automatically sent to: `advertiser@company.com`

---

### 2. **Publisher PayPal Email** (For Payouts)
**Source:** `profiles.paypal_email` (Custom field)
**Used for:** Sending money to publishers
**When:** Advertiser approves completed work

```javascript
// From: app/api/payments/create-payout/route.ts
const { data: publisherProfile } = await supabase
  .from('profiles')
  .select('paypal_email')
  .eq('id', order.publisher_id)
  .single()
// Payout sent to: publisherProfile.paypal_email
```

**Why we use a separate field:**
- Publishers might want payouts to a different PayPal than their signup email
- Business vs personal PayPal accounts
- Tax/accounting separation
- Publishers need to EXPLICITLY set this up

**Example:**
- Publisher signs up with: `john@gmail.com`
- But sets PayPal email to: `john.business@paypal.com`
- Payout goes to: `john.business@paypal.com`

---

## Summary Table

| User Type | Email For | Source | Required Setup |
|-----------|-----------|--------|----------------|
| **Advertiser** | Receiving invoices | `auth.users.email` | ❌ No (automatic) |
| **Publisher** | Receiving payouts | `profiles.paypal_email` | ✅ Yes (must set) |

---

## Publisher Setup Required

Publishers MUST add their PayPal email before they can receive payouts:

### Where to Add It:
You need to create a settings/profile page where publishers can:
1. View their current PayPal email
2. Update/add their PayPal email
3. Validate the email format

### Example UI Needed:
```tsx
// app/publisher/settings/page.tsx
<Label>PayPal Email (for receiving payments)</Label>
<Input 
  type="email"
  value={paypalEmail}
  onChange={(e) => setPaypalEmail(e.target.value)}
  placeholder="your-paypal@email.com"
/>
<Button onClick={savePayPalEmail}>Save</Button>
```

### Validation in Payout API:
Already implemented - if publisher hasn't set their PayPal email, payout will fail with clear error:
```javascript
if (!publisherProfile?.paypal_email) {
  return { 
    error: 'Publisher PayPal email not found. Publisher must set up payment info.'
  }
}
```

---

## Current Status

✅ **Done:**
- Database field added: `profiles.paypal_email`
- Invoice API uses advertiser's auth email
- Payout API checks for publisher's PayPal email

⏳ **TODO:**
- Create publisher settings page to add/edit PayPal email
- Add UI validation for PayPal email format
- Show warning if publisher hasn't set PayPal email yet

---

## Testing

### For Advertisers (No Setup Needed):
1. Sign up with any email: `test@example.com`
2. Create order
3. Publisher accepts → Invoice automatically sent to `test@example.com`

### For Publishers (Setup Required):
1. Sign up
2. **Must go to settings and add PayPal email**
3. Accept orders
4. When order completes, payout sent to their PayPal email

**In Sandbox:** Use a test PayPal account email like:
- `publisher-test@personal.example.com`
- (Create this in PayPal Developer Dashboard > Sandbox > Accounts)

