import { Link } from "react-router-dom";
import { Users, Vote, BarChart3, Calendar, TrendingUp, CheckCircle, LogIn } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import StatCard from "@/components/StatCard";
import schoolSeal from "@/assets/school-seal.jpg";

export default function Index() {
  const { user } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ["election-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("election_settings").select("*").limit(1).single();
      return data;
    },
  });

  const { data: voteCounts } = useQuery({
    queryKey: ["vote-counts-home"],
    queryFn: async () => {
      const { data } = await supabase.from("vote_counts").select("*").order("display_order").order("vote_count", { ascending: false });
      return data ?? [];
    },
  });

  const { data: profileCount } = useQuery({
    queryKey: ["voter-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: totalVotes } = useQuery({
    queryKey: ["total-votes"],
    queryFn: async () => {
      const { count } = await supabase.from("votes").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: positionCount } = useQuery({
    queryKey: ["position-count"],
    queryFn: async () => {
      const { count } = await supabase.from("positions").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: votedCount } = useQuery({
    queryKey: ["voted-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("has_voted", true);
      return count ?? 0;
    },
  });

  const turnout = profileCount && profileCount > 0 ? ((votedCount ?? 0) / profileCount * 100).toFixed(1) : "0";

  const topCandidates = [...(voteCounts ?? [])].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0)).slice(0, 5);

  const statusColors: Record<string, string> = {
    upcoming: "bg-muted text-muted-foreground",
    ongoing: "bg-success/15 text-success",
    completed: "bg-primary/10 text-primary",
  };

  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, hsl(45 80% 55%) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="container relative">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <img src={schoolSeal} alt="Batuan National High School Seal" className="w-24 h-24 md:w-32 md:h-32 mb-6 animate-scale-in rounded-full ring-4 ring-gold/20 object-cover" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-primary-foreground leading-tight animate-fade-in">
              SSLG Election
              <span className="block text-gradient-gold mt-1">2026</span>
            </h1>
            <p className="text-primary-foreground/70 text-base md:text-lg mt-4 max-w-xl animate-fade-in" style={{ animationDelay: "150ms" }}>
              Batuan National High School — Supreme Student Learner Government Election System
            </p>
            <p className="text-primary-foreground/50 text-sm mt-1 animate-fade-in" style={{ animationDelay: "200ms" }}>Batuan, Bohol, Philippines</p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-8 animate-fade-in" style={{ animationDelay: "300ms" }}>
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${statusColors[settings?.status ?? "upcoming"]}`}>
                ● Election {settings?.status === "ongoing" ? "In Progress" : settings?.status === "completed" ? "Completed" : "Upcoming"}
              </span>
              <span className="flex items-center gap-1.5 text-primary-foreground/60 text-sm">
                <Calendar className="w-4 h-4" />
                {settings?.election_date ? new Date(settings.election_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "TBA"}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mt-8 animate-fade-in" style={{ animationDelay: "400ms" }}>
              {user ? (
                <Link to="/vote" className="px-8 py-3 rounded-xl gradient-gold text-accent-foreground font-semibold shadow-gold hover:opacity-90 transition-opacity">Cast Your Vote</Link>
              ) : (
                <Link to="/auth" className="px-8 py-3 rounded-xl gradient-gold text-accent-foreground font-semibold shadow-gold hover:opacity-90 transition-opacity flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In to Vote
                </Link>
              )}
              <Link to="/candidates" className="px-8 py-3 rounded-xl bg-primary-foreground/10 text-primary-foreground font-semibold hover:bg-primary-foreground/15 transition-colors border border-primary-foreground/10">View Candidates</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container -mt-8 md:-mt-12 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard icon={Users} label="Registered Voters" value={profileCount?.toLocaleString() ?? "0"} delay={0} />
          <StatCard icon={Vote} label="Voters Voted" value={votedCount?.toLocaleString() ?? "0"} variant="gold" delay={100} />
          <StatCard icon={TrendingUp} label="Voter Turnout" value={`${turnout}%`} delay={200} />
          <StatCard icon={CheckCircle} label="Positions" value={positionCount ?? 0} variant="navy" delay={300} />
        </div>
      </section>

      {/* Top Candidates + Quick Actions */}
      <section className="container py-12 md:py-16">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">Leading Candidates</h2>
            <div className="space-y-3">
              {topCandidates.length === 0 && <p className="text-muted-foreground text-sm">No votes cast yet.</p>}
              {topCandidates.map((c, i) => (
                <div key={c.candidate_id} className="flex items-center gap-4 bg-card rounded-xl border border-border p-4 shadow-elegant animate-slide-in-right" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? "gradient-gold text-accent-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{c.candidate_name}</p>
                    <p className="text-xs text-muted-foreground">{c.position_title} · {c.party_list}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-foreground">{c.vote_count}</p>
                    <p className="text-xs text-muted-foreground">votes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { to: user ? "/vote" : "/auth", icon: Vote, label: "Cast Your Vote", desc: "Select your preferred candidates", variant: "gold" as const },
                { to: "/candidates", icon: Users, label: "View Candidates", desc: "Know your candidates better", variant: "default" as const },
                { to: "/results", icon: BarChart3, label: "Live Results", desc: "See real-time election updates", variant: "default" as const },
              ].map((action, i) => (
                <Link key={action.to + i} to={action.to}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-elegant animate-fade-in ${
                    action.variant === "gold" ? "gradient-gold text-accent-foreground border-transparent shadow-gold" : "bg-card border-border text-foreground"
                  }`} style={{ animationDelay: `${i * 100}ms` }}>
                  <action.icon className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-semibold">{action.label}</p>
                    <p className={`text-xs ${action.variant === "gold" ? "opacity-70" : "text-muted-foreground"}`}>{action.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
