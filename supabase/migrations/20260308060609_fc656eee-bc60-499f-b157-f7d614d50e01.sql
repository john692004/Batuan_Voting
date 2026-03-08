
-- Allow public read access to votes so the vote_counts view works for anonymous users
CREATE POLICY "Votes viewable by all for results"
  ON public.votes FOR SELECT
  USING (true);
