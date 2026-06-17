import type {
  AnalysisRequest,
  AnalysisResult,
  CompressionResult,
  ExecutionPlanStep,
  ModelPricing,
  RelevanceSection,
  SavedRun,
  WasteFinding
} from "../types/contracts";

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const countTokens = (value: string) => Math.max(96, Math.round(value.trim().split(/\s+/).filter(Boolean).length * 1.34));

const sampleOptimizedPrompt =
  "Review the provided product onboarding notes and produce a concise implementation plan. Preserve user roles, constraints, security requirements, and launch blockers. Ignore duplicated meeting logs and summarize only decisions that affect the next engineering sprint.";

export async function analyzeInput(request: AnalysisRequest): Promise<AnalysisResult> {
  await delay(760);
  const inputTokens = countTokens(request.input) + (request.mode === "API Payload" ? 420 : 0);
  const savedTokens = Math.round(inputTokens * 0.43);
  const optimizedInputTokens = inputTokens - savedTokens;
  const findings: WasteFinding[] = [
    {
      id: "wf-1",
      category: "repeated context",
      severity: "high",
      tokensWasted: Math.round(savedTokens * 0.24),
      description: "Multiple sections restate product goals and audience requirements.",
      recommendation: "Keep the strongest statement and replace repeats with a single reference."
    },
    {
      id: "wf-2",
      category: "irrelevant content",
      severity: "medium",
      tokensWasted: Math.round(savedTokens * 0.18),
      description: "Background notes do not affect the requested output format.",
      recommendation: "Move background material to archive context unless the model needs it for reasoning."
    },
    {
      id: "wf-3",
      category: "verbose instructions",
      severity: "high",
      tokensWasted: Math.round(savedTokens * 0.2),
      description: "Instruction blocks contain overlapping phrasing and redundant quality language.",
      recommendation: "Collapse style guidance into short acceptance criteria."
    },
    {
      id: "wf-4",
      category: "duplicated files/logs",
      severity: "critical",
      tokensWasted: Math.round(savedTokens * 0.16),
      description: "Two log excerpts appear to contain the same stack trace with different timestamps.",
      recommendation: "Keep the latest failure and remove duplicate traces."
    },
    {
      id: "wf-5",
      category: "unclear task objective",
      severity: "medium",
      tokensWasted: Math.round(savedTokens * 0.1),
      description: "The target outcome is implied but not stated as a clear deliverable.",
      recommendation: "Add a one-sentence task goal before context."
    },
    {
      id: "wf-6",
      category: "unnecessary examples",
      severity: "low",
      tokensWasted: Math.round(savedTokens * 0.07),
      description: "Several examples duplicate the same formatting pattern.",
      recommendation: "Keep one canonical example and remove the rest."
    },
    {
      id: "wf-7",
      category: "hidden prompt bloat",
      severity: "medium",
      tokensWasted: Math.round(savedTokens * 0.05),
      description: "System-style reminders add length without changing the desired answer.",
      recommendation: "Move evergreen policy reminders into reusable preset instructions."
    }
  ];

  const compression: CompressionResult = {
    beforeText: request.input || "Paste prompt, document, chat log, code task, or API payload here.",
    afterText: sampleOptimizedPrompt,
    removedSections: [
      "Repeated audience paragraph",
      "Duplicate stack trace excerpt",
      "Third formatting example",
      "Low relevance background notes"
    ],
    preservedFacts: [
      "Primary task goal",
      "Required output format",
      "Security constraints",
      "Launch blockers and dependencies",
      "Critical code or document references"
    ],
    compressionRatio: 43,
    warnings: [
      "Aggressive compression may remove nuance from stakeholder feedback.",
      "Keep exact legal, medical, or compliance wording when present."
    ]
  };

  const relevance: RelevanceSection[] = [
    { id: "rs-1", title: "Task objective", status: "relevant", tokens: 126, selected: true, reason: "Directly defines the expected output." },
    { id: "rs-2", title: "Audience notes", status: "relevant", tokens: 214, selected: true, reason: "Guides tone and scope." },
    { id: "rs-3", title: "Meeting transcript", status: "uncertain", tokens: 590, selected: true, reason: "Some decisions are useful, but much of the transcript is chatter." },
    { id: "rs-4", title: "Duplicate logs", status: "removable", tokens: 840, selected: false, reason: "Repeated diagnostic data already appears elsewhere." },
    { id: "rs-5", title: "Legacy examples", status: "removable", tokens: 360, selected: false, reason: "Examples duplicate the same output pattern." }
  ];

  const executionPlan: ExecutionPlanStep[] = [
    { id: "ep-1", title: "Summarize first", description: "Run a short extraction pass to produce stable project facts before final reasoning.", estimatedSavings: 18, modelTier: "cheap" },
    { id: "ep-2", title: "Retrieve relevant chunks only", description: "Send only sections marked relevant or manually kept by the user.", estimatedSavings: 24, modelTier: "balanced" },
    { id: "ep-3", title: "Use cheaper model for extraction", description: "Extract dates, entities, and repeated requirements with a lower-cost model.", estimatedSavings: 13, modelTier: "cheap" },
    { id: "ep-4", title: "Use premium model for final reasoning", description: "Reserve the stronger model for synthesis after context is trimmed.", estimatedSavings: 21, modelTier: "premium" },
    { id: "ep-5", title: "Cache repeated context", description: "Persist stable team, product, and style context outside each prompt run.", estimatedSavings: 17, modelTier: "balanced" }
  ];

  const estimatedCostBefore = Number(((inputTokens + request.outputBudget) * 0.0000068).toFixed(4));
  const estimatedCostAfter = Number(((optimizedInputTokens + request.outputBudget) * 0.0000041).toFixed(4));

  return {
    id: `run-${Date.now()}`,
    createdAt: new Date().toISOString(),
    request,
    estimate: {
      inputTokens,
      outputBudget: request.outputBudget,
      totalEstimated: inputTokens + request.outputBudget,
      optimizedInputTokens,
      savedTokens
    },
    findings,
    compression,
    relevance,
    executionPlan,
    estimatedCostBefore,
    estimatedCostAfter,
    monthlySavingsProjection: Number(((estimatedCostBefore - estimatedCostAfter) * 420).toFixed(2)),
    optimizedPrompt: sampleOptimizedPrompt
  };
}

