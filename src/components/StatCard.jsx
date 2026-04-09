export default function StatCard({ icon: Icon, label, value, subtitle, variant = "default", delay = 0 }) {
  const variants = {
    default: "bg-card border border-border",
    gold: "gradient-gold text-accent-foreground",
    navy: "gradient-navy text-primary-foreground",
  };

  const iconVariants = {
    default: "bg-primary/10 text-primary",
    gold: "bg-accent-foreground/10 text-accent-foreground",
    navy: "bg-gold/20 text-gold",
  };

  return (
    <div
      className={`rounded-xl p-5 md:p-6 shadow-elegant animate-fade-in ${variants[variant]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${iconVariants[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className={`text-2xl md:text-3xl font-bold font-display ${variant === "default" ? "text-foreground" : ""}`}>
        {value}
      </p>
      <p className={`text-sm font-medium mt-1 ${variant === "default" ? "text-muted-foreground" : "opacity-80"}`}>
        {label}
      </p>
      {subtitle && (
        <p className={`text-xs mt-1 ${variant === "default" ? "text-muted-foreground/70" : "opacity-60"}`}>{subtitle}</p>
      )}
    </div>
  );
}
