export type AppView =
  | "dashboard"
  | "analyzer"
  | "compressor"
  | "relevance"
  | "planner"
  | "library"
  | "support"
  | "settings";

export type AnalysisMode = "Prompt" | "Chat Log" | "Document" | "Code Task" | "API Payload";
export type TargetModel = "GPT" | "Claude" | "Gemini" | "Llama" | "Custom";
export type Severity = "low" | "medium" | "high" | "critical";
export type CompressionStrength = "Light" | "Balanced" | "Aggressive";
export type RelevanceStatus = "relevant" | "uncertain" | "removable";
export type UploadedAssetKind = "document" | "image";

export interface UploadedAsset {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: UploadedAssetKind;
  estimatedTokens: number;
  status: "ready" | "needs extraction" | "unsupported";
  previewUrl?: string;
}

export interface AnalysisRequest {
  input: string;
  mode: AnalysisMode;
  targetModel: TargetModel;
  taskGoal: string;
  outputBudgetTokens: number;
  assets: UploadedAsset[];
}

export interface TokenEstimate {
  inputTokens: number;
  outputBudgetTokens: number;
  totalTokens: number;
  model: TargetModel;
}

export interface WasteFinding {
  id: string;
  category:
    | "repeated context"
    | "irrelevant content"
    | "verbose instructions"
    | "duplicated files/logs"
    | "unclear task objective"
    | "unnecessary examples"
    | "hidden prompt bloat";
  severity: Severity;
  tokensWasted: number;
  summary: string;
  recommendation: string;
}

export interface CompressionResult {
  originalText: string;
  optimizedText: string;
  originalTokens: number;
  optimizedTokens: number;
  compressionRatio: number;
  removedSections: string[];
  preservedFacts: string[];
  warnings: string[];
}

export interface RelevanceSection {
  id: string;
  title: string;
  excerpt: string;
  status: RelevanceStatus;
  tokenCount: number;
  selected: boolean;
  reason: string;
}

export interface ExecutionPlanStep {
  id: string;
  title: string;
  description: string;
  modelTier: "cheap" | "standard" | "premium";
  estimatedTokens: number;
  savingsPercent: number;
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  request: AnalysisRequest;
  tokenEstimate: TokenEstimate;
  optimizedEstimate: TokenEstimate;
  wasteFindings: WasteFinding[];
  compression: CompressionResult;
  relevanceSections: RelevanceSection[];
  executionPlan: ExecutionPlanStep[];
  estimatedCostBefore: number;
  estimatedCostAfter: number;
  savingsPercent: number;
  riskScore: number;
  optimizedPrompt: string;
}

export interface SavedRun {
  id: string;
  name: string;
  createdAt: string;
  mode: AnalysisMode;
  model: TargetModel;
  tags: string[];
  originalTokens: number;
  optimizedTokens: number;
  savingsPercent: number;
  status: "saved" | "review" | "exported";
}

export interface ModelPricing {
  id: string;
  model: string;
  provider: TargetModel;
  inputPerMillion: number;
  outputPerMillion: number;
  preset: boolean;
}
