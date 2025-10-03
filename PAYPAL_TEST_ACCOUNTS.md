# PayPal Sandbox Test Accounts

## How to Get Test Account Credentials

1. Go to: https://developer.paypal.com/dashboard/accounts
2. You'll see a list of test accounts (Business and Personal)
3. Click on a **Personal** account (this is your "advertiser" who will pay)
4. Copy the **Email** and **Password** shown
5. Use these to log in at the PayPal invoice page

---

## Using Test Accounts

### To Pay an Invoice (as Advertiser):
- Log in with a **Personal** test account
- Complete the payment on the invoice page

### To Receive Payments (as Publisher):
- Set your **PayPal email** in Settings to match another test Personal account email
- When advertiser approves work, payout goes to that account

---

## Testing the Full Flow

1. **Publisher** accepts order → Invoice created
2. **Advertiser** clicks "View & Pay Invoice"
3. Log in with **Personal test account #1**
4. Pay the invoice
5. Order updates to "In Progress" (via webhook)
6. **Publisher** submits work
7. **Advertiser** approves work
8. Payout sent to publisher's PayPal email (should be **Personal test account #2**)
9. Check payout status in PayPal dashboard

---

## Important Notes

⚠️ **Sandbox emails don't send** - You won't get real emails in sandbox mode
✅ **Direct links work** - The invoice URL will always work
✅ **Webhooks work** - PayPal will notify your app when payments happen
🔄 **Use different accounts** - Use one Personal account for advertiser, another for publisher

---

## Example Test Accounts

PayPal creates these automatically:
- `sb-xxxxx@personal.example.com` (Personal - use as advertiser)
- `sb-yyyyy@personal.example.com` (Personal - use as publisher)
- `sb-zzzzz@business.example.com` (Business - your platform account)

You can create more accounts in the PayPal Dashboard if needed!

