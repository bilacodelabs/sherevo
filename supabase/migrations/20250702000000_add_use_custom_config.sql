/*
  # Add use_custom_config column to user_configurations table
  This column allows users to toggle between admin configuration and their own custom configuration
*/

-- Add the use_custom_config column with a default value of false (admin config by default)
ALTER TABLE user_configurations 
ADD COLUMN use_custom_config BOOLEAN DEFAULT false NOT NULL;

-- Add a comment to document the column purpose
COMMENT ON COLUMN user_configurations.use_custom_config IS 'When true, user uses their own configuration. When false, uses admin configuration.'; 