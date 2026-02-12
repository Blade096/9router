-- SQLite Schema for Usage History
-- Stores API request usage metrics with token counts and status tracking

-- Enable WAL mode for better concurrency
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- Main usage history table
CREATE TABLE IF NOT EXISTS usage_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  connection_id TEXT,
  api_key TEXT,
  timestamp INTEGER NOT NULL,
  status TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  cached_tokens INTEGER DEFAULT 0,
  reasoning_tokens INTEGER DEFAULT 0,
  cache_creation_input_tokens INTEGER DEFAULT 0,
  cache_read_input_tokens INTEGER DEFAULT 0
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_timestamp
  ON usage_history(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_provider
  ON usage_history(provider);

CREATE INDEX IF NOT EXISTS idx_model
  ON usage_history(model);

CREATE INDEX IF NOT EXISTS idx_connection
  ON usage_history(connection_id);

CREATE INDEX IF NOT EXISTS idx_status
  ON usage_history(status);

CREATE INDEX IF NOT EXISTS idx_provider_timestamp
  ON usage_history(provider, timestamp DESC);

-- View: Daily statistics aggregated by date, provider, and model
CREATE VIEW IF NOT EXISTS daily_stats AS
SELECT
  DATE(timestamp / 1000, 'unixepoch') AS date,
  provider,
  model,
  COUNT(*) AS request_count,
  SUM(prompt_tokens) AS total_prompt_tokens,
  SUM(completion_tokens) AS total_completion_tokens,
  SUM(cached_tokens) AS total_cached_tokens,
  SUM(reasoning_tokens) AS total_reasoning_tokens,
  SUM(cache_creation_input_tokens) AS total_cache_creation_tokens,
  SUM(cache_read_input_tokens) AS total_cache_read_tokens,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success_count,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS error_count
FROM usage_history
GROUP BY date, provider, model
ORDER BY date DESC, provider, model;

-- View: Provider statistics aggregated by provider
CREATE VIEW IF NOT EXISTS provider_stats AS
SELECT
  provider,
  COUNT(*) AS request_count,
  SUM(prompt_tokens) AS total_prompt_tokens,
  SUM(completion_tokens) AS total_completion_tokens,
  SUM(cached_tokens) AS total_cached_tokens,
  SUM(reasoning_tokens) AS total_reasoning_tokens,
  SUM(cache_creation_input_tokens) AS total_cache_creation_tokens,
  SUM(cache_read_input_tokens) AS total_cache_read_tokens,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success_count,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS error_count,
  MIN(timestamp) AS first_request_time,
  MAX(timestamp) AS last_request_time
FROM usage_history
GROUP BY provider
ORDER BY request_count DESC;
