import { useState, useEffect } from "react";
import { Save, Clock } from "lucide-react";

export default function ElectionScheduleForm({ settings, onSave, isSaving }) {
  const [form, setForm] = useState({
    name: "",
    election_date: "",
    voting_start: "",
    voting_end: "",
  });

  // Populate form whenever settings change
  useEffect(() => {
    if (!settings) return;
    const rawDate = settings.election_date;
    const dateStr = rawDate instanceof Date
      ? rawDate.toISOString().slice(0, 10)
      : String(rawDate).slice(0, 10);

    setForm({
      name: settings.name || "",
      election_date: dateStr,
      voting_start: settings.voting_start?.slice(0, 5) || "",
      voting_end: settings.voting_end?.slice(0, 5) || "",
    });
  }, [settings]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.election_date || !form.voting_start || !form.voting_end) return;
    onSave({
      name: form.name,
      election_date: form.election_date,
      voting_start: form.voting_start + ":00",
      voting_end: form.voting_end + ":00",
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Election Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
          maxLength={100}
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Election Date</label>
        <input
          type="date"
          value={form.election_date}
          onChange={(e) => setForm(p => ({ ...p, election_date: e.target.value }))}
          required
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Voting Opens</label>
          <input
            type="time"
            value={form.voting_start}
            onChange={(e) => setForm(p => ({ ...p, voting_start: e.target.value }))}
            required
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gold" />
            Auto-End At
          </label>
          <input
            type="time"
            value={form.voting_end}
            onChange={(e) => setForm(p => ({ ...p, voting_end: e.target.value }))}
            required
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-gold/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring ring-gold/20"
          />
        </div>
      </div>

      {form.election_date && form.voting_end && (
        <p className="text-xs text-gold bg-gold/10 border border-gold/20 rounded-xl px-4 py-2.5">
          ⏰ This election will automatically end on <strong>{form.election_date}</strong> at <strong>{form.voting_end}</strong>.
        </p>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-gold text-accent-foreground font-medium text-sm shadow-gold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSaving
          ? <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
          : <Save className="w-4 h-4" />}
        Save Schedule
      </button>
    </form>
  );
}
