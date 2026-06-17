import {
  BarChart3,
  BookMarked,
  ChevronsLeftRight,
  Gauge,
  HeartHandshake,
  Library,
  Menu,
  Moon,
  Route,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  X
} from "lucide-react";
import type { ReactNode } from "react";
import type { ViewId } from "../types/contracts";
import { Button } from "./ui";

const navItems: { id: ViewId; label: string; icon: typeof Gauge }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "analyzer", label: "Analyzer", icon: Gauge },
  { id: "compressor", label: "Compressor", icon: ChevronsLeftRight },
  { id: "relevance", label: "Relevance", icon: SlidersHorizontal },
  { id: "planner", label: "Planner", icon: Route },
  { id: "library", label: "Saved Runs", icon: Library },
  { id: "donation", label: "Donation", icon: HeartHandshake },
  { id: "settings", label: "Settings", icon: Settings }
];

export function Sidebar({
  activeView,
  onNavigate,
  mobileOpen,
  onClose
}: {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <div className={`fixed inset-0 z-30 bg-black/50 lg:hidden ${mobileOpen ? "block" : "hidden"}`} onClick={onClose} />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-graphite-950 transition lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-mint-500/30 bg-mint-500/10 text-sm font-black text-mint-500">
              AI
            </span>
            <div>
              <p className="text-sm font-bold text-white">AI Token Control</p>
              <p className="text-xs text-slate-500">Frontend workspace</p>
            </div>
          </div>
          <button className="rounded-lg p-2 text-slate-400 lg:hidden" onClick={onClose} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeView;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                  active ? "bg-mint-500 text-graphite-950" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl border border-wheat-400/20 bg-wheat-400/10 p-3">
            <p className="text-xs font-semibold text-wheat-400">No backend connected</p>
            <p className="mt-1 text-xs text-slate-400">Mock data only. API calls, auth, billing, and model execution are intentionally absent.</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export function TopBar({
  activeLabel,
  onMenu,
  onAnalyze,
  dark,
  onThemeToggle
}: {
  activeLabel: string;
  onMenu: () => void;
  onAnalyze: () => void;
  dark: boolean;
  onThemeToggle: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-graphite-950/85 px-4 backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-3">
        <button className="rounded-lg border border-white/10 p-2 text-slate-200 lg:hidden" onClick={onMenu} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-semibold text-white">{activeLabel}</p>
          <p className="text-xs text-slate-500">Estimate, compress, filter, and plan before the expensive run.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 md:flex">
          <span className="h-2 w-2 rounded-full bg-mint-500" />
          Mock service online
        </div>
        <Button variant="secondary" icon={dark ? Sun : Moon} onClick={onThemeToggle}>
          {dark ? "Light" : "Dark"}
        </Button>
        <Button icon={Sparkles} onClick={onAnalyze}>Analyze</Button>
      </div>
    </header>
  );
}

export function AppShell({
  activeView,
  activeLabel,
  onNavigate,
  onAnalyze,
  dark,
  onThemeToggle,
  mobileOpen,
  setMobileOpen,
  children
}: {
  activeView: ViewId;
  activeLabel: string;
  onNavigate: (view: ViewId) => void;
  onAnalyze: () => void;
  dark: boolean;
  onThemeToggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar activeView={activeView} onNavigate={onNavigate} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="min-w-0 flex-1">
          <TopBar activeLabel={activeLabel} onMenu={() => setMobileOpen(true)} onAnalyze={onAnalyze} dark={dark} onThemeToggle={onThemeToggle} />
          {children}
        </div>
      </div>
    </div>
  );
}
