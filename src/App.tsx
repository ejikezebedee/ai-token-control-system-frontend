import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Clipboard,
  Code2,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  FileSearch,
  FileText,
  Filter,
  Gauge,
  Heart,
  Image as ImageIcon,
  Info,
  LayoutDashboard,
  Loader2,
  Menu,
  PanelRightClose,
  Paperclip,
  Play,
  RefreshCw,
  Save,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  UploadCloud,
  X
} from "lucide-react";
import {
  analyzeInput,
  getSavedRuns,
  optimizedPrompt,
  pricingRows,
  sampleInput
} from "./services/mockTokenControlService";
import {
  AnalysisMode,
  AnalysisRequest,
  AnalysisResult,
  AppView,
  CompressionStrength,
  ModelPricing,
  RelevanceSection,
  SavedRun,
  TargetModel,
  UploadedAsset
} from "./types";

const navItems: Array<{ id: AppView; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analyzer", label: "Analyzer", icon: FileSearch },
  { id: "compressor", label: "Compressor", icon: SlidersHorizontal },
  { id: "relevance", label: "Relevance", icon: Filter },
  { id: "planner", label: "Planner", icon: Target },
  { id: "library", label: "Saved Runs", icon: BookOpen },
  { id: "support", label: "Support", icon: Heart },
  { id: "settings", label: "Settings", icon: Settings }
];

const modes: AnalysisMode[] = ["Prompt", "Chat Log", "Document", "Code Task", "API Payload"];
const models: TargetModel[] = ["GPT", "Claude", "Gemini", "Llama", "Custom"];

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const number = new Intl.NumberFormat("en-US");

const defaultRequest: AnalysisRequest = {
  input: sampleInput,
  mode: "Document",
  targetModel: "Claude",
  taskGoal: "Create a concise leadership brief and optimized final prompt.",
  outputBudgetTokens: 1200,
  assets: [
    {
      id: "asset-sample-brief",
      name: "client-onboarding-notes.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1840000,
      kind: "document",
      estimatedTokens: 3200,
      status: "needs extraction"
    },
    {
      id: "asset-sample-wireframe",
      name: "workflow-screenshot.png",
      mimeType: "image/png",
      sizeBytes: 640000,
      kind: "image",
      estimatedTokens: 850,
      status: "needs extraction"
    }
  ]
};

