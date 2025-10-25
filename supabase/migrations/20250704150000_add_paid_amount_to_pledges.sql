-- Add paid_amount column to pledges table
ALTER TABLE pledges
ADD COLUMN paid_amount numeric DEFAULT 0; 