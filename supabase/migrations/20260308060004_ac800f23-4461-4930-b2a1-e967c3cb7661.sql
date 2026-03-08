
-- Make profiles SELECT policy permissive so anon can see voter turnout stats
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Profiles viewable by all"
  ON public.profiles FOR SELECT
  USING (true);
