import { Copy, FileDown, Gauge, Play, Save, SlidersHorizontal } from "lucide-react";
import type {
  AnalysisMode,
  AnalysisRequest,
  AnalysisResult,
  CompressionStrength,
  RelevanceSection,
  TargetModel,
  WasteFinding
} from "../types/contracts";
import { Badge, Button, EmptyState, LoadingState, Panel } from "./ui";

const modes: AnalysisMode[] = ["Prompt", "Chat Log", "Document", "Code Task", "API Payload"];
const models: TargetModel[] = ["GPT", "Claude", "Gemini", "Llama", "Custom"];

const severityTone = {
  low: "neutral",
  medium: "warn",
  high: "danger",
  critical: "danger"
} as const;

export function ModeSelector({ value, onChange }: { value: AnalysisMode; onChange: (mode: AnalysisMode) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            value === mode ? "border-mint-500 bg-mint-500 text-graphite-950" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

export function ModelSelector({ value, onChange }: { value: TargetModel; onChange: (model: TargetModel) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Target model</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TargetModel)}
        className="h-11 w-full rounded-lg border border-white/10 bg-graphite-900 px-3 text-sm text-slate-100"
      >
        {models.map((model) => (
          <option key={model}>{model}</option>
        ))}
      </select>
    </label>
  );
}

export function AnalyzerEditor({
  request,
  onChange,
  onAnalyze,
  loading
}: {
  request: AnalysisRequest;
  onChange: (next: AnalysisRequest) => void;
  onAnalyze: () => void;
  loading: boolean;
}) {
  return (
    <Panel className="p-4">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="flex-1">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Input mode</span>
            <ModeSelector value={request.mode} onChange={(mode) => onChange({ ...request, mode })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
            <ModelSelector value={request.targetModel} onChange={(targetModel) => onChange({ ...request, targetModel })} />
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Output budget</span>
              <input
                type="number"
                min={128}
                step={128}
                value={request.outputBudget}
                onChange={(event) => onChange({ ...request, outputBudget: Number(event.target.value) })}
                className="h-11 w-full rounded-lg border border-white/10 bg-graphite-900 px-3 text-sm text-slate-100"
              />
            </label>
          </div>
        </div>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Task goal</span>
          <input
            value={request.taskGoal}
            onChange={(event) => onChange({ ...request, taskGoal: event.target.value })}
            placeholder="Example: produce an implementation plan and preserve security constraints"
            className="h-11 w-full rounded-lg border border-white/10 bg-graphite-900 px-3 text-sm text-slate-100"
          />
        </label>
      </div>
      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Prompt, document, chat log, code task, or API payload</span>
        <textarea
          value={request.input}
          onChange={(event) => onChange({ ...request, input: event.target.value })}
          className="scrollbar-thin min-h-[340px] w-full resize-y rounded-lg border border-white/10 bg-graphite-950/70 p-4 font-mono text-sm leading-6 text-slate-200 placeholder:text-slate-600"
          placeholder="Paste context here. The backend estimates waste, compression, relevance, and execution planning without exposing provider keys in the browser."
        />
      </label>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Backend-backed analysis with client fallback. API keys and model calls stay server-side.</p>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Save}>Save draft</Button>
          <Button icon={Play} onClick={onAnalyze} disabled={loading}>{loading ? "Analyzing" : "Analyze"}</Button>
        </div>
      </div>
    </Panel>
  );
}

