import { useEffect, useMemo, useState } from "react";
import { AnalyzerEditor, CompressionPanel, CostEstimator, ExecutionPlan, RelevanceMap, WasteReport } from "./components/Analyzer";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./components/Dashboard";
import { DonationPanel } from "./components/Donation";
import { SavedRunsTable, SettingsPanel } from "./components/LibrarySettings";
import { Badge, EmptyState, LoadingState, Panel } from "./components/ui";
import { analyzeInput, getSavedRuns } from "./services/mockAiTokenControl";
import type { AnalysisRequest, AnalysisResult, CompressionStrength, SavedRun, ViewId } from "./types/contracts";

const starterInput = `Project: customer onboarding assistant

Goal: review onboarding notes, identify blockers, and produce an implementation plan.

Context repeated from previous prompt:
- The audience is a mixed team of founders, engineers, and account managers.
- The audience is a mixed team of founders, engineers, and account managers.

Meeting transcript excerpt:
The team wants a concise plan. Security review is required before launch. Some logs below are duplicated. Preserve blockers and dependencies.

Duplicate log:
Error: tenant configuration missing at createWorkspace()
Error: tenant configuration missing at createWorkspace()

Formatting examples:
1. Use bullets.
2. Use bullets.
3. Use bullets.`;

const viewLabels: Record<ViewId, string> = {
  dashboard: "Dashboard",
  analyzer: "Token Analyzer Workspace",
  compressor: "Context Compressor",
  relevance: "Relevance Filter",
  planner: "Execution Planner",
  library: "Prompt Library / Saved Runs",
  donation: "Donation",
  settings: "Settings"
};

export function App() {
  const [activeView, setActiveView] = useState<ViewId>("analyzer");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dark, setDark] = useState(true);
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [result, setResult] = useState<AnalysisResult | undefined>();
  const [strength, setStrength] = useState<CompressionStrength>("Balanced");
  const [request, setRequest] = useState<AnalysisRequest>({
    input: starterInput,
    mode: "Document",
    targetModel: "GPT",
    taskGoal: "Create an implementation plan while preserving blockers and security constraints.",
    outputBudget: 1024
  });

  useEffect(() => {
    getSavedRuns().then(setSavedRuns);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("light", !dark);
  }, [dark]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const runAnalysis = async (destination: ViewId = activeView) => {
    setLoading(true);
    setActiveView(destination);
    try {
      const next = await analyzeInput(request);
      setResult(next);
      setToast("Analysis complete. Mock result is ready for backend wiring.");
    } finally {
      setLoading(false);
    }
  };

  const insightStats = useMemo(() => {
    if (!result) return undefined;
    return [
      ["Input tokens", result.estimate.inputTokens.toLocaleString()],
      ["Saved tokens", result.estimate.savedTokens.toLocaleString()],
      ["Optimized input", result.estimate.optimizedInputTokens.toLocaleString()],
      ["Compression", `${result.compression.compressionRatio}%`]
    ];
  }, [result]);

  const renderView = () => {
    if (activeView === "dashboard") return <Dashboard result={result} savedRuns={savedRuns} />;
    if (activeView === "compressor") {
      return (
        <CompressionPanel
          result={result}
          strength={strength}
          onStrength={setStrength}
          onToast={setToast}
          onAnalyze={() => runAnalysis("compressor")}
          loading={loading}
        />
      );
    }
    if (activeView === "relevance") {
      return (
        <RelevanceMap
          sections={result?.relevance}
          loading={loading}
          onAnalyze={() => runAnalysis("relevance")}
          onToggle={(id) => {
            if (!result) return;
            setResult({
              ...result,
              relevance: result.relevance.map((section) => section.id === id ? { ...section, selected: !section.selected } : section)
            });
          }}
        />
      );
    }
    if (activeView === "planner") return <ExecutionPlan result={result} />;
    if (activeView === "library") return <SavedRunsTable savedRuns={savedRuns} />;
    if (activeView === "donation") return <DonationPanel />;
    if (activeView === "settings") return <SettingsPanel dark={dark} onThemeToggle={() => setDark((value) => !value)} />;

    return (
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <AnalyzerEditor request={request} onChange={setRequest} onAnalyze={() => runAnalysis("analyzer")} loading={loading} />
          {loading ? <LoadingState /> : <WasteReport findings={result?.findings} />}
        </div>
        <aside className="space-y-4">
          <CostEstimator result={result} />
          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-white">Right insight panel</h2>
              <Badge tone={result ? "good" : "neutral"}>{result ? "Completed" : "Empty"}</Badge>
            </div>
            {insightStats ? (
              <div className="grid gap-3">
                {insightStats.map(([label, value]) => (
                  <div key={label} className="flex justify-between rounded-lg border border-white/10 bg-graphite-950/35 px-3 py-2 text-sm">
                    <span className="text-slate-400">{label}</span>
                    <strong className="text-white">{value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Insights waiting" body="Run an analysis to populate live estimates and recommendations." />
            )}
          </Panel>
        </aside>
      </div>
    );
  };

  return (
    <AppShell
      activeView={activeView}
      activeLabel={viewLabels[activeView]}
      onNavigate={setActiveView}
      onAnalyze={() => runAnalysis(activeView)}
      dark={dark}
      onThemeToggle={() => setDark((value) => !value)}
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
    >
      <main className="mx-auto max-w-[1600px] p-4 lg:p-6">
        {renderView()}
      </main>
      {toast ? (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-mint-500/30 bg-graphite-950 px-4 py-3 text-sm font-semibold text-mint-500 shadow-panel">
          {toast}
        </div>
      ) : null}
    </AppShell>
  );
}
