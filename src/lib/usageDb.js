import Database from "better-sqlite3";
import path from "path";
import os from "os";
import fs from "fs";
import { fileURLToPath } from "url";

const isCloud = typeof caches !== 'undefined' || typeof caches === 'object';

function getAppName() {
  return "9router";
}

function getUserDataDir() {
  if (isCloud) return "/tmp";

  if (process.env.DATA_DIR) return process.env.DATA_DIR;

  try {
    const platform = process.platform;
    const homeDir = os.homedir();
    const appName = getAppName();

    if (platform === "win32") {
      return path.join(process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"), appName);
    } else {
      return path.join(homeDir, `.${appName}`);
    }
  } catch (error) {
    console.error("[usageDb] Failed to get user data directory:", error.message);
    return path.join(process.cwd(), ".9router");
  }
}

const DATA_DIR = getUserDataDir();
const DB_FILE = isCloud ? null : path.join(DATA_DIR, "usage.sqlite");
const LOG_FILE = isCloud ? null : path.join(DATA_DIR, "log.txt");

if (!isCloud && fs && typeof fs.existsSync === "function") {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`[usageDb] Created data directory: ${DATA_DIR}`);
    }
  } catch (error) {
    console.error("[usageDb] Failed to create data directory:", error.message);
  }
}

let dbInstance = null;
let shutdownHandlerRegistered = false;

const pendingRequests = {
  byModel: {},
  byAccount: {}
};

export function trackPendingRequest(model, provider, connectionId, started) {
  const modelKey = provider ? `${model} (${provider})` : model;

  if (!pendingRequests.byModel[modelKey]) pendingRequests.byModel[modelKey] = 0;
  pendingRequests.byModel[modelKey] = Math.max(0, pendingRequests.byModel[modelKey] + (started ? 1 : -1));

  if (connectionId) {
    const accountKey = connectionId;
    if (!pendingRequests.byAccount[accountKey]) pendingRequests.byAccount[accountKey] = {};
    if (!pendingRequests.byAccount[accountKey][modelKey]) pendingRequests.byAccount[accountKey][modelKey] = 0;
    pendingRequests.byAccount[accountKey][modelKey] = Math.max(0, pendingRequests.byAccount[accountKey][modelKey] + (started ? 1 : -1));
  }
}

function initUsageDb(db) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const schemaPath = path.join(__dirname, "schema", "usage.sql");

  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, "utf-8");
    db.exec(schema);
    console.log("[usageDb] Database schema initialized");
  } else {
    console.warn("[usageDb] Schema file not found:", schemaPath);
  }
}

function ensureShutdownHandler() {
  if (shutdownHandlerRegistered || isCloud) return;

  const handler = () => {
    if (dbInstance) {
      dbInstance.close();
      console.log("[usageDb] Database closed");
    }
  };

  process.on('beforeExit', handler);
  process.on('SIGINT', handler);
  process.on('SIGTERM', handler);
  process.on('exit', handler);

  shutdownHandlerRegistered = true;
}

export async function getUsageDb() {
  if (isCloud) {
    if (!dbInstance) {
      dbInstance = {
        prepare: () => ({
          run: () => {},
          get: () => null,
          all: () => []
        }),
        exec: () => {},
        pragma: () => {},
        close: () => {}
      };
    }
    return dbInstance;
  }

  if (process.env.NODE_ENV === 'development' && global.__usageDb) {
    return global.__usageDb;
  }

  if (!dbInstance) {
    const db = new Database(DB_FILE);

    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = -64000');
    db.pragma('busy_timeout = 5000');

    initUsageDb(db);

    dbInstance = db;
    ensureShutdownHandler();

    if (process.env.NODE_ENV === 'development') {
      global.__usageDb = dbInstance;
    }
  }

  return dbInstance;
}

export async function saveRequestUsage(entry) {
  if (isCloud) return;

  console.log("[usageDb] saveRequestUsage - SQLite implementation pending");
}

