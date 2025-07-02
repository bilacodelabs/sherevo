-- Fix activity_items table constraint to allow all activity types
ALTER TABLE activity_items DROP CONSTRAINT IF EXISTS activity_items_type_check;

ALTER TABLE activity_items ADD CONSTRAINT activity_items_type_check 
CHECK (type IN (
  'event_created', 
  'event_updated', 
  'event_deleted',
  'invitation_sent', 
  'rsvp_received', 
  'guest_added',
  'guest_updated',
  'guest_removed',
  'card_design_created',
  'card_design_updated',
  'card_design_deleted',
  'default_card_set',
  'configuration_updated',
  'template_assigned'
)); 