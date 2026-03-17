-- Add encryption settings to database
ALTER TABLE DashboardConfig ADD COLUMN encryptionEnabled INTEGER DEFAULT 0;
ALTER TABLE DashboardConfig ADD COLUMN encryptionSalt TEXT;
