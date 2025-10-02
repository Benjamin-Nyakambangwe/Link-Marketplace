-- ================================================
-- ENHANCED WEBSITES TABLE WITH PRICING STRUCTURE
-- ================================================

-- Drop existing websites table and recreate with comprehensive pricing
DROP TABLE IF EXISTS websites CASCADE;

CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  
  -- Website Metrics
  monthly_visitors INTEGER DEFAULT 0,
  domain_authority INTEGER DEFAULT 0,
  average_engagement_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Content & Audience
  primary_niche VARCHAR(100),
  target_audience TEXT,
  content_language VARCHAR(10) DEFAULT 'en',
  geographic_focus VARCHAR(100),
  
  -- Available Services (JSON structure for flexibility)
  available_services JSONB DEFAULT '[]'::jsonb,
  -- Example structure:
  -- [
  --   {
  --     "type": "sponsored_post",
  --     "name": "Sponsored Blog Post",
  --     "description": "Full-length sponsored article",
  --     "base_price": 500,
  --     "pricing_model": "fixed", -- fixed, per_word, per_day, custom
  --     "min_words": 800,
  --     "max_words": 1500,
  --     "turnaround_days": 7,
  --     "revisions_included": 2,
  --     "dofollow_link": true
  --   }
  -- ]
  
  -- Pricing Add-ons
  pricing_addons JSONB DEFAULT '[]'::jsonb,
  -- Example:
  -- [
  --   {"type": "rush_delivery", "name": "Rush Delivery (24h)", "price": 200},
  --   {"type": "extra_revision", "name": "Additional Revision", "price": 100},
  --   {"type": "social_promotion", "name": "Social Media Promotion", "price": 150}
  -- ]
  
  -- Content Restrictions and Guidelines
  content_restrictions JSONB DEFAULT '{}'::jsonb,
  -- Example:
  -- {
  --   "accepted_niches": ["cbd", "casino", "finance"],
  --   "niche_pricing": {"cbd": "100", "casino": "150"},
  --   "link_types": {"dofollow": true, "nofollow": false, "sponsored": true, "ugc": false},
  --   "special_conditions": "Content must be original and well-researched..."
  -- }
  
  -- Business Settings
  minimum_order_value DECIMAL(10,2) DEFAULT 0,
  accepts_guest_posts BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  response_time_hours INTEGER DEFAULT 24,
  
  -- Workflow Configuration
  order_workflow_steps JSONB DEFAULT '[
    {"step": 1, "name": "Order Review", "description": "Publisher reviews order requirements", "assignee": "publisher", "auto_complete": false},
    {"step": 2, "name": "Content Brief", "description": "Detailed content briefing", "assignee": "both", "auto_complete": false},
    {"step": 3, "name": "Content Creation", "description": "Content creation and initial draft", "assignee": "publisher", "auto_complete": false},
    {"step": 4, "name": "Content Review", "description": "Advertiser reviews and approves content", "assignee": "advertiser", "auto_complete": false},
    {"step": 5, "name": "Publication", "description": "Content goes live", "assignee": "publisher", "auto_complete": false},
    {"step": 6, "name": "Completion", "description": "Order completed and payment processed", "assignee": "both", "auto_complete": true}
  ]'::jsonb,
  
  -- Status and Metadata
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ORDERS TABLE
-- ================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  advertiser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  publisher_id UUID NOT NULL, -- Will be populated from website.user_id
  
  -- Order Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements TEXT,
  content_brief TEXT,
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  addon_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Timeline
  requested_completion_date DATE,
  estimated_completion_date DATE,
  actual_completion_date DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'in_progress', 'review', 'revision', 
    'completed', 'cancelled', 'disputed'
  )),
  
  -- Communication
  notes TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ORDER ITEMS TABLE
-- ================================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Service Details
  service_type VARCHAR(100) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Pricing
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Service Configuration
  service_config JSONB DEFAULT '{}'::jsonb,
  -- Stores service-specific data like word count, duration, etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ORDER ADD-ONS TABLE
-- ================================================

CREATE TABLE order_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  addon_type VARCHAR(100) NOT NULL,
  addon_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ORDER STEPS TABLE (Workflow Tracking)
-- ================================================

CREATE TABLE order_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Step Details
  step_number INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  step_description TEXT,
  
  -- Assignment
  assignee VARCHAR(20) NOT NULL CHECK (assignee IN ('advertiser', 'publisher', 'both')),
  
  -- Status & Timeline
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Content
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Completion Settings
  auto_complete BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(order_id, step_number)
);

-- ================================================
-- ORDER MESSAGES TABLE
-- ================================================

