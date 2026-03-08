
DROP POLICY IF EXISTS "Profiles viewable by all" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
