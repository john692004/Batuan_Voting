import { useState } from "react";
import { BarChart3, Trophy, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";

export default function Results() {
  const [activePosition, setActivePosition] = useState("all");

  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data } = await supabase.from("positions").select("*").order("display_order");
      return data ?? [];
    },
  });

  const { data: voteCounts } = useQuery({
    queryKey: ["vote-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("vote_counts").select("*").order("display_order").order("vote_count", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 10000,
  });

  // Derive total votes from vote_counts view (publicly accessible)
  const totalVotes = (voteCounts ?? []).reduce((sum, vc) => sum + (vc.vote_count ?? 0), 0);

  const { data: votedCount } = useQuery({
    queryKey: ["voted-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("has_voted", true);
      return count ?? 0;
    },
  });

  const { data: profileCount } = useQuery({
    queryKey: ["voter-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const turnout = profileCount && profileCount > 0 ? ((votedCount ?? 0) / profileCount * 100).toFixed(1) : "0";

  const grouped = (positions ?? []).map((pos) => {
    const posCandidates = (voteCounts ?? []).filter((vc) => vc.position_id === pos.id).sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));
    const totalPosVotes = posCandidates.reduce((sum, c) => sum + (c.vote_count ?? 0), 0);
    return { position: pos, candidates: posCandidates, totalVotes: totalPosVotes };
  });

  const filtered = activePosition === "all" ? grouped : grouped.filter((g) => g.position.id === activePosition);

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-gold" />
          Election Results
        </h1>
        <p className="text-muted-foreground mt-1">Live results for SSLG Election 2026</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-8">
        <StatCard icon={TrendingUp} label="Voter Turnout" value={`${turnout}%`} variant="gold" />
        <StatCard icon={BarChart3} label="Voters Voted" value={votedCount?.toLocaleString() ?? "0"} delay={100} />
        <StatCard icon={Trophy} label="Positions" value={(positions ?? []).length} variant="navy" delay={200} />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button onClick={() => setActivePosition("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activePosition === "all" ? "gradient-navy text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
          All Positions
        </button>
        {(positions ?? []).map((p) => (
          <button key={p.id} onClick={() => setActivePosition(p.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activePosition === p.id ? "gradient-navy text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {p.title}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {filtered.map((group, gi) => (
          <div key={group.position.id} className="bg-card rounded-xl border border-border overflow-hidden shadow-elegant animate-fade-in" style={{ animationDelay: `${gi * 100}ms` }}>
            <div className="gradient-navy p-4 md:p-5 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-display font-bold text-primary-foreground text-lg">{group.position.title}</h2>
                <p className="text-xs text-primary-foreground/50">{group.totalVotes} total votes</p>
              </div>
              {group.candidates[0] && (
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-gold" />
                  <span className="text-sm font-semibold text-gold">{group.candidates[0].candidate_name}</span>
                </div>
              )}
            </div>
            <div className="p-4 md:p-5 space-y-4">
              {group.candidates.length === 0 && <p className="text-muted-foreground text-sm">No candidates registered.</p>}
              {group.candidates.map((c, ci) => {
                const pct = group.totalVotes ? (((c.vote_count ?? 0) / group.totalVotes) * 100).toFixed(1) : "0";
                return (
                  <div key={c.candidate_id} className="animate-fade-in" style={{ animationDelay: `${ci * 60}ms` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${ci === 0 ? "gradient-gold text-accent-foreground" : "bg-muted text-muted-foreground"}`}>{ci + 1}</span>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{c.candidate_name}</p>
                          <p className="text-xs text-muted-foreground">{c.party_list}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-display font-bold text-foreground">{c.vote_count}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${ci === 0 ? "gradient-gold" : "bg-navy-light/50"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
