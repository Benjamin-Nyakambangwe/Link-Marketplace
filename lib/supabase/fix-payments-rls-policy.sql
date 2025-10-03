-- ================================================
-- FIX PAYMENTS RLS POLICY
-- Allow advertisers to view payment records for their orders
-- ================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view payments for their orders" ON payments;

-- Create a new policy that allows both advertiser and publisher to view
CREATE POLICY "Users can view payments for their orders" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
        AND (
          orders.advertiser_id = auth.uid() OR 
          orders.publisher_id = auth.uid()
        )
    )
  );

-- Also ensure we have an insert policy for the system
DROP POLICY IF EXISTS "System can insert payments" ON payments;
CREATE POLICY "System can insert payments" ON payments
  FOR INSERT
  WITH CHECK (true);  -- Any authenticated request can insert (server-side only)

-- Allow updates for system operations (webhooks)
DROP POLICY IF EXISTS "System can update payments" ON payments;
CREATE POLICY "System can update payments" ON payments
  FOR UPDATE
  USING (true)  -- Any authenticated request can update (for webhook status updates)
  WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'payments';