export function CostEstimator({ result }: { result?: AnalysisResult }) {
  if (!result) {
    return <EmptyState title="No estimate yet" body="Run an analysis to populate token estimates, savings, and compression preview." />;
  }

  const saved = result.estimatedCostBefore - result.estimatedCostAfter;

  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cost estimate</p>
          <h3 className="mt-1 text-lg font-bold text-white">${result.estimatedCostAfter.toFixed(4)} optimized</h3>
        </div>
        <Badge tone="good">Save ${saved.toFixed(4)}</Badge>
      </div>
      <div className="mt-4 grid gap-3 text-sm">
        <div className="flex justify-between"><span className="text-slate-400">Before</span><strong>${result.estimatedCostBefore.toFixed(4)}</strong></div>
        <div className="flex justify-between"><span className="text-slate-400">After</span><strong>${result.estimatedCostAfter.toFixed(4)}</strong></div>
        <div className="flex justify-between"><span className="text-slate-400">Monthly projection</span><strong>${result.monthlySavingsProjection.toFixed(2)}</strong></div>
      </div>
      <div className="mt-4 rounded-lg border border-mint-500/20 bg-mint-500/10 p-3">
        <div className="flex justify-between text-xs font-semibold text-mint-500">
          <span>Compression preview</span>
          <span>{result.compression.compressionRatio}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/10">
          <div className="h-2 rounded-full bg-mint-500" style={{ width: `${result.compression.compressionRatio}%` }} />
        </div>
      </div>
    </Panel>
  );
}

