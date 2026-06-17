import { Moon, Search, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import { pricingPresets } from "../services/mockAiTokenControl";
import type { SavedRun } from "../types/contracts";
import { Badge, Button, Panel } from "./ui";

export function SavedRunsTable({ savedRuns }: { savedRuns: SavedRun[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => {
    return savedRuns.filter((run) => {
      const matchesQuery = [run.name, run.mode, run.model, ...run.tags].join(" ").toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === "all" || run.tags.includes(filter);
      return matchesQuery && matchesFilter;
    });
  }, [savedRuns, query, filter]);

  const tags = [...new Set(savedRuns.flatMap((run) => run.tags))];

  return (
    <Panel className="p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prompt library</p>
          <h2 className="text-lg font-bold text-white">Saved analyses and comparisons</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved runs" className="h-10 rounded-lg border border-white/10 bg-graphite-900 pl-9 pr-3 text-sm text-slate-100" />
          </label>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-lg border border-white/10 bg-graphite-900 px-3 text-sm text-slate-100">
            <option value="all">All tags</option>
            {tags.map((tag) => <option key={tag}>{tag}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="py-3">Name</th><th>Use case</th><th>Model</th><th>Previous</th><th>Optimized</th><th>Savings</th><th>Tags</th></tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map((run) => (
              <tr key={run.id}>
                <td className="py-3 font-semibold text-white">{run.name}</td>
                <td>{run.mode}</td>
                <td>{run.model}</td>
                <td>{run.originalTokens.toLocaleString()}</td>
                <td>{run.optimizedTokens.toLocaleString()}</td>
                <td className="text-mint-500">{run.savingsPercent}%</td>
                <td><div className="flex flex-wrap gap-1">{run.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function SettingsPanel({ dark, onThemeToggle }: { dark: boolean; onThemeToggle: () => void }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Panel className="p-4">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Token pricing table</p>
          <h2 className="text-lg font-bold text-white">Model pricing presets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="py-3">Provider</th><th>Preset</th><th>Input / 1M</th><th>Output / 1M</th><th>Status</th></tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {pricingPresets.map((preset) => (
                <tr key={preset.id}>
                  <td className="py-3 font-semibold text-white">{preset.provider}</td>
                  <td>{preset.modelName}</td>
                  <td>${preset.inputPerMillion.toFixed(2)}</td>
                  <td>${preset.outputPerMillion.toFixed(2)}</td>
                  <td><Badge tone={preset.selected ? "good" : "neutral"}>{preset.selected ? "Selected" : "Available"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel className="p-4">
        <h2 className="text-lg font-bold text-white">Defaults</h2>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Compression behavior</span>
            <select className="h-11 w-full rounded-lg border border-white/10 bg-graphite-900 px-3 text-sm text-slate-100">
              <option>Balanced</option>
              <option>Light</option>
              <option>Aggressive</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Default output budget</span>
            <input type="number" defaultValue={1024} className="h-11 w-full rounded-lg border border-white/10 bg-graphite-900 px-3 text-sm text-slate-100" />
          </label>
          <Button variant="secondary" icon={dark ? Moon : Sun} onClick={onThemeToggle}>
            {dark ? "Dark theme active" : "Light theme active"}
          </Button>
          <div className="rounded-lg border border-wheat-400/20 bg-wheat-400/10 p-3 text-sm text-wheat-400">
            Settings are local UI state only. No account, database, or backend persistence is included.
          </div>
        </div>
      </Panel>
    </div>
  );
}
