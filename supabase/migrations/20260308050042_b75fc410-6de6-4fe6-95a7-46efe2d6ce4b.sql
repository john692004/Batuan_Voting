
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'voter');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  student_id TEXT,
  grade_level TEXT,
  section TEXT,
  has_voted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Positions table
CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  max_votes INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Positions viewable by all" ON public.positions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage positions" ON public.positions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Candidates table
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  grade_level TEXT NOT NULL,
  section TEXT NOT NULL,
  party_list TEXT NOT NULL,
  motto TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates viewable by all" ON public.candidates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage candidates" ON public.candidates
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Votes table
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (voter_id, position_id)
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own votes" ON public.votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = voter_id);
CREATE POLICY "Admins can view all votes" ON public.votes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own votes" ON public.votes
  FOR SELECT TO authenticated USING (auth.uid() = voter_id);

-- Election settings table
CREATE TABLE public.election_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'SSLG Election 2026',
  school_year TEXT NOT NULL DEFAULT '2025-2026',
  election_date DATE NOT NULL DEFAULT '2026-03-15',
  voting_start TIME NOT NULL DEFAULT '08:00:00',
  voting_end TIME NOT NULL DEFAULT '16:00:00',
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.election_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Election settings viewable by all" ON public.election_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage election settings" ON public.election_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Vote counts view for results
CREATE OR REPLACE VIEW public.vote_counts AS
  SELECT 
    c.id AS candidate_id,
    c.name AS candidate_name,
    c.position_id,
    c.party_list,
    c.grade_level,
    c.section,
    c.motto,
    p.title AS position_title,
    p.display_order,
    COUNT(v.id)::INT AS vote_count
  FROM public.candidates c
  JOIN public.positions p ON c.position_id = p.id
  LEFT JOIN public.votes v ON v.candidate_id = c.id
  GROUP BY c.id, c.name, c.position_id, c.party_list, c.grade_level, c.section, c.motto, p.title, p.display_order;

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'voter');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_election_settings_updated_at
  BEFORE UPDATE ON public.election_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default election settings
INSERT INTO public.election_settings (name, school_year, election_date, status)
VALUES ('SSLG Election 2026', '2025-2026', '2026-03-15', 'ongoing');

-- Insert positions
INSERT INTO public.positions (title, display_order) VALUES
  ('President', 1),
  ('Vice President', 2),
  ('Secretary', 3),
  ('Treasurer', 4),
  ('Auditor', 5),
  ('Public Information Officer', 6),
  ('Peace Officer', 7),
  ('Grade Representative', 8);
