import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Users, Vote, BarChart3, Settings, Shield } from "lucide-react";
import schoolSeal from "@/assets/school-seal.png";

const navItems = [
  { label: "Dashboard", path: "/", icon: Home },
  { label: "Candidates", path: "/candidates", icon: Users },
  { label: "Vote", path: "/vote", icon: Vote },
  { label: "Results", path: "/results", icon: BarChart3 },
  { label: "Admin", path: "/admin", icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="gradient-navy sticky top-0 z-50 shadow-elegant">
        <div className="container flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-3">
            <img src={schoolSeal} alt="Batuan NHS Seal" className="h-10 w-10 md:h-12 md:w-12 rounded-full ring-2 ring-gold/30" />
            <div className="hidden sm:block">
              <h1 className="text-sm md:text-base font-display font-bold text-primary-foreground leading-tight">
                Batuan National High School
              </h1>
              <p className="text-xs text-gold font-medium tracking-wide">SSLG Election System</p>
            </div>
            <span className="sm:hidden text-sm font-display font-bold text-primary-foreground">BNHS Votes</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-gold/20 text-gold"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-primary-foreground/10 pb-4 animate-fade-in">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 mx-4 mt-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    active ? "bg-gold/20 text-gold" : "text-primary-foreground/70 hover:text-primary-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="gradient-navy py-6 mt-auto">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-gold" />
            <span className="text-xs font-semibold text-gold tracking-wider uppercase">Secure & Fair Elections</span>
          </div>
          <p className="text-xs text-primary-foreground/50">
            © 2026 Batuan National High School — Batuan, Bohol, Philippines
          </p>
        </div>
      </footer>
    </div>
  );
}
