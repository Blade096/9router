import Database from "better-sqlite3";
import path from "path";
import os from "os";
import fs from "fs";
import { fileURLToPath } from "url";
import { getPricingForModel, calculateCostFromTokens } from "@/shared/constants/pricing.js";

// Detect cloud environment - caches API exists in browser/edge, not in Node.js server
const isCloud = typeof window !== 'undefined' || (typeof caches !== 'undefined' && caches !== null && typeof caches === 'object');

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

// ============================================================================
// CONFIGURATION: Batch Processing Settings
// ============================================================================

/**
 * Batch size for buffer flush operations.
 * @type {number}
 */
const BATCH_SIZE = 20;

/**
 * Time interval in milliseconds for auto-flush.
 * @type {number}
 */
const FLUSH_INTERVAL = 5000;

// ============================================================================
// BATCH WRITE QUEUE
// ============================================================================

/**
 * In-memory buffer for batch writes.
 * Accumulates usage entries before flushing to database in a transaction.
 * @type {Array<object>}
 */
let writeBuffer = [];

/**
 * Timer reference for auto-flush mechanism.
 * Ensures data is written even during low traffic periods.
 * @type {NodeJS.Timeout|null}
 */
let flushTimer = null;

/**
 * Flag indicating if a flush operation is currently in progress.
 * Prevents concurrent flushes.
 * @type {boolean}
 */
let isFlushing = false;

// ============================================================================
// PENDING REQUESTS TRACKING
// ============================================================================

const pendingRequests = {
  byModel: {},
  byAccount: {}
};

/**
 * Generate a unique request ID combining timestamp and random string.
 * Format: ${Date.now()}-${random}
 * @returns {string} Unique request ID
 */
export function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

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

  // Migration: Add request_id column if it doesn't exist
  try {
    db.prepare("ALTER TABLE usage_history ADD COLUMN request_id TEXT").run();
    console.log("[usageDb] Added request_id column to usage_history");
  } catch (e) {
    // Column already exists, ignore error
  }
}

/**
 * Flush all buffered items to database in a single transaction.
 * This function is called automatically when:
 * 1. Buffer size reaches BATCH_SIZE
 * 2. FLUSH_INTERVAL milliseconds elapses
 * 3. Process is shutting down (graceful shutdown)
 *
 * @private
 */
