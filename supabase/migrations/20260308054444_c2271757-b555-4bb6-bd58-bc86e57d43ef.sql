
-- Drop restrictive SELECT policies and recreate as permissive for public-facing tables

-- candidates
DROP POLICY IF EXISTS "Candidates viewable by all" ON public.candidates;
CREATE POLICY "Candidates viewable by all" ON public.candidates FOR SELECT USING (true);

-- positions
DROP POLICY IF EXISTS "Positions viewable by all" ON public.positions;
CREATE POLICY "Positions viewable by all" ON public.positions FOR SELECT USING (true);

-- election_settings
DROP POLICY IF EXISTS "Election settings viewable by all" ON public.election_settings;
CREATE POLICY "Election settings viewable by all" ON public.election_settings FOR SELECT USING (true);

-- profiles (for counting voters/stats on dashboard)
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Profiles viewable by all" ON public.profiles FOR SELECT USING (true);
