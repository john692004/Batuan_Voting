import { useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import { useElection } from "@/contexts/ElectionContext";
import CandidateCard from "@/components/CandidateCard";

export default function Candidates() {
  const [search, setSearch] = useState("");
  const [activePosition, setActivePosition] = useState("all");
  const { electionType, currentSection } = useElection();

  const isClassroom = electionType === 'classroom';
  const queryParams = isClassroom && currentSection
    ? `?type=classroom&section=${encodeURIComponent(currentSection)}`
    : '?type=sslg';

  const { data: positions } = useQuery({
    queryKey: ["positions", electionType, currentSection],
    queryFn: () => api.get(`/positions${queryParams}`),
  });

  const { data: candidates } = useQuery({
    queryKey: ["candidates", electionType, currentSection],
    queryFn: () => api.get(`/candidates${queryParams}`),
  });

  const filtered = (candidates ?? []).filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.party_list.toLowerCase().includes(search.toLowerCase());
    const matchesPosition = activePosition === "all" || c.position_id === activePosition;
    return matchesSearch && matchesPosition;
  });

  const pageTitle = isClassroom
    ? `Candidates — ${currentSection || 'Classroom'}`
    : 'Candidates';
  const pageDesc = isClassroom
    ? `Meet the candidates running for classroom officer positions${currentSection ? ` in ${currentSection}` : ''}`
    : 'Meet the candidates running for SSLG positions';

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">{pageTitle}</h1>
        <p className="text-muted-foreground mt-1">{pageDesc}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search candidates..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActivePosition("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activePosition === "all" ? "gradient-navy text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            All
          </button>
          {(positions ?? []).map((p) => (
            <button key={p.id} onClick={() => setActivePosition(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activePosition === p.id ? "gradient-navy text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
              {p.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filtered.map((candidate, i) => {
          const pos = (positions ?? []).find((p) => p.id === candidate.position_id);
          return <CandidateCard key={candidate.id} candidate={candidate} positionTitle={pos?.title} delay={i * 60} />;
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <p className="text-muted-foreground text-lg">No candidates found</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