async function flushToDatabase() {
  if (isCloud || isFlushing || writeBuffer.length === 0) {
    return;
  }

  isFlushing = true;

  try {
    const itemsToSave = [...writeBuffer];
    writeBuffer = [];

    // Check if database connection is open, reinitialize if needed
    if (dbInstance && !dbInstance.open) {
      try {
        dbInstance = new Database(DB_FILE);
        dbInstance.pragma('journal_mode = WAL');
        dbInstance.pragma('synchronous = NORMAL');
        dbInstance.pragma('cache_size = -64000');
        dbInstance.pragma('busy_timeout = 5000');
        initUsageDb(dbInstance);
        console.log("[usageDb] Database connection reopened");
      } catch (reinitError) {
        console.error("[usageDb] Failed to reopen database:", reinitError.message);
        return;
      }
    }

    const db = dbInstance || await getUsageDb();

    // Double-check connection is still open before using
    if (!db.open) {
      console.error("[usageDb] Database connection is not open, skipping flush");
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO usage_history
      (provider, model, connection_id, api_key, timestamp, status,
       prompt_tokens, completion_tokens, cached_tokens, reasoning_tokens,
       cache_creation_input_tokens, cache_read_input_tokens, request_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((items) => {
      for (const item of items) {
        // Ensure timestamp is valid - use current time as fallback
        let timestamp;
        if (item.timestamp) {
          const parsed = new Date(item.timestamp).getTime();
          timestamp = Number.isFinite(parsed) ? parsed : Date.now();
        } else {
          timestamp = Date.now();
        }

        // Ensure status is valid - use "success" as fallback
        const status = item.status || "success";

        stmt.run(
          item.provider,
          item.model,
          item.connectionId || null,
          item.apiKey || null,
          timestamp,
          status,
          item.tokens?.prompt_tokens || 0,
          item.tokens?.completion_tokens || 0,
          item.tokens?.cached_tokens || 0,
          item.tokens?.reasoning_tokens || 0,
          item.tokens?.cache_creation_input_tokens || 0,
          item.tokens?.cache_read_input_tokens || 0,
          item.requestId || null
        );
      }
    });

    transaction(itemsToSave);
  } catch (error) {
    console.error("[usageDb] Batch write failed:", error);
  } finally {
    isFlushing = false;
  }
}

/**
 * Register process shutdown handlers to flush remaining data before exit.
 * Should be called once when the module initializes.
 */
function ensureShutdownHandler() {
  if (shutdownHandlerRegistered || isCloud) return;

  const handler = async () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    if (writeBuffer.length > 0) {
      console.log(`[usageDb] Flushing ${writeBuffer.length} items before shutdown...`);
      await flushToDatabase();
    }

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

  try {
    writeBuffer.push(entry);

    if (writeBuffer.length >= BATCH_SIZE) {
      await flushToDatabase();

      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
    } else if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushToDatabase().catch(() => {});
        flushTimer = null;
      }, FLUSH_INTERVAL);
    }
  } catch (error) {
    console.error("[usageDb] SQLite write failed:", error.message);
  }
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

  const db = await getUsageDb();

  const result = db.prepare(`
    SELECT
      provider,
      model,
      connection_id,
      api_key,
      timestamp,
      status,
      prompt_tokens,
      completion_tokens,
      cached_tokens,
      reasoning_tokens,
      cache_creation_input_tokens,
      cache_read_input_tokens
    FROM usage_history
    ORDER BY timestamp DESC
  `).all();

  const stats = {
    totalRequests: result.length,
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

  const { getProviderConnections, getApiKeys } = await import("@/lib/localDb.js");

  let allConnections = [];
  try {
    allConnections = await getProviderConnections();
  } catch {}

  const connectionMap = {};
  for (const conn of allConnections) {
    connectionMap[conn.id] = conn.name || conn.email || conn.id;
  }

  let allApiKeys = [];
  try {
    allApiKeys = await getApiKeys();
  } catch {}

  const apiKeyMap = {};
  for (const key of allApiKeys) {
    apiKeyMap[key.key] = { name: key.name, id: key.id };
  }

  const now = new Date();
  const currentMinuteStart = new Date(Math.floor(now.getTime() / 60000) * 60000);
  const tenMinutesAgo = new Date(currentMinuteStart.getTime() - 9 * 60 * 1000);

  const bucketMap = {};
  for (let i = 0; i < 10; i++) {
    const bucketTime = new Date(currentMinuteStart.getTime() - (9 - i) * 60 * 1000);
    const bucketKey = bucketTime.getTime();
    bucketMap[bucketKey] = {
      requests: 0,
      promptTokens: 0,
      completionTokens: 0,
      cost: 0
    };
    stats.last10Minutes.push(bucketMap[bucketKey]);
  }

  for (const row of result) {
    const entryTime = new Date(row.timestamp);

    const pricing = getPricingForModel(row.provider, row.model);
    const entryCost = calculateCostFromTokens(
      {
        prompt_tokens: row.prompt_tokens,
        completion_tokens: row.completion_tokens,
        cached_tokens: row.cached_tokens,
        reasoning_tokens: row.reasoning_tokens,
        cache_creation_input_tokens: row.cache_creation_input_tokens,
        cache_read_input_tokens: row.cache_read_input_tokens
      },
      pricing
    );

    stats.totalPromptTokens += row.prompt_tokens || 0;
    stats.totalCompletionTokens += row.completion_tokens || 0;
    stats.totalCost += entryCost;

    if (entryTime >= tenMinutesAgo && entryTime <= now) {
      const entryMinuteStart = Math.floor(entryTime.getTime() / 60000) * 60000;
      if (bucketMap[entryMinuteStart]) {
        bucketMap[entryMinuteStart].requests++;
        bucketMap[entryMinuteStart].promptTokens += row.prompt_tokens || 0;
        bucketMap[entryMinuteStart].completionTokens += row.completion_tokens || 0;
        bucketMap[entryMinuteStart].cost += entryCost;
      }
    }

    if (!stats.byProvider[row.provider]) {
      stats.byProvider[row.provider] = {
        requests: 0,
        promptTokens: 0,
        completionTokens: 0,
        cost: 0
      };
    }
    stats.byProvider[row.provider].requests++;
    stats.byProvider[row.provider].promptTokens += row.prompt_tokens || 0;
    stats.byProvider[row.provider].completionTokens += row.completion_tokens || 0;
    stats.byProvider[row.provider].cost += entryCost;

    const modelKey = row.provider ? `${row.model} (${row.provider})` : row.model;
    if (!stats.byModel[modelKey]) {
      stats.byModel[modelKey] = {
        requests: 0,
        promptTokens: 0,
        completionTokens: 0,
        cost: 0,
        rawModel: row.model,
        provider: row.provider,
        lastUsed: row.timestamp
      };
    }
    stats.byModel[modelKey].requests++;
    stats.byModel[modelKey].promptTokens += row.prompt_tokens || 0;
    stats.byModel[modelKey].completionTokens += row.completion_tokens || 0;
    stats.byModel[modelKey].cost += entryCost;
    if (entryTime > new Date(stats.byModel[modelKey].lastUsed)) {
      stats.byModel[modelKey].lastUsed = row.timestamp;
    }

    if (row.connection_id) {
      const accountName = connectionMap[row.connection_id] || `Account ${row.connection_id.slice(0, 8)}...`;
      const accountKey = `${row.model} (${row.provider} - ${accountName})`;
      if (!stats.byAccount[accountKey]) {
        stats.byAccount[accountKey] = {
          requests: 0,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0,
          rawModel: row.model,
          provider: row.provider,
          connectionId: row.connection_id,
          accountName: accountName,
          lastUsed: row.timestamp
        };
      }
      stats.byAccount[accountKey].requests++;
      stats.byAccount[accountKey].promptTokens += row.prompt_tokens || 0;
      stats.byAccount[accountKey].completionTokens += row.completion_tokens || 0;
      stats.byAccount[accountKey].cost += entryCost;
      if (entryTime > new Date(stats.byAccount[accountKey].lastUsed)) {
        stats.byAccount[accountKey].lastUsed = row.timestamp;
      }
    }

    if (row.api_key) {
      const keyInfo = apiKeyMap[row.api_key];
      const keyName = keyInfo?.name || row.api_key.slice(0, 8) + "...";
      const apiKeyKey = row.api_key;
      const apiKeyModelKey = `${apiKeyKey}|${row.model}|${row.provider || 'unknown'}`;
      if (!stats.byApiKey[apiKeyModelKey]) {
        stats.byApiKey[apiKeyModelKey] = {
          requests: 0,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0,
          rawModel: row.model,
          provider: row.provider,
          apiKey: row.api_key,
          keyName: keyName,
          apiKeyKey: apiKeyKey,
          lastUsed: row.timestamp
        };
      }
      const apiKeyEntry = stats.byApiKey[apiKeyModelKey];
      apiKeyEntry.requests++;
      apiKeyEntry.promptTokens += row.prompt_tokens || 0;
      apiKeyEntry.completionTokens += row.completion_tokens || 0;
      apiKeyEntry.cost += entryCost;
      if (entryTime > new Date(apiKeyEntry.lastUsed)) {
        apiKeyEntry.lastUsed = row.timestamp;
      }
    } else {
      const apiKeyKey = "local-no-key";
      const keyName = "Local (No API Key)";
      if (!stats.byApiKey[apiKeyKey]) {
        stats.byApiKey[apiKeyKey] = {
          requests: 0,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0,
          rawModel: row.model,
          provider: row.provider,
          apiKey: null,
          keyName: keyName,
          apiKeyKey: apiKeyKey,
          lastUsed: row.timestamp
        };
      }
      const apiKeyEntry = stats.byApiKey[apiKeyKey];
      apiKeyEntry.requests++;
      apiKeyEntry.promptTokens += row.prompt_tokens || 0;
      apiKeyEntry.completionTokens += row.completion_tokens || 0;
      apiKeyEntry.cost += entryCost;
      if (entryTime > new Date(apiKeyEntry.lastUsed)) {
        apiKeyEntry.lastUsed = row.timestamp;
      }
    }
  }

  for (const [connectionId, models] of Object.entries(pendingRequests.byAccount)) {
    for (const [modelKey, count] of Object.entries(models)) {
      if (count > 0) {
        const match = modelKey.match(/^(.*) \((.*)\)$/);
        const modelName = match ? match[1] : modelKey;
        const providerName = match ? match[2] : "unknown";
        const accountName = connectionMap[connectionId] || `Account ${connectionId.slice(0, 8)}...`;

        stats.activeRequests.push({
          model: modelName,
          provider: providerName,
          account: accountName,
          count
        });
      }
    }
  }

  return stats;
}

