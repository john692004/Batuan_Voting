import { User, CheckCircle2 } from "lucide-react";
import type { Candidate } from "@/lib/mock-data";
import { positions } from "@/lib/mock-data";

interface CandidateCardProps {
  candidate: Candidate;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  showVotes?: boolean;
  rank?: number;
  delay?: number;
}

export default function CandidateCard({
  candidate,
  selectable = false,
  selected = false,
  onSelect,
  showVotes = false,
  rank,
  delay = 0,
}: CandidateCardProps) {
  const position = positions.find((p) => p.id === candidate.position);

  const partyColors: Record<string, string> = {
    Pagbabago: "bg-primary/10 text-primary border-primary/20",
    "Bagong Pag-asa": "bg-success/10 text-success border-success/20",
    Kabataan: "bg-accent/10 text-accent-foreground border-accent/20",
  };

  return (
    <div
      onClick={() => selectable && onSelect?.(candidate.id)}
      className={`group relative bg-card rounded-xl border overflow-hidden transition-all duration-300 animate-fade-in ${
        selectable ? "cursor-pointer hover:shadow-elegant hover:-translate-y-1" : "shadow-elegant"
      } ${selected ? "ring-2 ring-gold border-gold shadow-gold" : "border-border"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {rank && (
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full gradient-gold flex items-center justify-center">
          <span className="text-xs font-bold text-accent-foreground">#{rank}</span>
        </div>
      )}

      {selected && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className="w-6 h-6 text-gold fill-gold/20" />
        </div>
      )}

      <div className="p-5">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full gradient-navy flex items-center justify-center mx-auto mb-4 ring-2 ring-border">
          <User className="w-8 h-8 text-gold" />
        </div>

        {/* Info */}
        <div className="text-center">
          <h3 className="font-display font-bold text-foreground text-lg">{candidate.name}</h3>
          <p className="text-sm font-semibold text-gold mt-0.5">{position?.title}</p>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>{candidate.gradeLevel}</span>
            <span>·</span>
            <span>{candidate.section}</span>
          </div>
          <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-medium border ${partyColors[candidate.partyList] || "bg-muted text-muted-foreground"}`}>
            {candidate.partyList}
          </span>
          <p className="text-xs text-muted-foreground italic mt-3 leading-relaxed">"{candidate.motto}"</p>
        </div>

        {showVotes && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Total Votes</span>
              <span className="font-bold text-foreground font-display text-lg">{candidate.votes}</span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full gradient-gold rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((candidate.votes / 350) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
