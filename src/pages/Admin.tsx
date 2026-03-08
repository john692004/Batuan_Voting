import { useState } from "react";
import { Settings, Users, Vote, BarChart3, Plus, Trash2, Power, AlertTriangle, UserPlus, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import StatCard from "@/components/StatCard";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("overview");
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Add candidate form state
  const [newCandidate, setNewCandidate] = useState({ name: "", position_id: "", grade_level: "", section: "", party_list: "", motto: "" });

  const { data: positions } = useQuery({ queryKey: ["positions"], queryFn: async () => { const { data } = await supabase.from("positions").select("*").order("display_order"); return data ?? []; } });
  const { data: candidates } = useQuery({ queryKey: ["candidates"], queryFn: async () => { const { data } = await supabase.from("candidates").select("*"); return data ?? []; } });
  const { data: settings } = useQuery({ queryKey: ["election-settings"], queryFn: async () => { const { data } = await supabase.from("election_settings").select("*").limit(1).single(); return data; } });
  const { data: profileCount } = useQuery({ queryKey: ["voter-count"], queryFn: async () => { const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }); return count ?? 0; } });
  const { data: votedCount } = useQuery({ queryKey: ["voted-count"], queryFn: async () => { const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("has_voted", true); return count ?? 0; } });
  const { data: totalVotes } = useQuery({ queryKey: ["total-votes"], queryFn: async () => { const { count } = await supabase.from("votes").select("*", { count: "exact", head: true }); return count ?? 0; } });

  const addCandidate = useMutation({
    mutationFn: async () => {
      if (!newCandidate.name || !newCandidate.position_id || !newCandidate.grade_level || !newCandidate.section || !newCandidate.party_list) throw new Error("All fields required");
      const { error } = await supabase.from("candidates").insert(newCandidate);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Candidate added!" });
      setNewCandidate({ name: "", position_id: "", grade_level: "", section: "", party_list: "", motto: "" });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const deleteCandidate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("candidates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Candidate removed" }); queryClient.invalidateQueries({ queryKey: ["candidates"] }); },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      if (!settings?.id) return;
      const { error } = await supabase.from("election_settings").update({ status }).eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Election status updated" }); queryClient.invalidateQueries({ queryKey: ["election-settings"] }); },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  if (!isAdmin) {
    return (
      <div className="container py-16 text-center animate-fade-in">
        <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Admin Access Required</h1>
        <p className="text-muted-foreground mb-6">You need admin privileges to access this page.</p>
        <button onClick={() => navigate("/")} className="px-6 py-3 rounded-xl gradient-navy text-primary-foreground font-semibold">Back to Dashboard</button>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "candidates", label: "Candidates", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const turnout = profileCount && profileCount > 0 ? ((votedCount ?? 0) / profileCount * 100).toFixed(1) : "0";

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground flex items-center gap-3">
          <Settings className="w-8 h-8 text-gold" /> Admin Panel
        </h1>
        <p className="text-muted-foreground mt-1">Manage election settings, candidates, and monitor results</p>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard icon={Users} label="Registered" value={profileCount?.toLocaleString() ?? "0"} />
            <StatCard icon={Vote} label="Voted" value={votedCount?.toLocaleString() ?? "0"} variant="gold" delay={100} />
            <StatCard icon={BarChart3} label="Turnout" value={`${turnout}%`} delay={200} />
            <StatCard icon={Users} label="Candidates" value={(candidates ?? []).length} variant="navy" delay={300} />
          </div>
        </div>
      )}

      {activeTab === "candidates" && (
        <div className="animate-fade-in space-y-6">
          {/* Add form */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-elegant">
            <h3 className="font-display font-bold text-foreground text-lg mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-gold" /> Add New Candidate</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input type="text" placeholder="Full Name" value={newCandidate.name} onChange={(e) => setNewCandidate(p => ({ ...p, name: e.target.value }))} maxLength={100}
                className="px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
              <select value={newCandidate.position_id} onChange={(e) => setNewCandidate(p => ({ ...p, position_id: e.target.value }))}
                className="px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select Position</option>
                {(positions ?? []).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <input type="text" placeholder="Grade Level" value={newCandidate.grade_level} onChange={(e) => setNewCandidate(p => ({ ...p, grade_level: e.target.value }))} maxLength={50}
                className="px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
              <input type="text" placeholder="Section" value={newCandidate.section} onChange={(e) => setNewCandidate(p => ({ ...p, section: e.target.value }))} maxLength={50}
                className="px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
              <input type="text" placeholder="Party List" value={newCandidate.party_list} onChange={(e) => setNewCandidate(p => ({ ...p, party_list: e.target.value }))} maxLength={100}
                className="px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
              <input type="text" placeholder="Motto (optional)" value={newCandidate.motto} onChange={(e) => setNewCandidate(p => ({ ...p, motto: e.target.value }))} maxLength={200}
                className="px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
            </div>
            <button onClick={() => addCandidate.mutate()} disabled={addCandidate.isPending}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-gold text-accent-foreground font-medium text-sm shadow-gold hover:opacity-90 transition-opacity disabled:opacity-50">
              <UserPlus className="w-4 h-4" /> Add Candidate
            </button>
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-elegant">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-semibold text-foreground">Name</th>
                    <th className="text-left p-4 font-semibold text-foreground">Position</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Party</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden md:table-cell">Grade</th>
                    <th className="text-right p-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(candidates ?? []).map((c) => {
                    const pos = (positions ?? []).find((p) => p.id === c.position_id);
                    return (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium text-foreground">{c.name}</td>
                        <td className="p-4 text-muted-foreground">{pos?.title}</td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell">{c.party_list}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{c.grade_level}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => deleteCandidate.mutate(c.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {(candidates ?? []).length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No candidates yet. Add one above.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="max-w-2xl space-y-6 animate-fade-in">
          <div className="bg-card rounded-xl border border-border p-6 shadow-elegant">
            <h3 className="font-display font-bold text-foreground text-lg mb-4">Election Control</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Current status: <span className="font-semibold text-foreground capitalize">{settings?.status ?? "unknown"}</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => updateStatus.mutate("upcoming")} disabled={settings?.status === "upcoming"}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted text-foreground font-medium text-sm disabled:opacity-40">
                Set Upcoming
              </button>
              <button onClick={() => updateStatus.mutate("ongoing")} disabled={settings?.status === "ongoing"}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-gold text-accent-foreground font-medium text-sm shadow-gold disabled:opacity-40">
                <Power className="w-4 h-4" /> Start Election
              </button>
              <button onClick={() => updateStatus.mutate("completed")} disabled={settings?.status === "completed"}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium text-sm disabled:opacity-40">
                <Power className="w-4 h-4" /> End Election
              </button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-elegant">
            <h3 className="font-display font-bold text-foreground text-lg mb-4">Election Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium text-foreground">{settings?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">School Year</span>
                <span className="font-medium text-foreground">{settings?.school_year}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Election Date</span>
                <span className="font-medium text-foreground">{settings?.election_date}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Voting Hours</span>
                <span className="font-medium text-foreground">{settings?.voting_start} - {settings?.voting_end}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