export async function compressContext(request: AnalysisRequest): Promise<CompressionResult> {
  const result = await analyzeInput(request);
  return result.compression;
}

export async function filterRelevance(request: AnalysisRequest): Promise<RelevanceSection[]> {
  const result = await analyzeInput(request);
  return result.relevance;
}

export async function generateExecutionPlan(request: AnalysisRequest): Promise<ExecutionPlanStep[]> {
  const result = await analyzeInput(request);
  return result.executionPlan;
}

export async function getSavedRuns(): Promise<SavedRun[]> {
  await delay(220);
  return [
    { id: "sr-1", name: "Agency proposal cleanup", mode: "Document", model: "Claude", originalTokens: 18420, optimizedTokens: 10330, savingsPercent: 44, tags: ["agency", "proposal"], createdAt: "2026-06-17T08:40:00Z" },
    { id: "sr-2", name: "Cursor bug task context", mode: "Code Task", model: "GPT", originalTokens: 12980, optimizedTokens: 7820, savingsPercent: 40, tags: ["dev", "debug"], createdAt: "2026-06-16T17:12:00Z" },
    { id: "sr-3", name: "ChatGPT research prompt", mode: "Prompt", model: "Gemini", originalTokens: 6210, optimizedTokens: 4010, savingsPercent: 35, tags: ["research"], createdAt: "2026-06-15T11:22:00Z" },
    { id: "sr-4", name: "API batch summarizer", mode: "API Payload", model: "Llama", originalTokens: 48500, optimizedTokens: 29200, savingsPercent: 40, tags: ["api", "batch"], createdAt: "2026-06-14T19:03:00Z" }
  ];
}

export const pricingPresets: ModelPricing[] = [
  { id: "mp-1", provider: "GPT", modelName: "GPT flagship mock", inputPerMillion: 5, outputPerMillion: 15, selected: true },
  { id: "mp-2", provider: "Claude", modelName: "Claude reasoning mock", inputPerMillion: 3, outputPerMillion: 15 },
  { id: "mp-3", provider: "Gemini", modelName: "Gemini pro mock", inputPerMillion: 1.25, outputPerMillion: 10 },
  { id: "mp-4", provider: "Llama", modelName: "Hosted Llama mock", inputPerMillion: 0.45, outputPerMillion: 0.9 },
  { id: "mp-5", provider: "Custom", modelName: "Custom provider", inputPerMillion: 2, outputPerMillion: 6 }
];
