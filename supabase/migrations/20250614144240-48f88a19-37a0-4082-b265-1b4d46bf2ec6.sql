
-- Add initial_stock column to equipment table
ALTER TABLE public.equipment 
ADD COLUMN initial_stock integer DEFAULT 0;

-- Update the comment to reflect the new column
COMMENT ON COLUMN public.equipment.initial_stock IS 'Initial stock balance for this equipment';
