-- Add message tracking fields to guests table
ALTER TABLE guests ADD COLUMN IF NOT EXISTS sms_message_id text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS whatsapp_message_id text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS sms_status text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS whatsapp_message_status text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS whatsapp_response jsonb;