export function WasteReport({ findings }: { findings?: WasteFinding[] }) {
  if (!findings) return <EmptyState title="Waste report pending" body="The report will show repeated context, duplicated logs, hidden bloat, and other token waste categories." />;

  return (
    <Panel className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Waste categories</h3>
        <Badge tone="warn">{findings.length} findings</Badge>
      </div>
      <div className="space-y-3">
        {findings.map((finding) => (
          <article key={finding.id} className="rounded-lg border border-white/10 bg-graphite-950/35 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold capitalize text-slate-100">{finding.category}</h4>
              <Badge tone={severityTone[finding.severity]}>{finding.severity} · {finding.tokensWasted.toLocaleString()} tokens</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">{finding.description}</p>
            <p className="mt-2 text-xs font-semibold text-mint-500">{finding.recommendation}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function CompressionPanel({
  result,
  strength,
  onStrength,
  onToast,
  onAnalyze,
  loading
}: {
  result?: AnalysisResult;
  strength: CompressionStrength;
  onStrength: (strength: CompressionStrength) => void;
  onToast: (message: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}) {
  if (!result) {
    return (
      <Panel className="p-4">
        {loading ? (
          <LoadingState label="Building compression result" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <EmptyState title="No compression result" body="Run the current analyzer input to compare original context against an optimized prompt." />
            <Button icon={Gauge} onClick={onAnalyze}>Analyze for compressor</Button>
          </div>
        )}
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel className="p-4">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Context compressor</p>
            <h3 className="mt-1 text-lg font-bold text-white">Before and after split view</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["Light", "Balanced", "Aggressive"] as CompressionStrength[]).map((item) => (
              <button
                key={item}
                onClick={() => onStrength(item)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                  strength === item ? "border-mint-500 bg-mint-500 text-graphite-950" : "border-white/10 bg-white/[0.05] text-slate-300"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="rounded-lg border border-red-400/20 bg-red-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-200">Before</p>
            <p className="scrollbar-thin mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-300">{result.compression.beforeText}</p>
          </div>
          <div className="rounded-lg border border-mint-500/20 bg-mint-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-mint-500">After</p>
            <p className="scrollbar-thin mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-200">{result.compression.afterText}</p>
          </div>
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="p-4 xl:col-span-1">
          <h3 className="font-bold text-white">Removed sections</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {result.compression.removedSections.map((item) => <li key={item} className="rounded-lg bg-red-500/10 px-3 py-2 text-red-100">{item}</li>)}
          </ul>
        </Panel>
        <Panel className="p-4 xl:col-span-1">
          <h3 className="font-bold text-white">Preserve critical facts</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {result.compression.preservedFacts.map((item) => <li key={item} className="rounded-lg bg-mint-500/10 px-3 py-2 text-mint-100">{item}</li>)}
          </ul>
        </Panel>
        <Panel className="p-4 xl:col-span-1">
          <h3 className="font-bold text-white">Safety warnings</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {result.compression.warnings.map((item) => <li key={item} className="rounded-lg bg-wheat-400/10 px-3 py-2 text-wheat-400">{item}</li>)}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button icon={Copy} onClick={() => {
              void navigator.clipboard.writeText(result.optimizedPrompt);
              onToast("Optimized prompt copied.");
            }}>Copy optimized prompt</Button>
            <Button variant="secondary" icon={FileDown} onClick={() => {
              const blob = new Blob([JSON.stringify(result.compression, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = `token-control-compression-${result.id}.json`;
              anchor.click();
              URL.revokeObjectURL(url);
              onToast("Compression result exported.");
            }}>Export result</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function RelevanceMap({
  sections,
  onToggle,
  onAnalyze,
  loading
}: {
  sections?: RelevanceSection[];
  onToggle: (id: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}) {
  if (!sections) {
    return (
      <Panel className="p-4">
        {loading ? (
          <LoadingState label="Mapping relevance sections" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <EmptyState title="No relevance map" body="Run the current analyzer input to see relevant, uncertain, and removable sections." />
            <Button icon={SlidersHorizontal} onClick={onAnalyze}>Analyze relevance</Button>
          </div>
        )}
      </Panel>
    );
  }

  const saved = sections.filter((section) => !section.selected).reduce((total, section) => total + section.tokens, 0);
  const statusTone = { relevant: "good", uncertain: "warn", removable: "danger" } as const;

  return (
    <Panel className="p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Relevance filter</p>
          <h3 className="text-lg font-bold text-white">Keep or remove context sections</h3>
        </div>
        <Badge tone="good">{saved.toLocaleString()} tokens saved live</Badge>
      </div>
      <div className="space-y-3">
        {sections.map((section) => (
          <article key={section.id} className="flex flex-col gap-3 rounded-lg border border-white/10 bg-graphite-950/35 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-white">{section.title}</h4>
                <Badge tone={statusTone[section.status]}>{section.status}</Badge>
                <span className="text-xs text-slate-500">{section.tokens.toLocaleString()} tokens</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{section.reason}</p>
            </div>
            <Button variant={section.selected ? "secondary" : "ghost"} icon={SlidersHorizontal} onClick={() => onToggle(section.id)}>
              {section.selected ? "Keep" : "Remove"}
            </Button>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function ExecutionPlan({ result }: { result?: AnalysisResult }) {
  if (!result) return <EmptyState title="No execution plan" body="Run analysis to generate a cheaper AI workflow and suggested final prompt." />;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Panel className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Recommended cheaper workflow</h3>
          <Badge tone="good">{result.executionPlan.reduce((total, step) => total + step.estimatedSavings, 0)}% blended opportunity</Badge>
        </div>
        <div className="space-y-3">
          {result.executionPlan.map((step, index) => (
            <article key={step.id} className="grid gap-3 rounded-lg border border-white/10 bg-graphite-950/35 p-3 sm:grid-cols-[44px_1fr_auto] sm:items-center">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/[0.06] text-sm font-bold text-mint-500">{index + 1}</span>
              <div>
                <h4 className="font-semibold text-white">{step.title}</h4>
                <p className="text-sm text-slate-400">{step.description}</p>
              </div>
              <Badge tone={step.modelTier === "cheap" ? "good" : step.modelTier === "premium" ? "warn" : "neutral"}>{step.modelTier} · {step.estimatedSavings}%</Badge>
            </article>
          ))}
        </div>
      </Panel>
      <Panel className="p-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-mint-500" />
          <h3 className="font-bold text-white">Output budget planner</h3>
        </div>
        <div className="mt-4 grid gap-3 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Requested budget</span><strong>{result.request.outputBudget.toLocaleString()} tokens</strong></div>
          <div className="flex justify-between"><span className="text-slate-400">Optimized input</span><strong>{result.estimate.optimizedInputTokens.toLocaleString()} tokens</strong></div>
          <div className="flex justify-between"><span className="text-slate-400">Total run estimate</span><strong>{(result.estimate.optimizedInputTokens + result.request.outputBudget).toLocaleString()} tokens</strong></div>
        </div>
        <div className="mt-5 rounded-lg border border-mint-500/20 bg-mint-500/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-mint-500">Suggested final prompt</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">{result.optimizedPrompt}</p>
        </div>
      </Panel>
    </div>
  );
}
