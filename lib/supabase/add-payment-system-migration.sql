-- ================================================
-- PAYMENT SYSTEM MIGRATION
-- Adds PayPal invoice and payout tracking
-- ================================================

-- ================================================
-- 1. UPDATE ORDER STATUSES
-- ================================================

-- Drop existing constraint
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new statuses including payment states
ALTER TABLE orders
ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'pending',              -- Advertiser created order
  'accepted',             -- Publisher accepted (brief state)
  'payment_pending',      -- Invoice sent, waiting for payment
  'in_progress',          -- Payment received, publisher working
  'review',               -- Work submitted, advertiser reviewing
  'revision',             -- Advertiser requested changes  
  'completed',            -- Advertiser approved, work done
  'payment_processing',   -- Sending payout to publisher
  'paid',                 -- Publisher fully paid (final state)
  'cancelled',            -- Order cancelled
  'disputed'              -- Dispute raised
));

-- Add payment tracking column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'not_required'
  CHECK (payment_status IN ('not_required', 'pending', 'paid', 'refunded', 'failed', 'processing'));

-- Add payout scheduling column (optional 7-day hold)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_scheduled_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN orders.payment_status IS 'Tracks payment state independently from order workflow';
COMMENT ON COLUMN orders.payout_scheduled_at IS 'When to release payout to publisher (for hold period)';

-- ================================================
-- 2. CREATE PAYMENTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- PayPal Invoice Details
  paypal_invoice_id VARCHAR(255) UNIQUE, -- PayPal's invoice ID
  invoice_number VARCHAR(100) UNIQUE,     -- Our internal invoice number
  invoice_status VARCHAR(50) DEFAULT 'DRAFT',  -- DRAFT, SENT, PAID, CANCELLED, REFUNDED, MARKED_AS_PAID
  invoice_url TEXT,                       -- Link for advertiser to view/pay
  
  -- Payment Amounts
  total_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,     -- Our commission (e.g., 15%)
  publisher_amount DECIMAL(10,2) NOT NULL, -- Amount publisher receives
  
  -- PayPal Transaction Details
  paypal_transaction_id VARCHAR(255),      -- Transaction ID when paid
  paid_amount DECIMAL(10,2),               -- Actual amount paid (in case of partial)
  
  -- Timestamps
  invoice_sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one payment per order
  UNIQUE(order_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_status ON payments(invoice_status);
CREATE INDEX IF NOT EXISTS idx_payments_paypal_invoice_id ON payments(paypal_invoice_id);

COMMENT ON TABLE payments IS 'Tracks PayPal invoices sent to advertisers';
COMMENT ON COLUMN payments.platform_fee IS 'Commission kept by platform (typically 10-20%)';

-- ================================================
-- 3. CREATE PAYOUTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  publisher_id UUID NOT NULL REFERENCES profiles(id),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- PayPal Payout Details
  paypal_payout_batch_id VARCHAR(255),     -- Batch ID from PayPal
  paypal_payout_item_id VARCHAR(255) UNIQUE, -- Individual payout item ID
  payout_status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, PROCESSING, SUCCESS, FAILED, UNCLAIMED, RETURNED, ONHOLD, BLOCKED, REFUNDED
  
  -- Amount
  amount DECIMAL(10,2) NOT NULL,           -- Amount sent to publisher
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Publisher Payment Info
  publisher_paypal_email VARCHAR(255) NOT NULL,
  
  -- Timestamps
  initiated_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error Handling
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payouts_publisher_id ON payouts(publisher_id);
CREATE INDEX IF NOT EXISTS idx_payouts_order_id ON payouts(order_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(payout_status);
CREATE INDEX IF NOT EXISTS idx_payouts_paypal_item_id ON payouts(paypal_payout_item_id);

COMMENT ON TABLE payouts IS 'Tracks PayPal payouts sent to publishers';
COMMENT ON COLUMN payouts.retry_count IS 'Number of times payout was retried after failure';

-- ================================================
-- 4. ADD PAYPAL EMAIL TO PROFILES
-- ================================================

-- Add PayPal email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paypal_email VARCHAR(255);

COMMENT ON COLUMN profiles.paypal_email IS 'Publisher PayPal email for receiving payouts';

-- ================================================
-- 5. CREATE TRIGGER FOR UPDATED_AT
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payments table
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for payouts table
DROP TRIGGER IF EXISTS update_payouts_updated_at ON payouts;
CREATE TRIGGER update_payouts_updated_at
    BEFORE UPDATE ON payouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 6. RLS POLICIES FOR PAYMENT TABLES
-- ================================================

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Payments: Users can view payments for their orders
DROP POLICY IF EXISTS "Users can view payments for their orders" ON payments;
CREATE POLICY "Users can view payments for their orders" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
        AND (orders.advertiser_id = auth.uid() OR orders.publisher_id = auth.uid())
    )
  );

-- Payouts: Publishers can view their own payouts
DROP POLICY IF EXISTS "Publishers can view their payouts" ON payouts;
CREATE POLICY "Publishers can view their payouts" ON payouts
  FOR SELECT
  USING (publisher_id = auth.uid());

-- Payouts: Advertisers can view payouts for their orders
DROP POLICY IF EXISTS "Advertisers can view payouts for their orders" ON payouts;
CREATE POLICY "Advertisers can view payouts for their orders" ON payouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payouts.order_id
        AND orders.advertiser_id = auth.uid()
    )
  );

-- ================================================
-- 7. HELPER VIEWS (OPTIONAL BUT USEFUL)
-- ================================================

-- View for complete payment information
CREATE OR REPLACE VIEW payment_details AS
SELECT 
  p.id AS payment_id,
  p.order_id,
  o.title AS order_title,
  o.status AS order_status,
  o.payment_status,
  p.total_amount,
  p.platform_fee,
  p.publisher_amount,
  p.invoice_status,
  p.invoice_url,
  p.paid_at,
  pay.payout_status,
  pay.amount AS payout_amount,
  pay.completed_at AS payout_completed_at,
  o.advertiser_id,
  o.publisher_id
FROM payments p
JOIN orders o ON o.id = p.order_id
LEFT JOIN payouts pay ON pay.payment_id = p.id;

COMMENT ON VIEW payment_details IS 'Complete payment information including order, invoice, and payout status';

-- ================================================
-- 8. INITIAL DATA / DEFAULTS
-- ================================================

-- Set payment_status to 'not_required' for all existing orders
UPDATE orders 
SET payment_status = 'not_required' 
WHERE payment_status IS NULL;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================

-- Summary of changes:
-- ✓ Added payment_status and payout_scheduled_at to orders table
-- ✓ Created payments table for tracking PayPal invoices
-- ✓ Created payouts table for tracking PayPal payouts to publishers
-- ✓ Added paypal_email to profiles table
-- ✓ Updated order status constraints
-- ✓ Added RLS policies for payment security
-- ✓ Created helper views for payment reporting

