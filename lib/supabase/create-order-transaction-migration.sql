-- Drop the old, unused "listings" table if it exists
DROP TABLE IF EXISTS public.listings;

-- Drop the function first, as it depends on the custom types.
DROP FUNCTION IF EXISTS public.create_order_with_items(uuid,uuid,text,text,text,text,numeric,numeric,numeric,date,text,order_item_type[],order_addon_type[]);

-- Drop the custom types if they already exist. Now this will succeed.
DROP TYPE IF EXISTS public.order_item_type;
DROP TYPE IF EXISTS public.order_addon_type;

CREATE TYPE order_item_type AS (
  service_type VARCHAR(100),
  service_name VARCHAR(255),
  description TEXT,
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  service_config JSONB
);

CREATE TYPE order_addon_type AS (
  addon_type VARCHAR(100),
  addon_name VARCHAR(255),
  price DECIMAL(10,2)
);

CREATE OR REPLACE FUNCTION public.create_order_with_items(
    p_advertiser_id uuid,
    p_website_id uuid,
    p_title text,
    p_description text,
    p_requirements text,
    p_content_brief text,
    p_subtotal decimal,
    p_addon_total decimal,
    p_total_amount decimal,
    p_requested_completion_date date,
    p_status text,
    p_order_items order_item_type[],
    p_order_addons order_addon_type[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id uuid;
    v_publisher_id uuid;
    item order_item_type;
    addon order_addon_type;
BEGIN
    -- Explicitly fetch the publisher_id from the website
    SELECT user_id INTO v_publisher_id
    FROM public.websites
    WHERE id = p_website_id;

    -- If no publisher is found, raise an error
    IF v_publisher_id IS NULL THEN
        RAISE EXCEPTION 'Could not find a publisher for website_id %', p_website_id;
    END IF;

    -- Insert the main order record
    INSERT INTO public.orders (
        advertiser_id,
        website_id,
        publisher_id,
        title,
        description,
        requirements,
        content_brief,
        subtotal,
        addon_total,
        total_amount,
        requested_completion_date,
        status
    ) VALUES (
        p_advertiser_id,
        p_website_id,
        v_publisher_id,
        p_title,
        p_description,
        p_requirements,
        p_content_brief,
        p_subtotal,
        p_addon_total,
        p_total_amount,
        p_requested_completion_date,
        p_status
    ) RETURNING id INTO v_order_id;

    -- Insert order items
    IF array_length(p_order_items, 1) > 0 THEN
        FOREACH item IN ARRAY p_order_items
        LOOP
            INSERT INTO public.order_items (
                order_id,
                service_type,
                service_name,
                description,
                quantity,
                unit_price,
                total_price,
                service_config
            ) VALUES (
                v_order_id,
                item.service_type,
                item.service_name,
                item.description,
                item.quantity,
                item.unit_price,
                item.total_price,
                item.service_config
            );
        END LOOP;
    END IF;

    -- Insert order addons
    IF array_length(p_order_addons, 1) > 0 THEN
        FOREACH addon IN ARRAY p_order_addons
        LOOP
            INSERT INTO public.order_addons (
                order_id,
                addon_type,
                addon_name,
                price
            ) VALUES (
                v_order_id,
                addon.addon_type,
                addon.addon_name,
                addon.price
            );
        END LOOP;
    END IF;

    RETURN v_order_id;
END;
$$;
