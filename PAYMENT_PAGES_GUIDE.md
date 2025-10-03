# Payment & Payout Pages - Complete Guide

## 📊 Overview

Two comprehensive pages have been created to track the complete payment lifecycle from invoice creation to final payout:

1. **Advertiser Payments Page** (`/advertiser/payments`)
2. **Publisher Payouts Page** (`/publisher/payouts`)

---

## 💳 Advertiser Payments Page

**Path:** `/advertiser/payments`

### Features:

#### **Stats Dashboard**
- **Total Paid**: All completed payments
- **Pending**: Invoices awaiting payment
- **Total Invoices**: All-time invoice count
- **Platform Fees**: Total 15% fees paid

#### **Payment Tracking**
- View all invoices and their statuses
- Real-time payment lifecycle progress:
  - ✅ Invoice Sent
  - ✅ Paid (advertiser)
  - ✅ Publisher Paid (after work approved)

#### **Payment Details**
For each payment you can see:
- **Order title** and **website**
- **Invoice number** and **status**
- **Total amount** with breakdown:
  - Platform fee (15%)
  - Publisher amount (85%)
- **Dates**: Created, paid
- **Quick actions**:
  - View Order
  - Open Invoice (PayPal)

#### **Filters & Search**
- Search by: Invoice number, order title, website name
- Filter by status: All, Invoice Sent, Paid, Cancelled

#### **Payment Statuses**
- 🔵 **SENT** - Invoice sent, awaiting payment
- 🟢 **PAID** - You've paid the invoice
- 🔴 **CANCELLED** - Invoice was cancelled
- 🟠 **REFUNDED** - Payment was refunded

---

## 💰 Publisher Payouts Page

**Path:** `/publisher/payouts`

### Features:

#### **Stats Dashboard**
- **Total Earned**: All payouts received in PayPal
- **Processing**: Payouts currently being sent
- **Pending**: Awaiting advertiser approval
- **Total Payouts**: All-time payout count

#### **PayPal Email Management**
- ⚠️ **Warning** if PayPal email not set
- Quick link to settings to add email
- Display current PayPal email
- Easy update option

#### **Payout Tracking**
- View all payouts and their statuses
- Real-time payout lifecycle progress:
  - ✅ Advertiser Paid (invoice paid)
  - ✅ Work Approved (advertiser approved your work)
  - ✅ Payout Initiated (money being sent)
  - ✅ Received (money in your PayPal)

#### **Payout Details**
For each payout you can see:
- **Order title** and **website**
- **Amount** you're receiving
- **Order total** and **platform fee** breakdown
- **PayPal email** where money was sent
- **Status** with visual indicator
- **Dates**: Initiated, completed
- **Failure reason** (if failed)

#### **Filters & Search**
- Search by: Order title, website, PayPal email
- Filter by status: All, Pending, Processing, Paid, Failed

#### **Payout Statuses**
- 🟡 **PENDING** - Waiting for advertiser approval
- 🔵 **PROCESSING** - Money being sent to your PayPal
- 🟢 **SUCCESS** - Money received in your PayPal
- 🔴 **FAILED** - Payout failed (shows reason)

---

## 🔄 Complete Payment Lifecycle

### Step-by-Step Flow:

```
1. PUBLISHER ACCEPTS ORDER
   ├─ Invoice created via PayPal API
   └─ Status: payment_pending

2. INVOICE SENT TO ADVERTISER
   ├─ Advertiser sees "Payment Required" card
   └─ Invoice status: SENT

3. ADVERTISER PAYS INVOICE
   ├─ Payment goes to platform's PayPal
   ├─ Webhook: INVOICING.INVOICE.PAID
   ├─ Invoice status: PAID
   └─ Order status: in_progress

4. PUBLISHER COMPLETES WORK
   ├─ Submits published URL
   └─ Order status: review

5. ADVERTISER APPROVES WORK
   ├─ Order status: completed
   ├─ Payout created via PayPal Payouts API
   ├─ Payout status: PROCESSING
   └─ Order status: payment_processing

6. PAYOUT PROCESSED
   ├─ Money sent from platform to publisher
   ├─ Webhook: PAYMENT.PAYOUTS-ITEM.SUCCEEDED
   ├─ Payout status: SUCCESS
   └─ Order status: paid (FINAL!)

7. COMPLETE! 🎉
   ├─ Advertiser paid ✅
   ├─ Work delivered ✅
   └─ Publisher paid ✅
```

---

## 💡 Key Features

### **Visual Progress Indicators**
Both pages show visual progress bars with checkmarks for each stage of the payment lifecycle, making it easy to see where each payment/payout currently stands.

### **Smart Filtering**
Advanced filtering and search capabilities allow users to quickly find specific transactions.

### **Real-time Updates**
Pages automatically reflect status changes via PayPal webhooks:
- Invoices update when paid
- Payouts update when completed
- Orders update when money changes hands

### **Error Handling**
- Failed payouts show clear error messages
- Missing PayPal email alerts for publishers
- Helpful guidance for next steps

### **Responsive Design**
Both pages are fully responsive and work beautifully on all screen sizes.

---

## 🎨 UI Components Used

- **Cards**: For stats and list items
- **Badges**: For status indicators with colors
- **Tables/Lists**: For displaying payments/payouts
- **Search & Filters**: For finding transactions
- **Progress Bars**: For lifecycle visualization
- **Alerts**: For warnings and errors
- **Buttons**: For actions (view order, view invoice)
- **Skeletons**: For loading states

---

## 📱 Navigation

### **Advertiser**
Dashboard → **Payment History** (in sidebar)

### **Publisher**
Dashboard → **Payouts** (in sidebar)

Both links were already in the navigation menus!

---

## 🔐 Security & Permissions

- **RLS Policies**: Ensure users only see their own payments/payouts
- **Authentication**: Required to access pages
- **Role-based**: Advertisers can't access publisher pages and vice versa
- **Admin Operations**: PayPal API calls use service role key

---

## 📊 Data Sources

### **Advertiser Payments Page**
Queries from `payments` table with joins:
- `orders` (title, status)
- `websites` (name, url)

### **Publisher Payouts Page**
Queries from `payouts` table with joins:
- `orders` (title, status)
- `websites` (name, url)
- `payments` (invoice details)
- `profiles` (PayPal email)

---

## 🚀 Future Enhancements

Potential improvements you could add:

1. **Export to CSV**: Download payment/payout history
2. **Date Range Filters**: Filter by custom date ranges
3. **Charts & Graphs**: Visual analytics for earnings/spending
4. **Email Notifications**: Alerts for new payments/payouts
5. **Bulk Actions**: Handle multiple payments at once
6. **Tax Reports**: Generate reports for tax purposes
7. **Payment Methods**: Support for other payment providers
8. **Automatic Payouts**: Schedule regular payout batches

---

## ✅ Complete!

Both pages are now live and fully functional. Users can:
- ✅ Track all their financial transactions
- ✅ See real-time payment status updates
- ✅ Understand where money is in the pipeline
- ✅ Access invoice links and order details
- ✅ Monitor earnings and spending
- ✅ Filter and search transactions easily

The payment system is now complete from end to end! 🎉

