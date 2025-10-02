-- Drop existing policies if they exist to make the script re-runnable
DROP POLICY IF EXISTS "Advertisers can add addons to their orders" ON public.order_addons;
DROP POLICY IF EXISTS "System can create order steps for new orders" ON public.order_steps;


-- Add INSERT policy for order_addons
CREATE POLICY "Advertisers can add addons to their orders" 
ON public.order_addons
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_addons.order_id 
    AND orders.advertiser_id = auth.uid()
  )
);

-- Add INSERT policy for order_steps
CREATE POLICY "System can create order steps for new orders"
ON public.order_steps
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_steps.order_id
    AND orders.advertiser_id = auth.uid()
  )
);