type Toast = { id: number; message: string; tone: "success" | "info" };

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function App() {
  const [activeView, setActiveView] = useState<AppView>("analyzer");
  const [request, setRequest] = useState<AnalysisRequest>(defaultRequest);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    getSavedRuns().then(setSavedRuns);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const notify = (message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now();
    setToasts((items) => [...items, { id, message, tone }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 2800);
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setActiveView("analyzer");
    const next = await analyzeInput(request);
    setResult(next);
    setIsAnalyzing(false);
    notify("Analysis complete. Optimization draft is ready.");
  };

  const visibleResult = result;

  return (
    <div className="min-h-screen bg-[#efeee9] text-ink dark:bg-[#111413] dark:text-[#efeee9]">
      <AppShell
        activeView={activeView}
        setActiveView={setActiveView}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        result={visibleResult}
        isAnalyzing={isAnalyzing}
        onAnalyze={runAnalysis}
      >
        <main className="grid min-h-[calc(100vh-64px)] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 border-r border-line/80 bg-[#f7f6f1] p-3 dark:border-white/10 dark:bg-[#171b19] sm:p-4 lg:p-5">
            {activeView === "dashboard" && <Dashboard result={visibleResult} savedRuns={savedRuns} />}
            {activeView === "analyzer" && (
              <AnalyzerWorkspace
                request={request}
                setRequest={setRequest}
                result={visibleResult}
                isAnalyzing={isAnalyzing}
                onAnalyze={runAnalysis}
                notify={notify}
              />
            )}
            {activeView === "compressor" && <CompressionPanel result={visibleResult} notify={notify} />}
            {activeView === "relevance" && <RelevanceMap result={visibleResult} />}
            {activeView === "planner" && <ExecutionPlan result={visibleResult} />}
            {activeView === "library" && <SavedRunsTable runs={savedRuns} />}
            {activeView === "support" && <SupportPanel notify={notify} />}
            {activeView === "settings" && <SettingsPanel dark={dark} setDark={setDark} notify={notify} />}
          </section>
          <InsightPanel result={visibleResult} isAnalyzing={isAnalyzing} />
        </main>
      </AppShell>
      <ToastStack toasts={toasts} />
    </div>
  );
}

function AppShell({
  children,
  activeView,
  setActiveView,
  sidebarOpen,
  setSidebarOpen,
  result,
  isAnalyzing,
  onAnalyze
}: {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        open={sidebarOpen}
        close={() => setSidebarOpen(false)}
      />
      <div className="min-w-0 flex-1 lg:pl-64">
        <TopBar
          activeView={activeView}
          openSidebar={() => setSidebarOpen(true)}
          result={result}
          isAnalyzing={isAnalyzing}
          onAnalyze={onAnalyze}
        />
        {children}
      </div>
    </div>
  );
}

function Sidebar({
  activeView,
  setActiveView,
  open,
  close
}: {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  open: boolean;
  close: () => void;
}) {
  return (
    <>
      <div
        className={classNames(
          "fixed inset-0 z-30 bg-black/30 transition lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={close}
      />
      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-[#faf9f4] transition-transform dark:border-white/10 dark:bg-[#141715] lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4 dark:border-white/10">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-white dark:bg-[#efeee9] dark:text-ink">
                <Gauge size={19} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-5">AI Token Control</p>
                <p className="text-xs text-ink/55 dark:text-white/50">Optimization console</p>
              </div>
            </div>
          </div>
          <button className="icon-button lg:hidden" onClick={close} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  close();
                }}
                className={classNames("nav-item", activeView === item.id && "nav-item-active")}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-line p-3 dark:border-white/10">
          <div className="rounded-md border border-line bg-white p-3 text-xs leading-5 text-ink/70 dark:border-white/10 dark:bg-white/5 dark:text-white/65">
            <p className="font-semibold text-ink dark:text-white">Mock frontend mode</p>
            <p>No backend, API keys, auth, billing, or model calls are included.</p>
          </div>
        </div>
      </aside>
    </>
  );
}

function TopBar({
  activeView,
  openSidebar,
  result,
  isAnalyzing,
  onAnalyze
}: {
  activeView: AppView;
  openSidebar: () => void;
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}) {
  const label = navItems.find((item) => item.id === activeView)?.label ?? "Workspace";
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-[#fbfaf6]/95 px-3 backdrop-blur dark:border-white/10 dark:bg-[#141715]/95 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button className="icon-button lg:hidden" onClick={openSidebar} aria-label="Open navigation">
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold sm:text-base">{label}</p>
          <p className="truncate text-xs text-ink/55 dark:text-white/50">
            {result ? `${number.format(result.optimizedEstimate.inputTokens)} optimized input tokens` : "Ready for analysis"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5 md:flex">
          <span className={classNames("h-2 w-2 rounded-full", isAnalyzing ? "bg-signal" : "bg-moss")} />
          {isAnalyzing ? "Analyzing" : "Local mock mode"}
        </div>
        <button className="btn-primary" onClick={onAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
          <span className="hidden sm:inline">Analyze</span>
        </button>
      </div>
    </header>
  );
}

function Dashboard({ result, savedRuns }: { result: AnalysisResult | null; savedRuns: SavedRun[] }) {
  const analyzed = result ? 148 : 147;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={TrendingDown} label="Tokens saved today" value="184,200" detail="+18% vs yesterday" tone="moss" />
        <MetricCard icon={DollarSign} label="Estimated monthly savings" value="$1,482" detail="Based on current model mix" tone="copper" />
        <MetricCard icon={Gauge} label="Avg compression ratio" value={result ? `${result.savingsPercent}%` : "57%"} detail="Balanced default" tone="marine" />
        <MetricCard icon={Activity} label="Analyzed prompts" value={String(analyzed)} detail="24 queued for review" tone="plum" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <section className="panel">
          <SectionHeader icon={BarChart3} title="Risk And Waste Trend" action="Last 14 days" />
          <div className="mt-4 grid h-72 grid-cols-14 items-end gap-2">
            {[44, 52, 49, 70, 63, 58, 75, 61, 48, 42, 39, 46, 37, 31].map((height, index) => (
              <div key={index} className="flex h-full flex-col justify-end gap-1">
                <div
                  className="rounded-t bg-copper/75 dark:bg-copper"
                  style={{ height: `${height}%` }}
                  title={`${height}% waste risk`}
                />
                <div className="h-1 rounded bg-moss/70" style={{ height: `${Math.max(8, 84 - height)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink/60 dark:text-white/55">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-copper" /> Waste risk</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-moss" /> Saved token share</span>
          </div>
        </section>
        <section className="panel">
          <SectionHeader icon={Archive} title="Recent Analysis History" action={`${savedRuns.length} saved`} />
          <div className="mt-4 space-y-3">
            {savedRuns.map((run) => (
              <div key={run.id} className="rounded-md border border-line bg-white p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{run.name}</p>
                    <p className="mt-1 text-xs text-ink/55 dark:text-white/50">{run.mode} / {run.model}</p>
                  </div>
                  <span className="rounded bg-moss/10 px-2 py-1 text-xs font-semibold text-moss dark:bg-moss/25 dark:text-[#b9d5b4]">
                    {run.savingsPercent}%
                  </span>
                </div>
                <div className="mt-3 h-2 rounded bg-[#ece8dd] dark:bg-white/10">
                  <div className="h-2 rounded bg-moss" style={{ width: `${run.savingsPercent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone
}: {
  icon: typeof TrendingDown;
  label: string;
  value: string;
  detail: string;
  tone: "moss" | "copper" | "marine" | "plum";
}) {
  const tones = {
    moss: "bg-moss/10 text-moss dark:text-[#b9d5b4]",
    copper: "bg-copper/10 text-copper dark:text-[#e6aa82]",
    marine: "bg-marine/10 text-marine dark:text-[#9ed1dd]",
    plum: "bg-plum/10 text-plum dark:text-[#d5b9cf]"
  };
  return (
    <section className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink/50 dark:text-white/45">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <div className={classNames("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", tones[tone])}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-xs text-ink/55 dark:text-white/50">{detail}</p>
    </section>
  );
}

function AnalyzerWorkspace({
  request,
  setRequest,
  result,
  isAnalyzing,
  onAnalyze,
  notify
}: {
  request: AnalysisRequest;
  setRequest: (request: AnalysisRequest) => void;
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  notify: (message: string, tone?: Toast["tone"]) => void;
}) {
  const assetEstimate = request.assets.reduce((sum, asset) => sum + asset.estimatedTokens, 0);
  const localEstimate = Math.max(1, Math.round(request.input.length / 3.6) + assetEstimate);
  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="panel min-w-0">
        <SectionHeader icon={FileSearch} title="Token Analyzer Workspace" action="Pre-run optimization" />
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <ModeSelector value={request.mode} onChange={(mode) => setRequest({ ...request, mode })} />
          <ModelSelector value={request.targetModel} onChange={(targetModel) => setRequest({ ...request, targetModel })} />
        </div>
        <label className="mt-4 block">
          <span className="field-label">Task goal</span>
          <input
            className="field"
            value={request.taskGoal}
            onChange={(event) => setRequest({ ...request, taskGoal: event.target.value })}
            placeholder="State what the AI should produce"
          />
        </label>
        <UploadQueue
          assets={request.assets}
          onChange={(assets) => setRequest({ ...request, assets })}
          notify={notify}
        />
        <AnalyzerEditor value={request.input} onChange={(input) => setRequest({ ...request, input })} />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <InlineStat label="Input plus files" value={`${number.format(localEstimate)} tokens`} />
            <InlineStat label="Output budget" value={`${number.format(request.outputBudgetTokens)} tokens`} />
            <InlineStat label="Files queued" value={`${request.assets.length}`} />
          </div>
          <button className="btn-primary justify-center" onClick={onAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            Analyze waste
          </button>
        </div>
      </section>
      <div className="space-y-4">
        {isAnalyzing ? <LoadingState title="Inspecting context" /> : <CostEstimator result={result} />}
        <WasteReport result={result} />
      </div>
    </div>
  );
}

function UploadQueue({
  assets,
  onChange,
  notify
}: {
  assets: UploadedAsset[];
  onChange: (assets: UploadedAsset[]) => void;
  notify: (message: string, tone?: Toast["tone"]) => void;
}) {
  const supportedTypes = useMemo(
    () => [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
      "text/csv",
      "application/json",
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif"
    ],
    []
  );
  const assetTokens = assets.reduce((sum, asset) => sum + asset.estimatedTokens, 0);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const nextAssets = Array.from(files).map((file) => {
      const isImage = file.type.startsWith("image/");
      const isSupported = supportedTypes.includes(file.type) || file.name.match(/\.(md|txt|csv|json|pdf|doc|docx)$/i);
      const estimatedTokens = Math.max(
        isImage ? 450 : 300,
        Math.round(file.size / (isImage ? 750 : 420))
      );
      return {
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: file.name,
        mimeType: file.type || "unknown",
        sizeBytes: file.size,
        kind: isImage ? "image" : "document",
        estimatedTokens,
        status: isSupported ? "needs extraction" : "unsupported",
        previewUrl: isImage ? URL.createObjectURL(file) : undefined
      } satisfies UploadedAsset;
    });
    onChange([...assets, ...nextAssets]);
    notify(`${nextAssets.length} file${nextAssets.length === 1 ? "" : "s"} added to analysis queue.`);
  };

  const removeAsset = (assetId: string) => {
    const target = assets.find((asset) => asset.id === assetId);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onChange(assets.filter((asset) => asset.id !== assetId));
  };

  return (
    <section className="mt-4 rounded-md border border-dashed border-marine/35 bg-marine/5 p-3 dark:border-marine/50 dark:bg-marine/10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <UploadCloud size={18} className="text-marine dark:text-[#9ed1dd]" />
            <p className="text-sm font-semibold">Upload documents or images</p>
          </div>
          <p className="mt-1 text-xs leading-5 text-ink/60 dark:text-white/55">
            Queue PDFs, docs, text files, screenshots, diagrams, or image prompts for token estimation. Files stay in browser state in this frontend build.
          </p>
        </div>
        <label className="btn-secondary shrink-0 cursor-pointer justify-center">
          <Paperclip size={16} />
          Add files
          <input
            className="sr-only"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => {
              addFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <InlineStat label="Queued assets" value={String(assets.length)} />
        <InlineStat label="File token estimate" value={`${number.format(assetTokens)} tokens`} />
        <InlineStat label="Extraction status" value={assets.some((asset) => asset.status === "unsupported") ? "Review needed" : "Ready"} />
      </div>

      {assets.length > 0 ? (
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {assets.map((asset) => (
            <div key={asset.id} className="flex min-w-0 items-center gap-3 rounded-md border border-line bg-white p-2 dark:border-white/10 dark:bg-white/5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#ece8dd] dark:bg-white/10">
                {asset.previewUrl ? (
                  <img src={asset.previewUrl} alt="" className="h-full w-full object-cover" />
                ) : asset.kind === "image" ? (
                  <ImageIcon size={20} />
                ) : (
                  <FileText size={20} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{asset.name}</p>
                <p className="mt-1 truncate text-xs text-ink/55 dark:text-white/50">
                  {asset.kind} / {formatBytes(asset.sizeBytes)} / ~{number.format(asset.estimatedTokens)} tokens
                </p>
                <span
                  className={classNames(
                    "mt-1 inline-flex rounded px-2 py-0.5 text-[11px] font-semibold",
                    asset.status === "unsupported"
                      ? "bg-copper/15 text-copper dark:text-[#e6aa82]"
                      : "bg-moss/10 text-moss dark:text-[#b9d5b4]"
                  )}
                >
                  {asset.status}
                </span>
              </div>
              <button className="icon-button shrink-0" onClick={() => removeAsset(asset.id)} aria-label={`Remove ${asset.name}`}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-line bg-white p-3 text-sm text-ink/60 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
          No files queued. Paste text below or attach source documents and screenshots for a fuller pre-run estimate.
        </div>
      )}
    </section>
  );
}

function ModeSelector({ value, onChange }: { value: AnalysisMode; onChange: (mode: AnalysisMode) => void }) {
  return (
    <div>
      <span className="field-label">Input mode</span>
      <div className="segmented">
        {modes.map((mode) => (
          <button key={mode} className={classNames(value === mode && "selected")} onClick={() => onChange(mode)}>
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}

function ModelSelector({ value, onChange }: { value: TargetModel; onChange: (model: TargetModel) => void }) {
  return (
    <div>
      <span className="field-label">Target model</span>
      <div className="segmented">
        {models.map((model) => (
          <button key={model} className={classNames(value === model && "selected")} onClick={() => onChange(model)}>
            {model}
          </button>
        ))}
      </div>
    </div>
  );
}

function AnalyzerEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="mt-4 block">
      <span className="field-label">Prompt, document, chat log, code task, or API payload</span>
      <textarea
        className="min-h-[360px] w-full resize-y rounded-md border border-line bg-white p-4 font-mono text-sm leading-6 outline-none transition focus:border-marine focus:ring-4 focus:ring-marine/10 dark:border-white/10 dark:bg-[#101311]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CostEstimator({ result }: { result: AnalysisResult | null }) {
  if (!result) {
    return <EmptyState icon={DollarSign} title="No cost estimate yet" detail="Run an analysis to see before and after cost projections." />;
  }
  return (
    <section className="panel">
      <SectionHeader icon={DollarSign} title="Cost Estimate" action={`${result.savingsPercent}% lower`} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
        <InlineStat label="Before optimization" value={currency.format(result.estimatedCostBefore)} />
        <InlineStat label="After optimization" value={currency.format(result.estimatedCostAfter)} />
        <InlineStat label="Token estimate before" value={`${number.format(result.tokenEstimate.totalTokens)}`} />
        <InlineStat label="Compression preview" value={`${result.compression.compressionRatio}% smaller`} />
      </div>
    </section>
  );
}

function WasteReport({ result }: { result: AnalysisResult | null }) {
  if (!result) {
    return <EmptyState icon={AlertTriangle} title="Waste report waiting" detail="Find repeated context, irrelevant sections, hidden bloat, and unclear objectives." />;
  }
  return (
    <section className="panel">
      <SectionHeader icon={AlertTriangle} title="Waste Categories" action={`${result.riskScore}/100 risk`} />
      <div className="mt-4 space-y-2">
        {result.wasteFindings.map((finding) => (
          <div key={finding.id} className="rounded-md border border-line bg-white p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold capitalize">{finding.category}</p>
                <p className="mt-1 text-xs leading-5 text-ink/60 dark:text-white/55">{finding.summary}</p>
              </div>
              <SeverityBadge severity={finding.severity} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs">
              <span className="text-ink/55 dark:text-white/50">{finding.recommendation}</span>
              <span className="shrink-0 font-semibold">{number.format(finding.tokensWasted)} tok</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CompressionPanel({ result, notify }: { result: AnalysisResult | null; notify: (message: string, tone?: Toast["tone"]) => void }) {
  const [strength, setStrength] = useState<CompressionStrength>("Balanced");
  if (!result) {
    return <EmptyState icon={SlidersHorizontal} title="Run an analysis first" detail="Compression results, warnings, and optimized prompts appear here." />;
  }
  const strengthIndex = strength === "Light" ? 0 : strength === "Balanced" ? 1 : 2;
  return (
    <div className="space-y-4">
      <section className="panel">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SectionHeader icon={SlidersHorizontal} title="Context Compressor" action={`${result.compression.compressionRatio}% compressed`} />
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => notify("Optimized prompt copied to clipboard.")}>
              <Copy size={16} /> Copy
            </button>
            <button className="btn-secondary" onClick={() => notify("Export prepared as a frontend mock action.", "info")}>
              <Download size={16} /> Export
            </button>
          </div>
        </div>
        <div className="mt-4">
          <span className="field-label">Compression strength</span>
          <input
            aria-label="Compression strength"
            type="range"
            min={0}
            max={2}
            value={strengthIndex}
            onChange={(event) => setStrength(["Light", "Balanced", "Aggressive"][Number(event.target.value)] as CompressionStrength)}
            className="w-full accent-moss"
          />
          <div className="mt-1 flex justify-between text-xs text-ink/55 dark:text-white/50">
            <span>Light</span><span>Balanced</span><span>Aggressive</span>
          </div>
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel min-w-0">
          <SectionHeader icon={Clipboard} title="Before" action={`${number.format(result.compression.originalTokens)} tokens`} />
          <p className="mt-4 max-h-[460px] overflow-auto whitespace-pre-wrap rounded-md border border-line bg-white p-4 text-sm leading-6 dark:border-white/10 dark:bg-white/5">
            {result.compression.originalText}
          </p>
        </div>
        <div className="panel min-w-0">
          <SectionHeader icon={Check} title="After" action={`${number.format(result.compression.optimizedTokens)} tokens`} />
          <p className="mt-4 max-h-[460px] overflow-auto whitespace-pre-wrap rounded-md border border-moss/30 bg-moss/5 p-4 text-sm leading-6 dark:bg-moss/10">
            {result.compression.optimizedText}
          </p>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <InfoList title="Removed sections" icon={Trash2} items={result.compression.removedSections} />
        <InfoList title="Preserved critical facts" icon={Check} items={result.compression.preservedFacts} />
        <InfoList title="Safety warnings" icon={AlertTriangle} items={result.compression.warnings} />
      </section>
    </div>
  );
}

function RelevanceMap({ result }: { result: AnalysisResult | null }) {
  const [sections, setSections] = useState<RelevanceSection[]>([]);
  useEffect(() => {
    setSections(result?.relevanceSections ?? []);
  }, [result]);

  if (!result) {
    return <EmptyState icon={Filter} title="No relevance map yet" detail="Analyze input to classify sections as relevant, uncertain, or removable." />;
  }
  const saved = sections.filter((section) => !section.selected).reduce((sum, section) => sum + section.tokenCount, 0);
  return (
    <section className="panel">
      <SectionHeader icon={Filter} title="Relevance Filter" action={`${number.format(saved)} tokens saved live`} />
      <div className="mt-4 space-y-3">
        {sections.map((section) => (
          <div key={section.id} className="rounded-md border border-line bg-white p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{section.title}</p>
                  <StatusBadge status={section.status} />
                </div>
                <p className="mt-2 text-sm leading-6 text-ink/70 dark:text-white/65">{section.excerpt}</p>
                <p className="mt-2 text-xs text-ink/50 dark:text-white/45">{section.reason}</p>
              </div>
              <button
                className={classNames("btn-secondary shrink-0", !section.selected && "border-copper/40 text-copper")}
                onClick={() =>
                  setSections((items) =>
                    items.map((item) => (item.id === section.id ? { ...item, selected: !item.selected } : item))
                  )
                }
              >
                {section.selected ? <Check size={16} /> : <Trash2 size={16} />}
                {section.selected ? "Keep" : "Remove"}
              </button>
            </div>
            <div className="mt-3 text-xs font-semibold">{number.format(section.tokenCount)} tokens</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExecutionPlan({ result }: { result: AnalysisResult | null }) {
  if (!result) {
    return <EmptyState icon={Target} title="No execution plan yet" detail="Run an analysis to generate a cheaper staged workflow and final prompt." />;
  }
  return (
    <div className="space-y-4">
      <section className="panel">
        <SectionHeader icon={Target} title="Recommended Cheaper Workflow" action="Backend-ready mock plan" />
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {result.executionPlan.map((step, index) => (
            <div key={step.id} className="rounded-md border border-line bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-semibold text-white dark:bg-white dark:text-ink">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-1 text-sm leading-6 text-ink/65 dark:text-white/60">{step.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded bg-marine/10 px-2 py-1 font-semibold text-marine dark:text-[#9ed1dd]">{step.modelTier}</span>
                    <span className="rounded bg-moss/10 px-2 py-1 font-semibold text-moss dark:text-[#b9d5b4]">{step.savingsPercent}% savings</span>
                    <span className="rounded bg-[#ece8dd] px-2 py-1 font-semibold dark:bg-white/10">{number.format(step.estimatedTokens)} tok</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-[.7fr_1.3fr]">
        <div className="panel">
          <SectionHeader icon={Gauge} title="Output Budget Planner" action="1,200 token cap" />
          <div className="mt-4 space-y-3">
            <InlineStat label="Executive summary" value="250 tokens" />
            <InlineStat label="Risk table" value="300 tokens" />
            <InlineStat label="Workflow steps" value="420 tokens" />
            <InlineStat label="Final prompt" value="230 tokens" />
          </div>
        </div>
        <div className="panel">
          <SectionHeader icon={Sparkles} title="Suggested Final Prompt" action="Optimized" />
          <p className="mt-4 whitespace-pre-wrap rounded-md border border-line bg-white p-4 text-sm leading-6 dark:border-white/10 dark:bg-white/5">
            {result.optimizedPrompt || optimizedPrompt}
          </p>
        </div>
      </section>
    </div>
  );
}

function SavedRunsTable({ runs }: { runs: SavedRun[] }) {
  const [query, setQuery] = useState("");
  const filtered = runs.filter((run) => `${run.name} ${run.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <section className="panel">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SectionHeader icon={BookOpen} title="Prompt Library And Saved Runs" action={`${filtered.length} matches`} />
        <label className="relative block md:w-80">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-ink/45 dark:text-white/40" size={17} />
          <input className="field pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search runs or tags" />
        </label>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[760px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.08em] text-ink/50 dark:text-white/45">
              <th className="border-b border-line py-3 pr-4 dark:border-white/10">Run</th>
              <th className="border-b border-line py-3 pr-4 dark:border-white/10">Use case</th>
              <th className="border-b border-line py-3 pr-4 dark:border-white/10">Before</th>
              <th className="border-b border-line py-3 pr-4 dark:border-white/10">After</th>
              <th className="border-b border-line py-3 pr-4 dark:border-white/10">Saved</th>
              <th className="border-b border-line py-3 dark:border-white/10">Compare</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((run) => (
              <tr key={run.id}>
                <td className="border-b border-line py-4 pr-4 dark:border-white/10">
                  <p className="font-semibold">{run.name}</p>
                  <p className="mt-1 text-xs text-ink/50 dark:text-white/45">{new Date(run.createdAt).toLocaleDateString()} / {run.status}</p>
                </td>
                <td className="border-b border-line py-4 pr-4 dark:border-white/10">
                  <div className="flex flex-wrap gap-1">
                    {run.tags.map((tag) => <span key={tag} className="rounded bg-[#ece8dd] px-2 py-1 text-xs dark:bg-white/10">{tag}</span>)}
                  </div>
                </td>
                <td className="border-b border-line py-4 pr-4 dark:border-white/10">{number.format(run.originalTokens)}</td>
                <td className="border-b border-line py-4 pr-4 dark:border-white/10">{number.format(run.optimizedTokens)}</td>
                <td className="border-b border-line py-4 pr-4 font-semibold text-moss dark:border-white/10 dark:text-[#b9d5b4]">{run.savingsPercent}%</td>
                <td className="border-b border-line py-4 dark:border-white/10">
                  <button className="btn-secondary"><ChevronRight size={16} /> Open</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SupportPanel({ notify }: { notify: (message: string, tone?: Toast["tone"]) => void }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="panel">
        <SectionHeader icon={Heart} title="Support AI Token Control" action="Frontend donation UI" />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <DonationBox notify={notify} />
          <div className="rounded-md border border-line bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-copper dark:text-[#e6aa82]" />
              <p className="font-semibold">Payment handoff notes</p>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/65 dark:text-white/60">
              <li>Connect this form to Stripe Checkout, PayPal, Ko-fi, Buy Me a Coffee, or a custom payment link later.</li>
              <li>The current button only creates a local donation intent and shows a notification.</li>
              <li>No card data, payment details, account data, or money movement is handled in this frontend.</li>
            </ul>
          </div>
        </div>
      </section>
      <section className="panel">
        <SectionHeader icon={DollarSign} title="Support Summary" action="Mock totals" />
        <div className="mt-4 space-y-3">
          <InlineStat label="This month" value="$128 pledged" />
          <InlineStat label="Top amount" value="$10" />
          <InlineStat label="Supporters" value="19 mock donors" />
          <InlineStat label="Provider" value="Not connected" />
        </div>
      </section>
    </div>
  );
}

function DonationBox({ notify }: { notify: (message: string, tone?: Toast["tone"]) => void }) {
  const [amount, setAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState("");
  const [provider, setProvider] = useState("Payment link");
  const [note, setNote] = useState("Thanks for saving me tokens.");
  const resolvedAmount = customAmount ? Number(customAmount) : amount;
  const validAmount = Number.isFinite(resolvedAmount) && resolvedAmount > 0;

  return (
    <div className="rounded-md border border-line bg-white p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-copper dark:text-[#e6aa82]" />
            <p className="font-semibold">Send a little support</p>
          </div>
          <p className="mt-1 text-sm leading-6 text-ink/60 dark:text-white/55">
            Let users pick a small amount and hand off to your future donation provider.
          </p>
        </div>
        <span className="rounded bg-copper/10 px-2 py-1 text-xs font-semibold text-copper dark:text-[#e6aa82]">
          Mock only
        </span>
      </div>

      <div className="mt-4">
        <span className="field-label">Donation amount</span>
        <div className="grid grid-cols-4 gap-2">
          {[3, 5, 10, 25].map((preset) => (
            <button
              key={preset}
              className={classNames("btn-secondary justify-center", !customAmount && amount === preset && "border-ink bg-ink text-white dark:bg-white dark:text-ink")}
              onClick={() => {
                setAmount(preset);
                setCustomAmount("");
              }}
            >
              ${preset}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-3 block">
        <span className="field-label">Custom amount</span>
        <input
          className="field"
          inputMode="decimal"
          type="number"
          min="1"
          step="1"
          value={customAmount}
          onChange={(event) => setCustomAmount(event.target.value)}
          placeholder="Enter amount"
        />
      </label>

      <label className="mt-3 block">
        <span className="field-label">Donation provider</span>
        <select className="field" value={provider} onChange={(event) => setProvider(event.target.value)}>
          <option>Payment link</option>
          <option>Stripe Checkout</option>
          <option>PayPal</option>
          <option>Ko-fi</option>
          <option>Buy Me a Coffee</option>
        </select>
      </label>

      <label className="mt-3 block">
        <span className="field-label">Optional supporter note</span>
        <textarea
          className="min-h-24 w-full resize-y rounded-md border border-line bg-white p-3 text-sm leading-6 outline-none transition focus:border-marine focus:ring-4 focus:ring-marine/10 dark:border-white/10 dark:bg-[#101311]"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <button
        className="btn-primary mt-4 w-full justify-center"
        disabled={!validAmount}
        onClick={() => notify(`Donation intent prepared for ${currency.format(resolvedAmount)} via ${provider}.`, "info")}
      >
        <ExternalLink size={16} />
        Prepare donation
      </button>
      <p className="mt-3 text-xs leading-5 text-ink/50 dark:text-white/45">
        This does not process payments. Replace the click handler with your provider checkout URL or backend endpoint.
      </p>
    </div>
  );
}

function SettingsPanel({
  dark,
  setDark,
  notify
}: {
  dark: boolean;
  setDark: (dark: boolean) => void;
  notify: (message: string, tone?: Toast["tone"]) => void;
}) {
  const [defaultBudget, setDefaultBudget] = useState(1200);
  const [pricingPreset, setPricingPreset] = useState<ModelPricing>(pricingRows[1]);
  return (
    <div className="space-y-4">
      <section className="panel">
        <SectionHeader icon={Settings} title="Settings" action="Frontend-only controls" />
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <label>
            <span className="field-label">Model pricing preset</span>
            <select
              className="field"
              value={pricingPreset.id}
              onChange={(event) => setPricingPreset(pricingRows.find((row) => row.id === event.target.value) ?? pricingRows[0])}
            >
              {pricingRows.map((row) => <option key={row.id} value={row.id}>{row.model}</option>)}
            </select>
          </label>
          <label>
            <span className="field-label">Default output budget</span>
            <input className="field" type="number" value={defaultBudget} onChange={(event) => setDefaultBudget(Number(event.target.value))} />
          </label>
          <label className="flex items-end">
            <button className="btn-secondary h-10 w-full justify-center" onClick={() => setDark(!dark)}>
              <RefreshCw size={16} /> {dark ? "Light theme" : "Dark theme"}
            </button>
          </label>
        </div>
      </section>
      <section className="panel">
        <SectionHeader icon={DollarSign} title="Token Pricing Table" action="Mock values" />
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[620px] w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.08em] text-ink/50 dark:text-white/45">
              <tr>
                <th className="border-b border-line py-3 dark:border-white/10">Model</th>
                <th className="border-b border-line py-3 dark:border-white/10">Provider</th>
                <th className="border-b border-line py-3 dark:border-white/10">Input / 1M</th>
                <th className="border-b border-line py-3 dark:border-white/10">Output / 1M</th>
                <th className="border-b border-line py-3 dark:border-white/10">Preset</th>
              </tr>
            </thead>
            <tbody>
              {pricingRows.map((row) => (
                <tr key={row.id}>
                  <td className="border-b border-line py-3 dark:border-white/10">{row.model}</td>
                  <td className="border-b border-line py-3 dark:border-white/10">{row.provider}</td>
                  <td className="border-b border-line py-3 dark:border-white/10">{currency.format(row.inputPerMillion)}</td>
                  <td className="border-b border-line py-3 dark:border-white/10">{currency.format(row.outputPerMillion)}</td>
                  <td className="border-b border-line py-3 dark:border-white/10">{row.preset ? "Yes" : "Custom"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <SectionHeader icon={Heart} title="Donation Box" action="Optional module" />
        <div className="mt-4 max-w-xl">
          <DonationBox notify={notify} />
        </div>
      </section>
    </div>
  );
}

function InsightPanel({ result, isAnalyzing }: { result: AnalysisResult | null; isAnalyzing: boolean }) {
  return (
    <aside className="hidden bg-[#f2f0e9] p-4 dark:bg-[#121614] xl:block">
      <div className="sticky top-20 space-y-4">
        <section className="panel">
          <SectionHeader icon={PanelRightClose} title="Insight Panel" action={isAnalyzing ? "Working" : "Live"} />
          {isAnalyzing ? (
            <LoadingState title="Scoring bloat signals" compact />
          ) : result ? (
            <div className="mt-4 space-y-3">
              <InlineStat label="Estimated savings" value={currency.format(result.estimatedCostBefore - result.estimatedCostAfter)} />
              <InlineStat label="Input reduction" value={`${number.format(result.tokenEstimate.inputTokens - result.optimizedEstimate.inputTokens)} tokens`} />
              <InlineStat label="Risk score" value={`${result.riskScore}/100`} />
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-ink/60 dark:text-white/55">
              Run an analysis to populate waste, relevance, cost, and workflow recommendations.
            </p>
          )}
        </section>
        <section className="panel">
          <SectionHeader icon={Info} title="Backend Handoff Surface" action="Ready" />
          <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/65 dark:text-white/60">
            <li>Typed request and result interfaces</li>
            <li>Replaceable mock service functions</li>
            <li>Stateful UI without API dependency</li>
            <li>No keys, auth, database, billing, or model calls</li>
          </ul>
        </section>
      </div>
    </aside>
  );
}

function SectionHeader({ icon: Icon, title, action }: { icon: typeof Info; title: string; action?: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#ece8dd] text-ink dark:bg-white/10 dark:text-white">
          <Icon size={17} />
        </div>
        <h2 className="truncate text-base font-semibold">{title}</h2>
      </div>
      {action && <span className="shrink-0 rounded bg-white px-2 py-1 text-xs font-semibold text-ink/60 dark:bg-white/10 dark:text-white/55">{action}</span>}
    </div>
  );
}

function InlineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-white p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs text-ink/50 dark:text-white/45">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}

function InfoList({ title, icon, items }: { title: string; icon: typeof Check; items: string[] }) {
  return (
    <section className="panel">
      <SectionHeader icon={icon} title={title} />
      <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/65 dark:text-white/60">
        {items.map((item) => <li key={item} className="rounded-md border border-line bg-white p-3 dark:border-white/10 dark:bg-white/5">{item}</li>)}
      </ul>
    </section>
  );
}

function EmptyState({ icon: Icon, title, detail }: { icon: typeof Info; title: string; detail: string }) {
  return (
    <section className="panel flex min-h-56 flex-col items-center justify-center text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#ece8dd] dark:bg-white/10">
        <Icon size={20} />
      </div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-ink/60 dark:text-white/55">{detail}</p>
    </section>
  );
}

function LoadingState({ title, compact = false }: { title: string; compact?: boolean }) {
  return (
    <section className={classNames("panel flex items-center gap-3", compact ? "p-0 shadow-none" : "min-h-56 justify-center")}>
      <Loader2 className="animate-spin text-marine" size={22} />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-ink/50 dark:text-white/45">Checking duplication, relevance, cost, and output budget.</p>
      </div>
    </section>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    low: "bg-moss/10 text-moss dark:text-[#b9d5b4]",
    medium: "bg-signal/15 text-[#8a5a16] dark:text-[#f4c177]",
    high: "bg-copper/15 text-copper dark:text-[#e6aa82]",
    critical: "bg-[#8f3232]/15 text-[#8f3232] dark:text-[#ffabab]"
  };
  return <span className={classNames("rounded px-2 py-1 text-xs font-semibold capitalize", map[severity])}>{severity}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    relevant: "bg-moss/10 text-moss dark:text-[#b9d5b4]",
    uncertain: "bg-signal/15 text-[#8a5a16] dark:text-[#f4c177]",
    removable: "bg-copper/15 text-copper dark:text-[#e6aa82]"
  };
  return <span className={classNames("rounded px-2 py-1 text-xs font-semibold capitalize", map[status])}>{status}</span>;
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="flex items-center gap-2 rounded-md border border-line bg-white px-4 py-3 text-sm shadow-soft dark:border-white/10 dark:bg-[#202521]">
          {toast.tone === "success" ? <Check className="text-moss" size={16} /> : <Info className="text-marine" size={16} />}
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default App;
