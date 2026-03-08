import { useState } from "react";
import { Settings, Users, Vote, BarChart3, Plus, Trash2, Power, AlertTriangle } from "lucide-react";
import { candidates, positions, electionStats } from "@/lib/mock-data";
import StatCard from "@/components/StatCard";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "candidates", label: "Candidates", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground flex items-center gap-3">
          <Settings className="w-8 h-8 text-gold" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground mt-1">Manage election settings, candidates, and monitor results</p>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20 mb-8 animate-fade-in">
        <AlertTriangle className="w-5 h-5 text-accent-foreground shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground text-sm">Demo Mode</p>
          <p className="text-xs text-muted-foreground">This is a demo interface. Connect a backend to enable full admin functionality.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard icon={Users} label="Voters" value={electionStats.totalVoters.toLocaleString()} />
            <StatCard icon={Vote} label="Votes Cast" value={electionStats.totalVotesCast.toLocaleString()} variant="gold" delay={100} />
            <StatCard icon={BarChart3} label="Turnout" value={`${electionStats.turnoutPercentage}%`} delay={200} />
            <StatCard icon={Users} label="Candidates" value={electionStats.totalCandidates} variant="navy" delay={300} />
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-elegant">
            <h3 className="font-display font-bold text-foreground text-lg mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {["New vote cast for President", "Candidate profile updated", "Election settings modified", "Voter registration approved"].map((activity, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0 text-sm">
                  <div className="w-2 h-2 rounded-full gradient-gold shrink-0" />
                  <span className="text-foreground">{activity}</span>
                  <span className="text-muted-foreground text-xs ml-auto">{i + 1}m ago</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "candidates" && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-foreground text-lg">Manage Candidates</h3>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-gold text-accent-foreground font-medium text-sm shadow-gold hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />
              Add Candidate
            </button>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-elegant">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-semibold text-foreground">Name</th>
                    <th className="text-left p-4 font-semibold text-foreground">Position</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Party</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden md:table-cell">Grade</th>
                    <th className="text-right p-4 font-semibold text-foreground">Votes</th>
                    <th className="text-right p-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => {
                    const pos = positions.find((p) => p.id === c.position);
                    return (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium text-foreground">{c.name}</td>
                        <td className="p-4 text-muted-foreground">{pos?.title}</td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell">{c.partyList}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{c.gradeLevel}</td>
                        <td className="p-4 text-right font-display font-bold text-foreground">{c.votes}</td>
                        <td className="p-4 text-right">
                          <button className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="max-w-2xl space-y-6 animate-fade-in">
          <div className="bg-card rounded-xl border border-border p-6 shadow-elegant">
            <h3 className="font-display font-bold text-foreground text-lg mb-4">Election Settings</h3>
            <div className="space-y-4">
              {[
                { label: "Election Name", value: "SSLG Election 2026" },
                { label: "Election Date", value: "March 15, 2026" },
                { label: "School Year", value: "2025–2026" },
                { label: "Voting Period", value: "8:00 AM – 4:00 PM" },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{field.label}</label>
                  <input
                    type="text"
                    defaultValue={field.value}
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-elegant">
            <h3 className="font-display font-bold text-foreground text-lg mb-4">Election Control</h3>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-gold text-accent-foreground font-medium text-sm shadow-gold">
                <Power className="w-4 h-4" />
                Start Election
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium text-sm">
                <Power className="w-4 h-4" />
                End Election
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
