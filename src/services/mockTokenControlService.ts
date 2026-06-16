import {
  AnalysisRequest,
  AnalysisResult,
  CompressionResult,
  CompressionStrength,
  ExecutionPlanStep,
  ModelPricing,
  RelevanceSection,
  SavedRun,
  TokenEstimate,
  WasteFinding
} from "../types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sampleInput = `You are an expert AI assistant. Please carefully read everything below. We are launching a new onboarding campaign for agency clients. The same campaign notes appear several times in old meeting logs. Focus on conversion lift, pricing objections, support handoff, and implementation blockers.

Meeting log A: client wants faster setup, fewer repeated forms, and proof that AI output will stay on brand. Include three examples of old landing copy, two repeated transcripts, and a long brainstorm list.

Meeting log B: client wants faster setup, fewer repeated forms, and proof that AI output will stay on brand. The final task is to produce a short strategic brief for leadership with risks, recommended workflow, and a revised prompt.`;

const optimizedPrompt = `Create a concise strategic brief for leadership about the agency-client onboarding campaign.

Use these facts:
- Clients want faster setup and fewer repeated forms.
- Pricing objections center on implementation effort and support handoff.
- Brand consistency is a key buying concern.
- The desired output is a leadership-ready brief with risks, workflow recommendations, and a revised prompt.