export async function getUsageHistory(filter = {}) {
  const db = await getUsageDb();

  let query = "SELECT * FROM usage_history WHERE 1=1";
  const params = [];

  if (filter.provider) {
    query += " AND provider = ?";
    params.push(filter.provider);
  }

  if (filter.model) {
    query += " AND model = ?";
    params.push(filter.model);
  }

  if (filter.startDate) {
    query += " AND timestamp >= ?";
    params.push(new Date(filter.startDate).getTime());
  }

  if (filter.endDate) {
    query += " AND timestamp <= ?";
    params.push(new Date(filter.endDate).getTime());
  }

  query += " ORDER BY timestamp DESC";

  if (filter.limit) {
    query += " LIMIT ?";
    params.push(filter.limit);
  }

  const rows = db.prepare(query).all(...params);

  return rows.map(row => ({
    provider: row.provider,
    model: row.model,
    connectionId: row.connection_id,
    apiKey: row.api_key,
    timestamp: new Date(row.timestamp).toISOString(),
    status: row.status,
    tokens: {
      prompt_tokens: row.prompt_tokens,
      completion_tokens: row.completion_tokens,
      cached_tokens: row.cached_tokens,
      reasoning_tokens: row.reasoning_tokens,
      cache_creation_input_tokens: row.cache_creation_input_tokens,
      cache_read_input_tokens: row.cache_read_input_tokens
    }
  }));
}