export async function getUsageStats() {
  if (isCloud) {
    return {
      totalRequests: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalCost: 0,
      byProvider: {},
      byModel: {},
      byAccount: {},
      byApiKey: {},
      last10Minutes: [],
      pending: pendingRequests,
      activeRequests: []
    };
  }

  console.log("[usageDb] getUsageStats - SQLite implementation pending");

  const stats = {
    totalRequests: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalCost: 0,
    byProvider: {},
    byModel: {},
    byAccount: {},
    byApiKey: {},
    last10Minutes: [],
    pending: pendingRequests,
    activeRequests: []
  };

  for (const [connectionId, models] of Object.entries(pendingRequests.byAccount)) {
    for (const [modelKey, count] of Object.entries(models)) {
      if (count > 0) {
        const match = modelKey.match(/^(.*) \((.*)\)$/);
        const modelName = match ? match[1] : modelKey;
        const providerName = match ? match[2] : "unknown";

        stats.activeRequests.push({
          model: modelName,
          provider: providerName,
          account: `Account ${connectionId.slice(0, 8)}...`,
          count
        });
      }
    }
  }

  return stats;
}

export async function getUsageHistory(filter = {}) {
  console.log("[usageDb] getUsageHistory - SQLite implementation pending");
  return [];
}

export async function clearUsageHistory() {
  console.log("[usageDb] clearUsageHistory - SQLite implementation pending");
}

export async function getTotalTokens() {
  console.log("[usageDb] getTotalTokens - SQLite implementation pending");
  return {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0
  };
}

export async function getTodayStats() {
  console.log("[usageDb] getTodayStats - SQLite implementation pending");
  return {
    date: new Date().toISOString().split('T')[0],
    totalRequests: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalCost: 0,
    byModel: {},
    byProvider: {}
  };
}

export async function getProviderStats() {
  console.log("[usageDb] getProviderStats - SQLite implementation pending");
  return {
    byProvider: {},
    summary: {
      totalRequests: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalCost: 0
    }
  };
}

function formatLogDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${d}-${m}-${y} ${h}:${min}:${s}`;
}

export async function appendRequestLog({ model, provider, connectionId, tokens, status }) {
  if (isCloud) return;

  try {
    const timestamp = formatLogDate();
    const p = provider?.toUpperCase() || "-";
    const m = model || "-";

    let account = connectionId ? connectionId.slice(0, 8) : "-";
    try {
      const { getProviderConnections } = await import("@/lib/localDb.js");
      const connections = await getProviderConnections();
      const conn = connections.find(c => c.id === connectionId);
      if (conn) {
        account = conn.name || conn.email || account;
      }
    } catch {}

    const sent = tokens?.prompt_tokens !== undefined ? tokens.prompt_tokens : "-";
    const received = tokens?.completion_tokens !== undefined ? tokens.completion_tokens : "-";

    const line = `${timestamp} | ${m} | ${p} | ${account} | ${sent} | ${received} | ${status}\n`;

    fs.appendFileSync(LOG_FILE, line);

    const content = fs.readFileSync(LOG_FILE, "utf-8");
    const lines = content.trim().split("\n");
    if (lines.length > 200) {
      fs.writeFileSync(LOG_FILE, lines.slice(-200).join("\n") + "\n");
    }
  } catch (error) {
    console.error("Failed to append to log.txt:", error.message);
  }
}

export async function getRecentLogs(limit = 200) {
  if (isCloud) return [];

  if (!fs || typeof fs.existsSync !== "function") {
    console.error("[usageDb] fs module not available in this environment");
    return [];
  }

  if (!LOG_FILE) {
    console.error("[usageDb] LOG_FILE path not defined");
    return [];
  }

  if (!fs.existsSync(LOG_FILE)) {
    console.log(`[usageDb] Log file does not exist: ${LOG_FILE}`);
    return [];
  }

  try {
    const content = fs.readFileSync(LOG_FILE, "utf-8");
    const lines = content.trim().split("\n");
    return lines.slice(-limit).reverse();
  } catch (error) {
    console.error("[usageDb] Failed to read log.txt:", error.message);
    console.error("[usageDb] LOG_FILE path:", LOG_FILE);
    return [];
  }
}

export { saveRequestDetail, getRequestDetails, getRequestDetailById } from "./requestDetailsDb.js";
