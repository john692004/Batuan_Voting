import { useState } from "react";
import { Vote, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import CandidateCard from "@/components/CandidateCard";
import { useNavigate } from "react-router-dom";

export default function VotePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: () => api.get('/positions'),
  });

  const { data: candidates } = useQuery({
    queryKey: ["candidates"],
    queryFn: () => api.get('/candidates'),
  });

  const submitVotes = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const votes = Object.entries(selections)
        .filter(([, candidateId]) => candidateId)
        .map(([positionId, candidateId]) => ({
          candidate_id: candidateId,
          position_id: positionId,
        }));

      if (votes.length === 0) throw new Error("No votes selected");

      await api.post('/votes', { votes });
    },
    onSuccess: () => {
      setSubmitted(true);
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["vote-counts"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "Vote submitted!", description: "Your vote has been recorded securely." });
    },
    onError: (err) => {
      const msg = err.message?.includes("duplicate") ? "You have already voted for this position." : err.message;
      toast({ title: "Vote failed", description: msg, variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="container py-16 text-center animate-fade-in">
        <ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Authentication Required</h1>
        <p className="text-muted-foreground mb-6">Please sign in to cast your vote.</p>
        <button onClick={() => navigate("/auth")} className="px-6 py-3 rounded-xl gradient-gold text-accent-foreground font-semibold shadow-gold">Sign In</button>
      </div>
    );
  }

  if (profile?.has_voted) {
    return (
      <div className="container py-16 text-center animate-fade-in">
        <CheckCircle2 className="w-16 h-16 text-gold mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">You've Already Voted</h1>
        <p className="text-muted-foreground mb-6">Thank you for participating! You can view the results below.</p>
        <button onClick={() => navigate("/results")} className="px-6 py-3 rounded-xl gradient-navy text-primary-foreground font-semibold">View Results</button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container py-16 md:py-24">
        <div className="max-w-lg mx-auto text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full gradient-gold flex items-center justify-center mx-auto mb-6 shadow-gold">
            <CheckCircle2 className="w-10 h-10 text-accent-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">Vote Submitted!</h1>
          <p className="text-muted-foreground mb-2">Thank you for participating in the SSLG Election 2026.</p>
          <div className="mt-8 p-4 bg-card rounded-xl border border-border">
            <p className="text-sm font-medium text-foreground mb-3">Your Selections:</p>
            {Object.entries(selections).filter(([, v]) => v).map(([posId, candId]) => {
              const pos = (positions ?? []).find((p) => p.id === posId);
              const cand = (candidates ?? []).find((c) => c.id === candId);
              return (
                <div key={posId} className="flex justify-between py-1.5 text-sm border-b border-border last:border-0">
                  <span className="text-muted-foreground">{pos?.title}</span>
                  <span className="font-medium text-foreground">{cand?.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentPosition = (positions ?? [])[currentStep];
  const positionCandidates = (candidates ?? []).filter((c) => c.position_id === currentPosition?.id);

  const handleSelect = (candidateId) => {
    if (!currentPosition) return;
    setSelections((prev) => ({
      ...prev,
      [currentPosition.id]: prev[currentPosition.id] === candidateId ? "" : candidateId,
    }));
  };

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground flex items-center gap-3">
            <Vote className="w-8 h-8 text-gold" />
            Cast Your Vote
          </h1>
          <p className="text-muted-foreground mt-1">Select your preferred candidate for each position</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Position {currentStep + 1} of {(positions ?? []).length}</span>
            <span className="font-medium text-foreground">{Object.values(selections).filter(Boolean).length} selected</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full gradient-gold rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / Math.max((positions ?? []).length, 1)) * 100}%` }} />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 mb-6 shadow-elegant">
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">{currentPosition?.title}</h2>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            Select one candidate
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {positionCandidates.map((c, i) => (
            <CandidateCard key={c.id} candidate={c} positionTitle={currentPosition?.title} selectable selected={selections[currentPosition?.id ?? ""] === c.id} onSelect={handleSelect} delay={i * 80} />
          ))}
          {positionCandidates.length === 0 && (
            <div className="col-span-full text-center py-12"><p className="text-muted-foreground">No candidates for this position</p></div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentStep((s) => Math.max(0, s - 1))} disabled={currentStep === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {currentStep < (positions ?? []).length - 1 ? (
            <button onClick={() => setCurrentStep((s) => s + 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-navy text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => submitVotes.mutate()} disabled={submitVotes.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-gold text-accent-foreground font-semibold text-sm shadow-gold hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitVotes.isPending ? <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Submit Vote
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          {(positions ?? []).map((p, i) => (
            <button key={p.id} onClick={() => setCurrentStep(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentStep ? "w-6 gradient-gold" : selections[p.id] ? "bg-gold" : "bg-border"}`}
              title={p.title} />
          ))}
        </div>
      </div>
    </div>
  );
}
