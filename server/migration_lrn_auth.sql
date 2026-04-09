-- Migration: Convert email-based auth to LRN-based auth
-- Run this on your existing batuan_voting database
-- Safe to run — preserves existing data

USE batuan_voting;

-- 1. Add must_change_password flag to users table
ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Rename 'email' column to 'lrn'
ALTER TABLE users CHANGE COLUMN email lrn VARCHAR(255) NOT NULL;

-- 3. Update admin account to use 'admin' as username instead of email
UPDATE users SET lrn = 'admin' WHERE lrn = 'admin@bnhs.edu.ph';

-- Done! Admin now logs in with username 'admin' and password 'admin123'
-- Students will be added by admin with LRN as both username and default password
