-- ================================================
-- SIMPLIFY ORDER WORKFLOW TO 3 STEPS
-- ================================================

-- Update the default workflow for existing websites
UPDATE websites
SET order_workflow_steps = '[
  {
    "step": 1, 
    "name": "Review & Accept", 
    "description": "Publisher reviews and accepts or rejects the order", 
    "assignee": "publisher", 
    "auto_complete": false
  },
  {
    "step": 2, 
    "name": "Complete Work", 
    "description": "Publisher completes the work and submits the live URL", 
    "assignee": "publisher", 
    "auto_complete": false
  },
  {
    "step": 3, 
    "name": "Final Approval", 
    "description": "Advertiser reviews the published content and approves", 
    "assignee": "advertiser", 
    "auto_complete": false
  }
]'::jsonb;

-- Update the default for new websites
ALTER TABLE websites 
ALTER COLUMN order_workflow_steps 
SET DEFAULT '[
  {
    "step": 1, 
    "name": "Review & Accept", 
    "description": "Publisher reviews and accepts or rejects the order", 
    "assignee": "publisher", 
    "auto_complete": false
  },
  {
    "step": 2, 
    "name": "Complete Work", 
    "description": "Publisher completes the work and submits the live URL", 
    "assignee": "publisher", 
    "auto_complete": false
  },
  {
    "step": 3, 
    "name": "Final Approval", 
    "description": "Advertiser reviews the published content and approves", 
    "assignee": "advertiser", 
    "auto_complete": false
  }
]'::jsonb;

-- Add a published_url column to orders table to track the live URL
ALTER TABLE orders ADD COLUMN IF NOT EXISTS published_url VARCHAR(500);

-- Add an approval_notes column for advertiser feedback
ALTER TABLE orders ADD COLUMN IF NOT EXISTS approval_notes TEXT;

COMMENT ON COLUMN orders.published_url IS 'The live URL where the content was published';
COMMENT ON COLUMN orders.approval_notes IS 'Notes from advertiser when approving/requesting changes';
