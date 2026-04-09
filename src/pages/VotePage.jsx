import { useState } from "react";
import { Vote, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useElection } from "@/contexts/ElectionContext";
import { useToast } from "@/hooks/use-toast";
import CandidateCard from "@/components/CandidateCard";
import { useNavigate } from "react-router-dom";

export default function VotePage() {
  const [currentStep, setCurrentStep] = useState(0);
  // selections: { [positionId]: string[] }  (array of selected candidate IDs)
  const [selections, setSelections] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const { user, profile, refreshProfile } = useAuth();
  const { electionType, currentSection } = useElection();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isClassroom = electionType === 'classroom';

  // Build query params — for SSLG pass grade_level for Grade Rep filtering
  const gradeLevel = profile?.grade_level;
  const sslgParams = gradeLevel
    ? `?type=sslg&grade_level=${encodeURIComponent(gradeLevel)}`
    : '?type=sslg';
  const queryParams = isClassroom && currentSection
    ? `?type=classroom&section=${encodeURIComponent(currentSection)}`
    : sslgParams;

  const { data: positions } = useQuery({
    queryKey: ["positions", electionType, currentSection, gradeLevel],
    queryFn: () => api.get(`/positions${queryParams}`),
    enabled: !!user,
  });

  const { data: candidates } = useQuery({
    queryKey: ["candidates", electionType, currentSection],
    queryFn: () => api.get(`/candidates${isClassroom && currentSection
      ? `?type=classroom&section=${encodeURIComponent(currentSection)}`
      : '?type=sslg'}`),
    enabled: !!user,
  });

  const submitVotes = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Build flat vote array: one entry per candidate selected
      const votes = [];
      for (const [positionId, candIds] of Object.entries(selections)) {
        for (const candidateId of (candIds || [])) {
          if (candidateId) votes.push({ candidate_id: candidateId, position_id: positionId });
        }
      }

      if (votes.length === 0) throw new Error("No votes selected");

      await api.post('/votes', { votes, election_type: electionType });
    },
    onSuccess: () => {
      setSubmitted(true);
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["vote-counts"] });
      queryClient.invalidateQueries({ queryKey: ["vote-counts-home"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      const electionLabel = isClassroom ? `Classroom Officers Election — ${currentSection}` : 'SSLG Election 2026';
      toast({ title: "Vote submitted!", description: `Your vote for ${electionLabel} has been recorded securely.` });
    },
    onError: (err) => {
      const msg = err.message?.includes("duplicate") || err.message?.includes("already voted")
        ? "You have already voted for one of the selected candidates."
        : err.message;
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

  // Check if no section for classroom election
  if (isClassroom && !currentSection) {
    return (
      <div className="container py-16 text-center animate-fade-in">
        <AlertCircle className="w-16 h-16 text-gold mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">No Section Assigned</h1>
        <p className="text-muted-foreground mb-6">You need a section assigned to your profile to participate in classroom elections.</p>
        <button onClick={() => navigate("/")} className="px-6 py-3 rounded-xl gradient-navy text-primary-foreground font-semibold">Back to Dashboard</button>
      </div>
    );
  }

  // Check has_voted for the appropriate election type
  const hasVoted = isClassroom ? profile?.has_voted_classroom : profile?.has_voted_sslg;

  if (hasVoted) {
    return (
      <div className="container py-16 text-center animate-fade-in">
        <CheckCircle2 className="w-16 h-16 text-gold mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">You've Already Voted</h1>
        <p className="text-muted-foreground mb-6">
          Thank you for participating in the {isClassroom ? `Classroom Officers Election — ${currentSection}` : 'SSLG Election'}! You can view the results below.
        </p>
        <button onClick={() => navigate("/results")} className="px-6 py-3 rounded-xl gradient-navy text-primary-foreground font-semibold">View Results</button>
      </div>
    );
  }

  if (submitted) {
    const electionLabel = isClassroom ? `Classroom Officers Election — ${currentSection}` : 'SSLG Election 2026';
    return (
      <div className="container py-16 md:py-24">
        <div className="max-w-lg mx-auto text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full gradient-gold flex items-center justify-center mx-auto mb-6 shadow-gold">
            <CheckCircle2 className="w-10 h-10 text-accent-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">Vote Submitted!</h1>
          <p className="text-muted-foreground mb-2">Thank you for participating in the {electionLabel}.</p>
          <div className="mt-8 p-4 bg-card rounded-xl border border-border">
            <p className="text-sm font-medium text-foreground mb-3">Your Selections:</p>
            {Object.entries(selections).flatMap(([posId, candIds]) => {
              const pos = (positions ?? []).find((p) => p.id === posId);
              return (candIds || []).map((candId, idx) => {
                const cand = (candidates ?? []).find((c) => c.id === candId);
                return (
                  <div key={`${posId}-${idx}`} className="flex justify-between py-1.5 text-sm border-b border-border last:border-0">
                    <span className="text-muted-foreground">{pos?.title}{(pos?.max_votes ?? 1) > 1 ? ` (${idx + 1})` : ''}</span>
                    <span className="font-medium text-foreground">{cand?.name}</span>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentPosition = (positions ?? [])[currentStep];
  const maxVotes = currentPosition?.max_votes ?? 1;
  const positionCandidates = (candidates ?? []).filter((c) => c.position_id === currentPosition?.id);
  const currentSelections = selections[currentPosition?.id ?? ""] ?? [];

  const handleSelect = (candidateId) => {
    if (!currentPosition) return;
    const posId = currentPosition.id;
    const max = maxVotes;

    setSelections((prev) => {
      const existing = prev[posId] ?? [];

      if (existing.includes(candidateId)) {
        // Deselect
        return { ...prev, [posId]: existing.filter((id) => id !== candidateId) };
      } else {
        if (existing.length >= max) {
          // At max — don't add more; show a toast hint
          toast({
            title: `Max ${max} selection${max > 1 ? 's' : ''}`,
            description: `You can only choose up to ${max} candidate${max > 1 ? 's' : ''} for ${currentPosition.title}. Deselect one first.`,
            variant: "destructive",
          });
          return prev;
        }
        return { ...prev, [posId]: [...existing, candidateId] };
      }
    });
  };

  const totalSelected = Object.values(selections).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);

  const voteTitle = isClassroom ? `Vote — ${currentSection}` : 'Cast Your Vote';

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground flex items-center gap-3">
            <Vote className="w-8 h-8 text-gold" />
            {voteTitle}
          </h1>
          <p className="text-muted-foreground mt-1">Select your preferred candidate for each position</p>
          {isClassroom && (
            <p className="text-xs text-gold mt-1">Classroom Officers Election — {currentSection}</p>
          )}
          {!isClassroom && gradeLevel && (
            <p className="text-xs text-gold mt-1">Grade Representative shown for your grade: <span className="font-semibold">{gradeLevel}</span></p>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Position {currentStep + 1} of {(positions ?? []).length}</span>
            <span className="font-medium text-foreground">{totalSelected} vote{totalSelected !== 1 ? 's' : ''} selected</span>
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
            {maxVotes > 1
              ? `Select up to ${maxVotes} candidates — ${currentSelections.length} / ${maxVotes} chosen`
              : 'Select one candidate'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {positionCandidates.map((c, i) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              positionTitle={currentPosition?.title}
              selectable
              selected={currentSelections.includes(c.id)}
              onSelect={handleSelect}
              delay={i * 80}
            />
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
          {(positions ?? []).map((p, i) => {
            const sel = selections[p.id] ?? [];
            const maxV = p.max_votes ?? 1;
            const isFull = sel.length >= maxV && sel.length > 0;
            const isPartial = sel.length > 0 && sel.length < maxV;
            return (
              <button key={p.id} onClick={() => setCurrentStep(i)}
                className={`h-2.5 rounded-full transition-all ${i === currentStep ? "w-6 gradient-gold" : isFull ? "w-2.5 bg-gold" : isPartial ? "w-2.5 bg-gold/50" : "w-2.5 bg-border"}`}
                title={p.title} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
