
-- Fix: recreate the view with SECURITY INVOKER (default, safe)
DROP VIEW IF EXISTS public.vote_counts;
CREATE VIEW public.vote_counts WITH (security_invoker = true) AS
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
