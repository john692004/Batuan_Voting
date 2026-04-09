-- =====================================================
-- Multi-Vote Migration — Batuan Voting System
-- Allows voters to select up to 2 P.I.O. and 2 Peace Officers
-- Restricts Grade Representatives by voter grade level
-- Run ONCE on an existing batuan_voting database.
-- =====================================================
USE batuan_voting;

-- ─── 1. Fix votes unique constraint ─────────────────────────────────────────
-- Old: (voter_id, position_id, election_type) — blocks all multi-votes per position
-- New: (voter_id, candidate_id, election_type) — prevents duplicate candidate only

ALTER TABLE votes DROP INDEX uq_voter_position_type;
ALTER TABLE votes ADD UNIQUE KEY uq_voter_candidate_type (voter_id, candidate_id, election_type);

-- ─── 2. Set max_votes = 2 for SSLG P.I.O. and Peace Officer ─────────────────
UPDATE positions
SET max_votes = 2
WHERE election_type = 'sslg'
  AND title IN ('Public Information Officer', 'P.I.O.', 'Peace Officer');

-- ─── 3. Set max_votes = 2 for ALL Classroom P.I.O. and Peace Officer ─────────
UPDATE positions
SET max_votes = 2
WHERE election_type = 'classroom'
  AND title IN ('P.I.O.', 'Public Information Officer', 'Peace Officer');

-- ─── 4. Split old generic 'Grade Representative' into per-grade positions ────
-- Only runs if the old generic 'Grade Representative' row still exists.
-- If your DB already has 'Grade 7 Representative', 'Grade 8 Representative' etc.
-- this block will skip gracefully (no matching rows found by the WHERE clause).

SET @old_rep_order = (
  SELECT display_order FROM positions
  WHERE election_type = 'sslg' AND title = 'Grade Representative'
  LIMIT 1
);

-- Delete the old generic row
DELETE FROM positions
WHERE election_type = 'sslg' AND title = 'Grade Representative';

-- Insert per-grade rows only when display_order was found (i.e. old row existed)
INSERT INTO positions (id, title, display_order, max_votes, election_type)
SELECT UUID(), 'Grade 7 Representative',  COALESCE(@old_rep_order, 8),     1, 'sslg'
WHERE @old_rep_order IS NOT NULL;

INSERT INTO positions (id, title, display_order, max_votes, election_type)
SELECT UUID(), 'Grade 8 Representative',  COALESCE(@old_rep_order, 8) + 1, 1, 'sslg'
WHERE @old_rep_order IS NOT NULL;

INSERT INTO positions (id, title, display_order, max_votes, election_type)
SELECT UUID(), 'Grade 9 Representative',  COALESCE(@old_rep_order, 8) + 2, 1, 'sslg'
WHERE @old_rep_order IS NOT NULL;

INSERT INTO positions (id, title, display_order, max_votes, election_type)
SELECT UUID(), 'Grade 10 Representative', COALESCE(@old_rep_order, 8) + 3, 1, 'sslg'
WHERE @old_rep_order IS NOT NULL;

INSERT INTO positions (id, title, display_order, max_votes, election_type)
SELECT UUID(), 'Grade 11 Representative', COALESCE(@old_rep_order, 8) + 4, 1, 'sslg'
WHERE @old_rep_order IS NOT NULL;

INSERT INTO positions (id, title, display_order, max_votes, election_type)
SELECT UUID(), 'Grade 12 Representative', COALESCE(@old_rep_order, 8) + 5, 1, 'sslg'
WHERE @old_rep_order IS NOT NULL;

-- ─── 5. Verify results ────────────────────────────────────────────────────────
SELECT title, election_type, section, max_votes
FROM positions
WHERE max_votes > 1 OR title LIKE '%Representative%'
ORDER BY election_type, display_order;