CREATE TABLE order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_step_id UUID REFERENCES order_steps(id) ON DELETE SET NULL,
  
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('advertiser', 'publisher')),
  
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- TRIGGERS FOR UPDATED_AT
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_steps_updated_at BEFORE UPDATE ON order_steps
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- INDEXES
-- ================================================

-- Websites indexes
CREATE INDEX idx_websites_user_id ON websites(user_id);
CREATE INDEX idx_websites_status ON websites(status);
CREATE INDEX idx_websites_niche ON websites(primary_niche);

-- Orders indexes
CREATE INDEX idx_orders_website_id ON orders(website_id);
CREATE INDEX idx_orders_advertiser_id ON orders(advertiser_id);
CREATE INDEX idx_orders_publisher_id ON orders(publisher_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Order steps indexes
CREATE INDEX idx_order_steps_order_id ON order_steps(order_id);
CREATE INDEX idx_order_steps_status ON order_steps(status);
CREATE INDEX idx_order_steps_assignee ON order_steps(assignee);

-- Order messages indexes
CREATE INDEX idx_order_messages_order_id ON order_messages(order_id);
CREATE INDEX idx_order_messages_sender_id ON order_messages(sender_id);

-- ================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================

-- Enable RLS
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

-- Websites policies
CREATE POLICY "Users can view all active websites" ON websites
FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage their own websites" ON websites
FOR ALL USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view orders they're involved in" ON orders
FOR SELECT USING (
  auth.uid() = advertiser_id OR 
  auth.uid() = publisher_id
);

CREATE POLICY "Advertisers can create orders" ON orders
FOR INSERT WITH CHECK (auth.uid() = advertiser_id);

CREATE POLICY "Order participants can update orders" ON orders
FOR UPDATE USING (
  auth.uid() = advertiser_id OR 
  auth.uid() = publisher_id
);

-- Order items policies
CREATE POLICY "Users can view order items for their orders" ON order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.advertiser_id = auth.uid() OR orders.publisher_id = auth.uid())
  )
);

CREATE POLICY "Advertisers can manage order items during creation" ON order_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.advertiser_id = auth.uid()
    AND orders.status = 'pending'
  )
);

-- Order addons policies
CREATE POLICY "Users can view order addons for their orders" ON order_addons
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_addons.order_id 
    AND (orders.advertiser_id = auth.uid() OR orders.publisher_id = auth.uid())
  )
);

-- Order steps policies
CREATE POLICY "Users can view order steps for their orders" ON order_steps
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_steps.order_id 
    AND (orders.advertiser_id = auth.uid() OR orders.publisher_id = auth.uid())
  )
);

CREATE POLICY "Order participants can update their assigned steps" ON order_steps
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_steps.order_id 
    AND (
      (order_steps.assignee = 'advertiser' AND orders.advertiser_id = auth.uid()) OR
      (order_steps.assignee = 'publisher' AND orders.publisher_id = auth.uid()) OR
      (order_steps.assignee = 'both' AND (orders.advertiser_id = auth.uid() OR orders.publisher_id = auth.uid()))
    )
  )
);

-- Order messages policies
CREATE POLICY "Users can view messages for their orders" ON order_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_messages.order_id 
    AND (orders.advertiser_id = auth.uid() OR orders.publisher_id = auth.uid())
  )
);

CREATE POLICY "Order participants can send messages" ON order_messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_messages.order_id 
    AND (orders.advertiser_id = auth.uid() OR orders.publisher_id = auth.uid())
  )
);

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Function to populate publisher_id when order is created
CREATE OR REPLACE FUNCTION populate_publisher_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT user_id INTO NEW.publisher_id
  FROM websites
  WHERE id = NEW.website_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_publisher_id
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION populate_publisher_id();

-- Function to create order steps when order is created
CREATE OR REPLACE FUNCTION create_order_steps()
RETURNS TRIGGER AS $$
DECLARE
  step_config JSONB;
  step_item JSONB;
BEGIN
  -- Get workflow steps from website
  SELECT order_workflow_steps INTO step_config
  FROM websites
  WHERE id = NEW.website_id;
  
  -- Create each step
  FOR step_item IN SELECT * FROM jsonb_array_elements(step_config)
  LOOP
    INSERT INTO order_steps (
      order_id,
      step_number,
      step_name,
      step_description,
      assignee,
      auto_complete,
      status
    ) VALUES (
      NEW.id,
      (step_item->>'step')::INTEGER,
      step_item->>'name',
      step_item->>'description',
      step_item->>'assignee',
      COALESCE((step_item->>'auto_complete')::BOOLEAN, false),
      CASE WHEN (step_item->>'step')::INTEGER = 1 THEN 'pending' ELSE 'pending' END
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_order_workflow
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_steps(); 