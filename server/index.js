import { createServer } from "node:http";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const dataDir = join(rootDir, "server", "data");
const distDir = join(rootDir, "dist");
const port = Number(process.env.PORT || 8787);
const maxBodyBytes = Number(process.env.MAX_REQUEST_BYTES || 250_000);

const pricingPresets = [
  { id: "mp-1", provider: "GPT", modelName: "GPT flagship", inputPerMillion: 5, outputPerMillion: 15, selected: true },
  { id: "mp-2", provider: "Claude", modelName: "Claude reasoning", inputPerMillion: 3, outputPerMillion: 15 },
  { id: "mp-3", provider: "Gemini", modelName: "Gemini pro", inputPerMillion: 1.25, outputPerMillion: 10 },
  { id: "mp-4", provider: "Llama", modelName: "Hosted Llama", inputPerMillion: 0.45, outputPerMillion: 0.9 },
  { id: "mp-5", provider: "Custom", modelName: "Custom provider", inputPerMillion: 2, outputPerMillion: 6 }
];

const defaultSettings = {
  compressionStrength: "Balanced",
  outputBudget: 1024,
  selectedPricingPreset: "mp-1"
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function requestId() {
  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function json(res, status, payload, id) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-request-id": id
  });
  res.end(JSON.stringify({ ...payload, requestId: id }));
}

function parseWords(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean);
}

function estimateTokens(value, mode = "Prompt") {
  const base = Math.max(96, Math.round(parseWords(value).length * 1.34));
  const modeOverhead = mode === "API Payload" ? 420 : mode === "Code Task" ? 180 : mode === "Chat Log" ? 140 : 0;
  return base + modeOverhead;
}

function severityFor(tokens, inputTokens) {
  const ratio = tokens / Math.max(inputTokens, 1);
  if (ratio > 0.18) return "critical";
  if (ratio > 0.1) return "high";
  if (ratio > 0.04) return "medium";
  return "low";
}

function uniqueLines(input) {
  const seen = new Set();
  const removed = [];
  const kept = [];

  for (const line of String(input || "").split(/\r?\n/)) {
    const key = line.trim().toLowerCase();
    if (key.length > 20 && seen.has(key)) {
      removed.push(line.trim());
      continue;
    }
    if (key) seen.add(key);
    kept.push(line);
  }

  return { text: kept.join("\n").trim(), removed };
}

function buildOptimizedPrompt(request) {
  const deduped = uniqueLines(request.input);
  const goal = request.taskGoal?.trim() || "Complete the requested task with concise, relevant context.";
  const mode = request.mode || "Prompt";
  const body = deduped.text || request.input || "No input provided.";

  return [
    `Goal: ${goal}`,
    `Input mode: ${mode}`,
    "Use only context that affects the requested output.",
    "Preserve constraints, security requirements, required output format, blockers, exact errors, dates, names, and code references.",
    "Ignore duplicated logs, repeated explanations, low-relevance background notes, and unnecessary examples unless they change the answer.",
    "",
    "Relevant context:",
    body.slice(0, 6000)
  ].join("\n");
}

