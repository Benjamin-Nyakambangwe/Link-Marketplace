-- Drop existing foreign key constraints if they exist to make the script re-runnable.
-- We are targeting both advertiser and publisher foreign keys.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_advertiser_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_publisher_id_fkey;

-- Re-create the advertiser foreign key to point directly to the profiles table.
ALTER TABLE public.orders 
ADD CONSTRAINT orders_advertiser_id_fkey 
FOREIGN KEY (advertiser_id) 
REFERENCES public.profiles (id);

-- Re-create the publisher foreign key to point directly to the profiles table.
ALTER TABLE public.orders 
ADD CONSTRAINT orders_publisher_id_fkey 
FOREIGN KEY (publisher_id) 
REFERENCES public.profiles (id);