Exclude repeated meeting notes, duplicate transcripts, and examples that do not affect the campaign decision.`;

const baseFindings: WasteFinding[] = [
  {
    id: "wf-1",
    category: "repeated context",
    severity: "critical",
    tokensWasted: 1480,
    summary: "The same client requirements appear across several meeting notes.",
    recommendation: "Deduplicate recurring requirements into a single canonical fact list."
  },
  {
    id: "wf-2",
    category: "irrelevant content",
    severity: "high",
    tokensWasted: 920,
    summary: "Historical brainstorm items are present but do not support the requested brief.",
    recommendation: "Move archival material behind retrieval and include only selected chunks."
  },
  {
    id: "wf-3",
    category: "verbose instructions",
    severity: "medium",
    tokensWasted: 460,
    summary: "Instruction phrasing repeats cautionary language without changing the task.",
    recommendation: "Replace broad meta-instructions with direct output requirements."
  },
  {
    id: "wf-4",
    category: "duplicated files/logs",
    severity: "high",
    tokensWasted: 760,
    summary: "Two transcript excerpts contain overlapping implementation concerns.",
    recommendation: "Keep the highest-signal transcript and summarize the duplicate."
  },
  {
    id: "wf-5",
    category: "unclear task objective",
    severity: "medium",
    tokensWasted: 310,
    summary: "The goal appears after supporting material, making the model infer priority.",
    recommendation: "Place the task goal first and make the desired format explicit."
  },
  {
    id: "wf-6",
    category: "unnecessary examples",
    severity: "low",
    tokensWasted: 210,
    summary: "Legacy copy examples are not needed for a strategic brief.",
    recommendation: "Reference example availability instead of embedding all examples."
  },
  {
    id: "wf-7",
    category: "hidden prompt bloat",
    severity: "medium",
    tokensWasted: 390,
    summary: "Formatting scaffolds and repeated role text consume tokens without improving quality.",
    recommendation: "Use one role line and a compact constraints block."
  }
];

const relevanceSections: RelevanceSection[] = [
  {
    id: "rs-1",
    title: "Task objective",
    excerpt: "Produce a short strategic brief for leadership with risks, workflow, and a revised prompt.",
    status: "relevant",
    tokenCount: 136,
    selected: true,
    reason: "Directly defines the deliverable and audience."
  },
  {
    id: "rs-2",
    title: "Repeated client requirements",
    excerpt: "Faster setup, fewer repeated forms, proof that AI output will stay on brand.",
    status: "relevant",
    tokenCount: 284,
    selected: true,
    reason: "High-signal customer requirements, but should be represented once."
  },
  {
    id: "rs-3",
    title: "Old landing copy examples",
    excerpt: "Three archived landing page variants with overlapping positioning language.",
    status: "uncertain",
    tokenCount: 620,
    selected: false,
    reason: "May help tone, but not required for the stated strategy brief."
  },
  {
    id: "rs-4",
    title: "Duplicate transcripts",
    excerpt: "Two repeated transcript excerpts covering support handoff and onboarding steps.",
    status: "removable",
    tokenCount: 1120,
    selected: false,
    reason: "Contains duplicated facts already captured in the preserved list."
  },
  {
    id: "rs-5",
    title: "Implementation blockers",
    excerpt: "Pricing objections, support handoff, setup speed, and form repetition.",
    status: "relevant",
    tokenCount: 410,
    selected: true,
    reason: "Critical to risk and workflow recommendations."
  }
];

const executionPlan: ExecutionPlanStep[] = [
  {
    id: "ep-1",
    title: "Summarize first",
    description: "Convert long source notes into a 600-token fact brief before reasoning.",
    modelTier: "cheap",
    estimatedTokens: 900,
    savingsPercent: 34
  },
  {
    id: "ep-2",
    title: "Retrieve relevant chunks only",
    description: "Select sections tied to the leadership brief and omit archival examples.",
    modelTier: "standard",
    estimatedTokens: 1400,
    savingsPercent: 41
  },
  {
    id: "ep-3",
    title: "Use cheaper model for extraction",
    description: "Extract objections, blockers, and requirements with a lower-cost model.",
    modelTier: "cheap",
    estimatedTokens: 1100,
    savingsPercent: 29
  },
  {
    id: "ep-4",
    title: "Use premium model for final reasoning",
    description: "Send only the compact brief and output requirements to the premium model.",
    modelTier: "premium",
    estimatedTokens: 1750,
    savingsPercent: 46
  },
  {
    id: "ep-5",
    title: "Cache repeated context",
    description: "Store persistent brand and client requirements as reusable context.",
    modelTier: "standard",
    estimatedTokens: 520,
    savingsPercent: 18
  }
];

export const pricingRows: ModelPricing[] = [
  { id: "p-1", model: "GPT-4.1", provider: "GPT", inputPerMillion: 2.0, outputPerMillion: 8.0, preset: true },
  { id: "p-2", model: "Claude Sonnet", provider: "Claude", inputPerMillion: 3.0, outputPerMillion: 15.0, preset: true },
  { id: "p-3", model: "Gemini Pro", provider: "Gemini", inputPerMillion: 1.25, outputPerMillion: 5.0, preset: true },
  { id: "p-4", model: "Llama hosted", provider: "Llama", inputPerMillion: 0.45, outputPerMillion: 0.95, preset: true },
  { id: "p-5", model: "Custom blended", provider: "Custom", inputPerMillion: 1.1, outputPerMillion: 3.4, preset: false }
];

export async function analyzeInput(request: AnalysisRequest): Promise<AnalysisResult> {
  await wait(900);
  const assetTokens = request.assets.reduce((sum, asset) => sum + asset.estimatedTokens, 0);
  const inputTokens = Math.max(2850, Math.round(request.input.length / 3.6) + assetTokens);
  const optimizedTokens = Math.round(inputTokens * 0.43);
  const before: TokenEstimate = {
    inputTokens,
    outputBudgetTokens: request.outputBudgetTokens,
    totalTokens: inputTokens + request.outputBudgetTokens,
    model: request.targetModel
  };
  const after: TokenEstimate = {
    inputTokens: optimizedTokens,
    outputBudgetTokens: Math.round(request.outputBudgetTokens * 0.72),
    totalTokens: optimizedTokens + Math.round(request.outputBudgetTokens * 0.72),
    model: request.targetModel
  };

  const compression = await compressContext({ ...request, input: request.input || sampleInput });

  return {
    id: "run-live-001",
    createdAt: new Date().toISOString(),
    request,
    tokenEstimate: before,
    optimizedEstimate: after,
    wasteFindings: baseFindings,
    compression,
    relevanceSections: await filterRelevance(request),
    executionPlan: await generateExecutionPlan(request),
    estimatedCostBefore: 0.083,
    estimatedCostAfter: 0.034,
    savingsPercent: 59,
    riskScore: 67,
    optimizedPrompt
  };
}

export async function compressContext(request: AnalysisRequest & { strength?: CompressionStrength }): Promise<CompressionResult> {
  await wait(300);
  const strength = request.strength ?? "Balanced";
  const ratio = strength === "Light" ? 0.72 : strength === "Aggressive" ? 0.34 : 0.43;
  const assetTokens = request.assets.reduce((sum, asset) => sum + asset.estimatedTokens, 0);
  const originalTokens = Math.max(2850, Math.round((request.input || sampleInput).length / 3.6) + assetTokens);
  const assetSummary =
    request.assets.length > 0
      ? `\n\nAttached assets queued for extraction:\n${request.assets
          .map((asset) => `- ${asset.name} (${asset.kind}, ~${asset.estimatedTokens} tokens)`)
          .join("\n")}`
      : "";
  return {
    originalText: `${request.input || sampleInput}${assetSummary}`,
    optimizedText: optimizedPrompt,
    originalTokens,
    optimizedTokens: Math.round(originalTokens * ratio),
    compressionRatio: Math.round((1 - ratio) * 100),
    removedSections: [
      "Duplicate transcript blocks from meeting log B",
      "Legacy landing copy examples unrelated to leadership brief",
      "Repeated role instructions and broad cautionary language"
    ],
    preservedFacts: [
      "Clients want faster setup",
      "Repeated forms are a major objection",
      "Brand consistency must be protected",
      "Leadership wants risks, workflow, and a revised prompt",
      ...(request.assets.length > 0 ? ["Uploaded images and documents are treated as extraction inputs"] : [])
    ],
    warnings:
      strength === "Aggressive"
        ? ["Aggressive compression may remove tone examples and edge-case objections."]
        : [
            "Review uncertain sections before sending to a high-stakes model.",
            ...(request.assets.some((asset) => asset.kind === "image")
              ? ["Image token estimates are placeholders until OCR or vision extraction is wired."]
              : [])
          ]
  };
}

export async function filterRelevance(_request: AnalysisRequest): Promise<RelevanceSection[]> {
  await wait(250);
  return relevanceSections.map((section) => ({ ...section }));
}

export async function generateExecutionPlan(_request: AnalysisRequest): Promise<ExecutionPlanStep[]> {
  await wait(250);
  return executionPlan.map((step) => ({ ...step }));
}

export async function getSavedRuns(): Promise<SavedRun[]> {
  await wait(250);
  return [
    {
      id: "sr-101",
      name: "Agency onboarding brief",
      createdAt: "2026-06-16T08:20:00.000Z",
      mode: "Document",
      model: "Claude",
      tags: ["agency", "strategy"],
      originalTokens: 12840,
      optimizedTokens: 5120,
      savingsPercent: 60,
      status: "saved"
    },
    {
      id: "sr-102",
      name: "Cursor refactor context",
      createdAt: "2026-06-15T17:42:00.000Z",
      mode: "Code Task",
      model: "GPT",
      tags: ["engineering", "cursor"],
      originalTokens: 21600,
      optimizedTokens: 9400,
      savingsPercent: 56,
      status: "exported"
    },
    {
      id: "sr-103",
      name: "Support chat cleanup",
      createdAt: "2026-06-14T11:12:00.000Z",
      mode: "Chat Log",
      model: "Gemini",
      tags: ["support", "ops"],
      originalTokens: 9300,
      optimizedTokens: 4100,
      savingsPercent: 55,
      status: "review"
    }
  ];
}

export { sampleInput, optimizedPrompt };
