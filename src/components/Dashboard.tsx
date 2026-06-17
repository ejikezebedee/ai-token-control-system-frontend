import { AlertTriangle, ArrowDownRight, Clock, DollarSign, Gauge, History, Percent, Zap } from "lucide-react";
import type { AnalysisResult, SavedRun } from "../types/contracts";
import { Badge, Panel } from "./ui";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral"
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Gauge;
  tone?: "neutral" | "good" | "warn";
}) {
  const tones = {
    neutral: "text-slate-300 bg-white/[0.06]",
    good: "text-mint-500 bg-mint-500/10",
    warn: "text-wheat-400 bg-wheat-400/10"
  };

  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
          <p className="mt-1 text-sm text-slate-400">{detail}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Panel>
  );
}

export function Dashboard({ result, savedRuns }: { result?: AnalysisResult; savedRuns: SavedRun[] }) {
  const savedToday = result ? result.estimate.savedTokens : 18340;
  const monthly = result ? result.monthlySavingsProjection : 482.7;
  const ratio = result ? result.compression.compressionRatio : 41;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tokens saved today" value={savedToday.toLocaleString()} detail="Across mock analyzed runs" icon={Zap} tone="good" />
        <MetricCard label="Estimated monthly savings" value={`$${monthly.toFixed(2)}`} detail="Projected from current pattern" icon={DollarSign} tone="good" />
        <MetricCard label="Avg compression ratio" value={`${ratio}%`} detail="Balanced mode baseline" icon={Percent} />
        <MetricCard label="Analyzed prompts" value="128" detail="Prompts, docs, logs, code tasks" icon={Gauge} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Risk and waste trend</h2>
            <Badge tone="warn">Last 7 days</Badge>
          </div>
          <div className="grid h-72 grid-cols-7 items-end gap-3">
            {[38, 54, 47, 62, 49, 71, 58].map((value, index) => (
              <div key={value + index} className="flex h-full flex-col justify-end gap-2">
                <div className="rounded-t-lg bg-gradient-to-t from-mint-500 to-wheat-400" style={{ height: `${value}%` }} />
                <span className="text-center text-xs text-slate-500">D{index + 1}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-wheat-400" />
            <h2 className="text-lg font-bold text-white">Current risk signals</h2>
          </div>
          <div className="space-y-3">
            {[
              ["Duplicate logs", "High recurrence in code tasks", "danger"],
              ["Verbose instruction blocks", "Common in agency prompts", "warn"],
              ["Unclear objective", "Improving after task goal field", "neutral"]
            ].map(([title, body, tone]) => (
              <article key={title} className="rounded-lg border border-white/10 bg-graphite-950/35 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-white">{title}</h3>
                  <Badge tone={tone as "danger" | "warn" | "neutral"}>{tone}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-400">{body}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-mint-500" />
          <h2 className="text-lg font-bold text-white">Recent analysis history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="py-3">Run</th><th>Mode</th><th>Model</th><th>Original</th><th>Optimized</th><th>Savings</th><th>Created</th></tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {savedRuns.slice(0, 4).map((run) => (
                <tr key={run.id}>
                  <td className="py-3 font-semibold text-white">{run.name}</td>
                  <td>{run.mode}</td>
                  <td>{run.model}</td>
                  <td>{run.originalTokens.toLocaleString()}</td>
                  <td>{run.optimizedTokens.toLocaleString()}</td>
                  <td className="text-mint-500"><ArrowDownRight className="mr-1 inline h-4 w-4" />{run.savingsPercent}%</td>
                  <td className="text-slate-500">{new Date(run.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
