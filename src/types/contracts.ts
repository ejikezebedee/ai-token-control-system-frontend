export type ViewId =
  | "dashboard"
  | "analyzer"
  | "compressor"
  | "relevance"
  | "planner"
  | "library"
  | "donation"
  | "settings";

export type AnalysisMode = "Prompt" | "Chat Log" | "Document" | "Code Task" | "API Payload";
export type TargetModel = "GPT" | "Claude" | "Gemini" | "Llama" | "Custom";
export type Severity = "low" | "medium" | "high" | "critical";
export type RelevanceStatus = "relevant" | "uncertain" | "removable";
export type CompressionStrength = "Light" | "Balanced" | "Aggressive";

export interface AnalysisRequest {
  input: string;
  mode: AnalysisMode;
  targetModel: TargetModel;
  taskGoal: string;
  outputBudget: number;
}

export interface TokenEstimate {
  inputTokens: number;
  outputBudget: number;
  totalEstimated: number;
  optimizedInputTokens: number;
  savedTokens: number;
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
  description: string;
  recommendation: string;
}

export interface CompressionResult {
  beforeText: string;
  afterText: string;
  removedSections: string[];
  preservedFacts: string[];
  compressionRatio: number;
  warnings: string[];
}

export interface RelevanceSection {
  id: string;
  title: string;
  status: RelevanceStatus;
  tokens: number;
  selected: boolean;
  reason: string;
}

export interface ExecutionPlanStep {
  id: string;
  title: string;
  description: string;
  estimatedSavings: number;
  modelTier: "cheap" | "balanced" | "premium";
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  request: AnalysisRequest;
  estimate: TokenEstimate;
  findings: WasteFinding[];
  compression: CompressionResult;
  relevance: RelevanceSection[];
  executionPlan: ExecutionPlanStep[];
  estimatedCostBefore: number;
  estimatedCostAfter: number;
  monthlySavingsProjection: number;
  optimizedPrompt: string;
}

export interface SavedRun {
  id: string;
  name: string;
  mode: AnalysisMode;
  model: TargetModel;
  originalTokens: number;
  optimizedTokens: number;
  savingsPercent: number;
  tags: string[];
  createdAt: string;
}

export interface ModelPricing {
  id: string;
  provider: TargetModel;
  modelName: string;
  inputPerMillion: number;
  outputPerMillion: number;
  selected?: boolean;
}
