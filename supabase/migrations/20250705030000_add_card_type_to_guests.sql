-- Add card type and card count fields to guests table
-- card_type: Single (default), Double, or Multiple
-- card_count: Number of cards for this guest (1 for Single, 2 for Double, or custom for Multiple)

ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS card_type text DEFAULT 'single' CHECK (card_type IN ('single', 'double', 'multiple')),
ADD COLUMN IF NOT EXISTS card_count integer DEFAULT 1 CHECK (card_count > 0);

-- Set default card_count based on existing data or add a comment
COMMENT ON COLUMN guests.card_type IS 'Type of card: single (1 card), double (2 cards), or multiple (custom count)';
COMMENT ON COLUMN guests.card_count IS 'Number of cards for this guest. Auto-set based on card_type';