function buildFindings(request, inputTokens, savedTokens) {
  const text = String(request.input || "");
  const lower = text.toLowerCase();
  const duplicateLines = uniqueLines(text).removed.length;
  const categories = [
    ["repeated context", duplicateLines > 0 || /repeated|again|same as above/.test(lower), 0.22, "Repeated lines or restated requirements increase context size.", "Keep one canonical version and remove repeated sections."],
    ["irrelevant content", /background|chatter|off-topic|archive/.test(lower), 0.15, "Some context appears weakly related to the task goal.", "Move low-relevance background into archive context."],
    ["verbose instructions", parseWords(text).length > 180, 0.18, "Long instruction blocks can be collapsed into acceptance criteria.", "Convert broad style guidance into short, testable requirements."],
    ["duplicated files/logs", /error:|stack trace|traceback|duplicate log|at\s+\w+\(/i.test(text), 0.16, "Logs or file excerpts may include repeated diagnostics.", "Keep the latest complete failure and remove duplicate traces."],
    ["unclear task objective", !request.taskGoal?.trim(), 0.1, "The requested outcome is not stated clearly enough.", "Add a one-sentence task goal before context."],
    ["unnecessary examples", /(example|formatting examples|sample)/i.test(text), 0.08, "Multiple examples may repeat the same output pattern.", "Keep only the strongest example unless each one adds a distinct rule."],
    ["hidden prompt bloat", /system|policy|always|never|must/i.test(text), 0.11, "Evergreen reminders can add length without changing this run.", "Move reusable reminders into presets and send only task-specific rules."]
  ];

  return categories.map(([category, matched, weight, description, recommendation], index) => {
    const tokensWasted = Math.max(18, Math.round(savedTokens * (matched ? weight : weight * 0.35)));
    return {
      id: `wf-${index + 1}`,
      category,
      severity: severityFor(tokensWasted, inputTokens),
      tokensWasted,
      description,
      recommendation
    };
  });
}

function buildRelevance(request) {
  const sections = String(request.input || "")
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean);

  const fallback = [
    "Task objective and user-requested deliverable.",
    "Relevant context and constraints.",
    "Duplicated or low-value background notes."
  ];

  return (sections.length ? sections : fallback).slice(0, 12).map((section, index) => {
    const lower = section.toLowerCase();
    const tokens = estimateTokens(section, request.mode);
    const removable = /duplicate|repeated|example|chatter|legacy|archive/.test(lower);
    const relevant = index === 0 || /goal|security|constraint|error|blocker|required|deliverable/.test(lower);
    const status = removable ? "removable" : relevant ? "relevant" : "uncertain";
    return {
      id: `rs-${index + 1}`,
      title: section.split(/\r?\n/)[0].replace(/[:#*-]/g, "").trim().slice(0, 70) || `Section ${index + 1}`,
      status,
      tokens,
      selected: status !== "removable",
      reason: status === "removable"
        ? "Likely safe to remove unless it changes the final answer."
        : status === "relevant"
          ? "Directly supports the task goal, constraints, or output."
          : "May help, but should be reviewed before sending to a model."
    };
  });
}

function analyze(request) {
  const inputTokens = estimateTokens(request.input, request.mode);
  const goalBonus = request.taskGoal?.trim() ? 0.07 : 0;
  const savedRatio = Math.min(0.58, Math.max(0.18, 0.36 + goalBonus));
  const savedTokens = Math.round(inputTokens * savedRatio);
  const optimizedInputTokens = Math.max(64, inputTokens - savedTokens);
  const pricing = pricingPresets.find((item) => item.provider === request.targetModel) || pricingPresets[0];
  const estimatedCostBefore = Number(((inputTokens * pricing.inputPerMillion + request.outputBudget * pricing.outputPerMillion) / 1_000_000).toFixed(4));
  const estimatedCostAfter = Number(((optimizedInputTokens * pricing.inputPerMillion + request.outputBudget * pricing.outputPerMillion) / 1_000_000).toFixed(4));
  const optimizedPrompt = buildOptimizedPrompt(request);
  const removed = uniqueLines(request.input).removed;
  const relevance = buildRelevance(request);

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
    findings: buildFindings(request, inputTokens, savedTokens),
    compression: {
      beforeText: request.input || "Paste prompt, document, chat log, code task, or API payload here.",
      afterText: optimizedPrompt,
      removedSections: removed.length ? removed.slice(0, 8) : ["Repeated context", "Low-relevance background notes", "Unnecessary examples"],
      preservedFacts: ["Task goal", "Required output format", "Security constraints", "Launch blockers", "Exact errors and code references"],
      compressionRatio: Math.round((savedTokens / Math.max(inputTokens, 1)) * 100),
      warnings: ["Review legal, medical, compliance, and financial wording before aggressive compression.", "Never execute submitted code; treat code tasks as text."]
    },
    relevance,
    executionPlan: [
      { id: "ep-1", title: "Summarize first", description: "Extract stable facts, blockers, entities, and constraints before final reasoning.", estimatedSavings: 18, modelTier: "cheap" },
      { id: "ep-2", title: "Retrieve relevant chunks only", description: "Send only sections marked relevant or manually kept by the user.", estimatedSavings: 24, modelTier: "balanced" },
      { id: "ep-3", title: "Use cheaper model for extraction", description: "Use a lower-cost model for dates, entities, and repeated requirement cleanup.", estimatedSavings: 13, modelTier: "cheap" },
      { id: "ep-4", title: "Use premium model for final reasoning", description: "Reserve the strongest model for final synthesis after context is trimmed.", estimatedSavings: 21, modelTier: "premium" },
      { id: "ep-5", title: "Cache repeated context", description: "Store stable product, team, and style context outside each prompt run.", estimatedSavings: 17, modelTier: "balanced" }
    ],
    estimatedCostBefore,
    estimatedCostAfter,
    monthlySavingsProjection: Number(((estimatedCostBefore - estimatedCostAfter) * 420).toFixed(2)),
    optimizedPrompt
  };
}

async function readJsonFile(file, fallback) {
  try {
    return JSON.parse(await readFile(join(dataDir, file), "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJsonFile(file, value) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(join(dataDir, file), JSON.stringify(value, null, 2));
}

async function readBody(req) {
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBodyBytes) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sanitizeRun(result) {
  return {
    id: result.id,
    name: result.request.taskGoal?.slice(0, 70) || `${result.request.mode} analysis`,
    mode: result.request.mode,
    model: result.request.targetModel,
    originalTokens: result.estimate.inputTokens,
    optimizedTokens: result.estimate.optimizedInputTokens,
    savingsPercent: result.compression.compressionRatio,
    tags: [result.request.mode.toLowerCase().replace(/\s+/g, "-"), result.request.targetModel.toLowerCase()],
    createdAt: result.createdAt
  };
}

async function handleApi(req, res, id, url) {
  try {
    if (req.method === "POST" && url.pathname === "/api/analysis") {
      const body = await readBody(req);
      return json(res, 200, { data: analyze(body) }, id);
    }

    if (req.method === "POST" && url.pathname === "/api/compression") {
      const body = await readBody(req);
      return json(res, 200, { data: analyze(body).compression }, id);
    }

    if (req.method === "POST" && url.pathname === "/api/relevance") {
      const body = await readBody(req);
      return json(res, 200, { data: analyze(body).relevance }, id);
    }

    if (req.method === "POST" && url.pathname === "/api/execution-plan") {
      const body = await readBody(req);
      const result = analyze(body);
      return json(res, 200, { data: { steps: result.executionPlan, suggestedPrompt: result.optimizedPrompt, outputBudget: result.request.outputBudget } }, id);
    }

    if (req.method === "GET" && url.pathname === "/api/saved-runs") {
      const data = await readJsonFile("saved-runs.json", []);
      return json(res, 200, { data }, id);
    }

    if (req.method === "POST" && url.pathname === "/api/saved-runs") {
      const body = await readBody(req);
      const runs = await readJsonFile("saved-runs.json", []);
      const run = body.estimate ? sanitizeRun(body) : body;
      const next = [run, ...runs.filter((item) => item.id !== run.id)].slice(0, 100);
      await writeJsonFile("saved-runs.json", next);
      return json(res, 201, { data: run }, id);
    }

    if (req.method === "GET" && url.pathname === "/api/settings/model-pricing") {
      return json(res, 200, { data: pricingPresets }, id);
    }

    if (req.method === "GET" && url.pathname === "/api/settings/defaults") {
      const data = await readJsonFile("settings.json", defaultSettings);
      return json(res, 200, { data }, id);
    }

    if (req.method === "PUT" && url.pathname === "/api/settings/defaults") {
      const body = await readBody(req);
      const next = { ...defaultSettings, ...body };
      await writeJsonFile("settings.json", next);
      return json(res, 200, { data: next }, id);
    }

    if (req.method === "POST" && url.pathname === "/api/donations/session") {
      if (!process.env.STRIPE_DONATION_LINK) {
        return json(res, 409, { error: "Stripe hosted checkout is not configured. Set STRIPE_DONATION_LINK or use PayPal.me." }, id);
      }
      return json(res, 200, { data: { url: process.env.STRIPE_DONATION_LINK } }, id);
    }

    return json(res, 404, { error: "API endpoint not found." }, id);
  } catch (error) {
    return json(res, error.status || 400, { error: error.message || "Request failed." }, id);
  }
}

async function serveStatic(req, res, id, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(distDir, safePath);

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, "index.html");
  } catch {
    filePath = join(distDir, "index.html");
  }

  try {
    res.writeHead(200, {
      "content-type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "x-request-id": id
    });
    createReadStream(filePath).pipe(res);
  } catch {
    json(res, 404, { error: "Build output not found. Run npm run build first." }, id);
  }
}

const server = createServer(async (req, res) => {
  const id = requestId();
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname.startsWith("/api/")) {
    return handleApi(req, res, id, url);
  }

  return serveStatic(req, res, id, url);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AI Token Control backend listening on http://127.0.0.1:${port}`);
});
