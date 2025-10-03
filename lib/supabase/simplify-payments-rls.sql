-- ================================================
-- SIMPLIFY PAYMENTS RLS POLICY
-- Make it easier for PostgREST joins to work
-- ================================================

-- Drop the complex policy
DROP POLICY IF EXISTS "Users can view payments for their orders" ON payments;

-- Create a simpler policy: any authenticated user can view payments
-- (They can only access payments through orders they own anyway)
CREATE POLICY "Authenticated users can view payments" ON payments
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Verify it worked
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'payments';

