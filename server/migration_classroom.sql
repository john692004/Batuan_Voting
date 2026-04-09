-- Classroom Officers Election Migration
-- Run this on an existing batuan_voting database to add classroom election support.
-- All existing data is preserved and tagged as 'sslg'.

USE batuan_voting;

-- ─── 1. positions: add election_type and section ──────────────────
ALTER TABLE positions
  ADD COLUMN election_type ENUM('sslg', 'classroom') NOT NULL DEFAULT 'sslg' AFTER display_order,
  ADD COLUMN section VARCHAR(50) DEFAULT NULL AFTER election_type;

-- ─── 2. candidates: add election_type ──────────────────────────────
ALTER TABLE candidates
  ADD COLUMN election_type ENUM('sslg', 'classroom') NOT NULL DEFAULT 'sslg' AFTER avatar_url;

-- ─── 3. votes: add election_type and fix unique constraint ─────────
ALTER TABLE votes
  ADD COLUMN election_type ENUM('sslg', 'classroom') NOT NULL DEFAULT 'sslg' AFTER position_id;

-- Create new unique key first (so FK has an index to use), then drop old
ALTER TABLE votes ADD UNIQUE KEY uq_voter_position_type (voter_id, position_id, election_type);
ALTER TABLE votes DROP INDEX uq_voter_position;

-- ─── 4. profiles: split has_voted into two flags ───────────────────
ALTER TABLE profiles
  ADD COLUMN has_voted_sslg BOOLEAN NOT NULL DEFAULT FALSE AFTER section,
  ADD COLUMN has_voted_classroom BOOLEAN NOT NULL DEFAULT FALSE AFTER has_voted_sslg;

-- Migrate existing voted status to SSLG flag
UPDATE profiles SET has_voted_sslg = has_voted;

ALTER TABLE profiles DROP COLUMN has_voted;

-- ─── 5. election_settings: add election_type and section ───────────
ALTER TABLE election_settings
  ADD COLUMN election_type ENUM('sslg', 'classroom') NOT NULL DEFAULT 'sslg' AFTER status,
  ADD COLUMN section VARCHAR(50) DEFAULT NULL AFTER election_type;

-- ─── 6. Recreate vote_counts view with election_type ───────────────
CREATE OR REPLACE VIEW vote_counts AS
  SELECT
    c.id AS candidate_id,
    c.name AS candidate_name,
    c.position_id,
    c.party_list,
    c.grade_level,
    c.section,
    c.motto,
    c.election_type,
    p.title AS position_title,
    p.display_order,
    COUNT(v.id) AS vote_count
  FROM candidates c
  JOIN positions p ON c.position_id = p.id
  LEFT JOIN votes v ON v.candidate_id = c.id
  GROUP BY c.id, c.name, c.position_id, c.party_list, c.grade_level,
           c.section, c.motto, c.election_type, p.title, p.display_order;
