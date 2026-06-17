import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function Button({
  children,
  icon: Icon,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: "border-mint-500 bg-mint-500 text-graphite-950 hover:bg-mint-600",
    secondary: "border-white/10 bg-white/[0.07] text-slate-100 hover:bg-white/[0.1]",
    ghost: "border-transparent bg-transparent text-slate-300 hover:bg-white/[0.06]",
    danger: "border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/15"
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function Panel({
  children,
  className = "",
  as: Component = "section"
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "article" | "aside" | "div";
}) {
  return (
    <Component className={`rounded-xl border border-white/10 bg-white/[0.055] shadow-panel ${className}`}>
      {children}
    </Component>
  );
}

export function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "danger";
}) {
  const tones = {
    neutral: "border-slate-400/20 bg-slate-400/10 text-slate-200",
    good: "border-mint-500/30 bg-mint-500/10 text-mint-500",
    warn: "border-wheat-400/30 bg-wheat-400/10 text-wheat-400",
    danger: "border-red-400/30 bg-red-500/10 text-red-200"
  };

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid min-h-[260px] place-content-center rounded-xl border border-dashed border-white/15 px-6 py-10 text-center">
      <p className="text-base font-semibold text-slate-100">{title}</p>
      <p className="mt-2 max-w-md text-sm text-slate-400">{body}</p>
    </div>
  );
}

export function LoadingState({ label = "Analyzing token usage" }: { label?: string }) {
  return (
    <div className="grid min-h-[260px] place-content-center rounded-xl border border-white/10 bg-graphite-950/30 px-6 py-10 text-center">
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-mint-500" />
      <p className="mt-4 text-base font-semibold text-slate-100">{label}</p>
      <p className="mt-2 text-sm text-slate-400">Estimating waste, compression risk, and cheaper execution paths.</p>
    </div>
  );
}