export async function clearUsageHistory() {
  try {
    const db = await getUsageDb();
    db.prepare("DELETE FROM usage_history").run();
  } catch (error) {
    console.error("[usageDb] Failed to clear usage history:", error.message);
  }
}

export async function getTotalTokens() {
  try {
    const db = await getUsageDb();
    const result = db.prepare(`
      SELECT
        SUM(prompt_tokens) as promptTokens,
        SUM(completion_tokens) as completionTokens
      FROM usage_history
    `).get();

    return {
      promptTokens: result.promptTokens || 0,
      completionTokens: result.completionTokens || 0,
      totalTokens: (result.promptTokens || 0) + (result.completionTokens || 0)
    };
  } catch (error) {
    console.error("[usageDb] Failed to get total tokens:", error.message);
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    };
  }
}

export async function getTodayStats() {
  try {
    const db = await getUsageDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = db.prepare(`
      SELECT
        provider,
        model,
        prompt_tokens,
        completion_tokens
      FROM usage_history
      WHERE timestamp >= ? AND timestamp < ?
    `).all(today.getTime(), tomorrow.getTime());

    const stats = {
      date: today.toISOString().split('T')[0],
      totalRequests: result.length,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalCost: 0,
      byModel: {},
      byProvider: {}
    };

    for (const row of result) {
      stats.totalPromptTokens += row.prompt_tokens || 0;
      stats.totalCompletionTokens += row.completion_tokens || 0;

      if (!stats.byProvider[row.provider]) {
        stats.byProvider[row.provider] = {
          requests: 0,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0
        };
      }
      stats.byProvider[row.provider].requests++;
      stats.byProvider[row.provider].promptTokens += row.prompt_tokens || 0;
      stats.byProvider[row.provider].completionTokens += row.completion_tokens || 0;

      const modelKey = row.provider ? `${row.model} (${row.provider})` : row.model;
      if (!stats.byModel[modelKey]) {
        stats.byModel[modelKey] = {
          requests: 0,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0
        };
      }
      stats.byModel[modelKey].requests++;
      stats.byModel[modelKey].promptTokens += row.prompt_tokens || 0;
      stats.byModel[modelKey].completionTokens += row.completion_tokens || 0;
    }

    return stats;
  } catch (error) {
    console.error("[usageDb] Failed to get today stats:", error.message);
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
}

export async function getProviderStats() {
  try {
    const db = await getUsageDb();
    const result = db.prepare(`
      SELECT
        provider,
        model,
        prompt_tokens,
        completion_tokens
      FROM usage_history
    `).all();

    const stats = {
      byProvider: {},
      summary: {
        totalRequests: result.length,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalCost: 0
      }
    };

    for (const row of result) {
      stats.summary.totalPromptTokens += row.prompt_tokens || 0;
      stats.summary.totalCompletionTokens += row.completion_tokens || 0;

      if (!stats.byProvider[row.provider]) {
        stats.byProvider[row.provider] = {
          requests: 0,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0,
          byModel: {}
        };
      }
      stats.byProvider[row.provider].requests++;
      stats.byProvider[row.provider].promptTokens += row.prompt_tokens || 0;
      stats.byProvider[row.provider].completionTokens += row.completion_tokens || 0;

      if (!stats.byProvider[row.provider].byModel[row.model]) {
        stats.byProvider[row.provider].byModel[row.model] = {
          requests: 0,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0
        };
      }
      stats.byProvider[row.provider].byModel[row.model].requests++;
      stats.byProvider[row.provider].byModel[row.model].promptTokens += row.prompt_tokens || 0;
      stats.byProvider[row.provider].byModel[row.model].completionTokens += row.completion_tokens || 0;
    }

    return stats;
  } catch (error) {
    console.error("[usageDb] Failed to get provider stats:", error.message);
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
}

export async function getRecentLogs(limit = 200) {

  if (isCloud) {
    return [];
  }

  // First try SQLite database (new format)
  try {
    // Check if database connection is open, reinitialize if needed
    if (dbInstance && !dbInstance.open) {
      try {
        dbInstance = new Database(DB_FILE);
        dbInstance.pragma('journal_mode = WAL');
        dbInstance.pragma('synchronous = NORMAL');
        dbInstance.pragma('cache_size = -64000');
        dbInstance.pragma('busy_timeout = 5000');
        initUsageDb(dbInstance);
      } catch (reinitError) {
        console.error("[usageDb] Failed to reopen database:", reinitError.message);
        return [];
      }
    }

    const db = dbInstance || await getUsageDb();

    if (!db.open) {
      console.error("[usageDb] Database connection is not open");
      return [];
    }

    const rows = db.prepare(`
      SELECT
        timestamp,
        model,
        provider,
        connection_id,
        api_key,
        status,
        prompt_tokens,
        completion_tokens,
        cached_tokens,
        reasoning_tokens,
        cache_creation_input_tokens,
        cache_read_input_tokens,
        request_id
      FROM usage_history
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(limit);

    // Return JSON objects instead of formatted strings
    const logs = rows.map(row => ({
      timestamp: row.timestamp,
      provider: row.provider,
      model: row.model,
      connectionId: row.connection_id,
      apiKey: row.api_key,
      status: row.status,
      requestId: row.request_id,
      tokens: {
        prompt: row.prompt_tokens,
        completion: row.completion_tokens,
        cached: row.cached_tokens,
        reasoning: row.reasoning_tokens,
        cacheCreation: row.cache_creation_input_tokens,
        cacheRead: row.cache_read_input_tokens
      }
    }));
    return logs;
  } catch (dbError) {
    console.error("[usageDb] Failed to read from SQLite:", dbError.message);
    return [];
  }
}

export { saveRequestDetail, getRequestDetails, getRequestDetailById } from "./requestDetailsDb.js";
