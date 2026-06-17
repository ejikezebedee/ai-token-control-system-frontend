import type {
  AnalysisRequest,
  AnalysisResult,
  CompressionResult,
  ExecutionPlanStep,
  ModelPricing,
  RelevanceSection,
  SavedRun
} from "../types/contracts";

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

const demoDelay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function countTokens(value: string) {
  return Math.max(96, Math.round(value.trim().split(/\s+/).filter(Boolean).length * 1.34));
}

async function requestApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { "content-type": "application/json", ...(options?.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Backend request failed.");
  }
  return payload.data as T;
}

function buildDemoAnalysis(request: AnalysisRequest): AnalysisResult {
  const inputTokens = countTokens(request.input) + (request.mode === "API Payload" ? 420 : 0);
  const savedTokens = Math.round(inputTokens * 0.38);
  const optimizedInputTokens = inputTokens - savedTokens;
  const optimizedPrompt = [
    `Goal: ${request.taskGoal || "Complete the requested task with concise context."}`,
    `Mode: ${request.mode}`,
    "Preserve constraints, blockers, output format, security requirements, exact errors, and critical references.",
    "Remove duplicate logs, repeated explanations, unnecessary examples, and low-relevance background notes.",
    "",
    request.input
  ].join("\n");

  return {
    id: `demo-${Date.now()}`,
    createdAt: new Date().toISOString(),
    request,
    estimate: {
      inputTokens,
      outputBudget: request.outputBudget,
      totalEstimated: inputTokens + request.outputBudget,
      optimizedInputTokens,
      savedTokens
    },
    findings: [
      {
        id: "wf-1",
        category: "repeated context",
        severity: "high",
        tokensWasted: Math.round(savedTokens * 0.24),
        description: "Repeated goals, logs, or instructions increase context size.",
        recommendation: "Keep the strongest version and remove duplicates."
      },
      {
        id: "wf-2",
        category: "verbose instructions",
        severity: "medium",
        tokensWasted: Math.round(savedTokens * 0.2),
        description: "Instruction blocks can be collapsed into acceptance criteria.",
        recommendation: "Keep short, testable requirements."
      },
      {
        id: "wf-3",
        category: "hidden prompt bloat",
        severity: "medium",
        tokensWasted: Math.round(savedTokens * 0.14),
        description: "Reusable reminders are better stored as presets.",
        recommendation: "Send only task-specific rules to the model."
      }
    ],
    compression: {
      beforeText: request.input,
      afterText: optimizedPrompt,
      removedSections: ["Duplicate lines", "Low-relevance background", "Repeated formatting examples"],
      preservedFacts: ["Task goal", "Security constraints", "Required output format", "Exact errors"],
      compressionRatio: Math.round((savedTokens / inputTokens) * 100),
      warnings: ["Fallback demo analysis is active until the backend is reachable."]
    },
    relevance: [
      { id: "rs-1", title: "Task objective", status: "relevant", tokens: 126, selected: true, reason: "Defines the expected output." },
      { id: "rs-2", title: "Context body", status: "uncertain", tokens: inputTokens, selected: true, reason: "Review for task relevance before sending." },
      { id: "rs-3", title: "Duplicates and examples", status: "removable", tokens: Math.round(savedTokens * 0.6), selected: false, reason: "Likely safe to remove." }
    ],
    executionPlan: [
      { id: "ep-1", title: "Summarize first", description: "Extract stable facts before final reasoning.", estimatedSavings: 18, modelTier: "cheap" },
      { id: "ep-2", title: "Retrieve relevant chunks only", description: "Send only kept sections to the final model.", estimatedSavings: 24, modelTier: "balanced" },
      { id: "ep-3", title: "Cache repeated context", description: "Move stable product context out of every run.", estimatedSavings: 17, modelTier: "balanced" }
    ],
    estimatedCostBefore: Number(((inputTokens + request.outputBudget) * 0.0000068).toFixed(4)),
    estimatedCostAfter: Number(((optimizedInputTokens + request.outputBudget) * 0.0000041).toFixed(4)),
    monthlySavingsProjection: Number((savedTokens * 0.0021).toFixed(2)),
    optimizedPrompt
  };
}

export async function analyzeInput(request: AnalysisRequest): Promise<AnalysisResult> {
  try {
    return await requestApi<AnalysisResult>("/api/analysis", { method: "POST", body: JSON.stringify(request) });
  } catch {
    await demoDelay(320);
    return buildDemoAnalysis(request);
  }
}

export async function compressContext(request: AnalysisRequest): Promise<CompressionResult> {
  try {
    return await requestApi<CompressionResult>("/api/compression", { method: "POST", body: JSON.stringify(request) });
  } catch {
    return buildDemoAnalysis(request).compression;
  }
}

export async function filterRelevance(request: AnalysisRequest): Promise<RelevanceSection[]> {
  try {
    return await requestApi<RelevanceSection[]>("/api/relevance", { method: "POST", body: JSON.stringify(request) });
  } catch {
    return buildDemoAnalysis(request).relevance;
  }
}

export async function generateExecutionPlan(request: AnalysisRequest): Promise<ExecutionPlanStep[]> {
  try {
    const result = await requestApi<{ steps: ExecutionPlanStep[] }>("/api/execution-plan", { method: "POST", body: JSON.stringify(request) });
    return result.steps;
  } catch {
    return buildDemoAnalysis(request).executionPlan;
  }
}

export async function getSavedRuns(): Promise<SavedRun[]> {
  try {
    return await requestApi<SavedRun[]>("/api/saved-runs");
  } catch {
    await demoDelay(160);
    return [
      { id: "sr-1", name: "Agency proposal cleanup", mode: "Document", model: "Claude", originalTokens: 18420, optimizedTokens: 10330, savingsPercent: 44, tags: ["agency", "proposal"], createdAt: "2026-06-17T08:40:00Z" },
      { id: "sr-2", name: "Cursor bug task context", mode: "Code Task", model: "GPT", originalTokens: 12980, optimizedTokens: 7820, savingsPercent: 40, tags: ["dev", "debug"], createdAt: "2026-06-16T17:12:00Z" },
      { id: "sr-3", name: "ChatGPT research prompt", mode: "Prompt", model: "Gemini", originalTokens: 6210, optimizedTokens: 4010, savingsPercent: 35, tags: ["research"], createdAt: "2026-06-15T11:22:00Z" }
    ];
  }
}

export async function saveRun(result: AnalysisResult): Promise<SavedRun> {
  return requestApi<SavedRun>("/api/saved-runs", { method: "POST", body: JSON.stringify(result) });
}

export async function getModelPricing(): Promise<ModelPricing[]> {
  try {
    return await requestApi<ModelPricing[]>("/api/settings/model-pricing");
  } catch {
    return pricingPresets;
  }
}

export async function createDonationSession(amount: number, provider: "stripe"): Promise<{ url: string }> {
  return requestApi<{ url: string }>("/api/donations/session", {
    method: "POST",
    body: JSON.stringify({ amount, provider })
  });
}

export const pricingPresets: ModelPricing[] = [
  { id: "mp-1", provider: "GPT", modelName: "GPT flagship", inputPerMillion: 5, outputPerMillion: 15, selected: true },
  { id: "mp-2", provider: "Claude", modelName: "Claude reasoning", inputPerMillion: 3, outputPerMillion: 15 },
  { id: "mp-3", provider: "Gemini", modelName: "Gemini pro", inputPerMillion: 1.25, outputPerMillion: 10 },
  { id: "mp-4", provider: "Llama", modelName: "Hosted Llama", inputPerMillion: 0.45, outputPerMillion: 0.9 },
  { id: "mp-5", provider: "Custom", modelName: "Custom provider", inputPerMillion: 2, outputPerMillion: 6 }
];
