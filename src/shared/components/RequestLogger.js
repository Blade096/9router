"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "./Card";

export default function RequestLogger() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/usage/request-logs");
      if (res.ok) {
        const data = await res.json();
        console.log("[RequestLogger] Received logs:", data.length, "items");
        if (data.length > 0) {
          console.log("[RequestLogger] First log:", data[0]);
          console.log("[RequestLogger] Last log:", data[data.length - 1]);
        }
        setLogs(data);
      } else {
        console.error("[RequestLogger] API response not OK:", res.status);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLogs(false);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Request Logs</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-muted">Auto Refresh (3s)</span>
          <button
            type="button"
            onClick={toggleAutoRefresh}
            onKeyUp={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                toggleAutoRefresh();
              }
            }}
            aria-pressed={autoRefresh}
            aria-label="Toggle auto refresh"
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer ${autoRefresh ? "bg-primary" : "bg-bg-subtle border border-border"
              }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${autoRefresh ? "translate-x-5" : "translate-x-1"
                }`}
            />
          </button>
        </div>
      </div>

      <Card className="overflow-hidden bg-black/5 dark:bg-black/20">
        <div className="p-0 overflow-x-auto max-h-[600px] overflow-y-auto font-mono text-xs">
          {loading && logs.length === 0 ? (
            <div className="p-8 text-center text-text-muted">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-text-muted">No logs recorded yet.</div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 bg-bg-subtle border-b border-border z-10">
                <tr>
                  <th className="px-3 py-2 border-r border-border">DateTime</th>
                  <th className="px-3 py-2 border-r border-border">Model</th>
                  <th className="px-3 py-2 border-r border-border">Provider</th>
                  <th className="px-3 py-2 border-r border-border">Account</th>
                  <th className="px-3 py-2 border-r border-border">In</th>
                  <th className="px-3 py-2 border-r border-border">Out</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
               <tbody className="divide-y divide-border/50">
                 {logs.map((log, i) => {
                   const timestamp = new Date(log.timestamp).toLocaleString();
                    const model = log.model;
                    const provider = log.provider;
                    const account = log.connectionId ? log.connectionId.slice(0, 8) + "..." : "-";
                    const inTokens = log.tokens?.prompt || 0;
                    const outTokens = log.tokens?.completion || 0;
                    const status = log.status;

                    if (!status) return null;

                    const isPending = status === "pending" || status.includes("PENDING");
                    const isFailed = status === "error" || status.includes("FAILED");
                    const isSuccess = status === "success" || status.includes("OK");

                    const statusDisplay = status === "pending" ? "PENDING" : status === "success" ? "SUCCESS" : status === "error" ? "ERROR" : status;
                    const statusColor = isPending ? "text-yellow-500 animate-pulse" : isSuccess ? "text-success" : isFailed ? "text-error" : "text-primary";

                    return (
                      <tr key={`log-${i}-${Date.now()}-${log.timestamp}`} className={`hover:bg-primary/5 transition-colors ${isPending ? 'bg-yellow-500/10' : ''}`}>
                        <td className="px-3 py-1.5 border-r border-border text-text-muted">{timestamp}</td>
                        <td className="px-3 py-1.5 border-r border-border font-medium">{model || "-"}</td>
                        <td className="px-3 py-1.5 border-r border-border">
                          <span className="px-1.5 py-0.5 rounded bg-bg-subtle border border-border text-[10px] uppercase font-bold">
                            {provider || "-"}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 border-r border-border truncate max-w-[150px]" title={account}>{account}</td>
                        <td className="px-3 py-1.5 border-r border-border text-right text-primary">{inTokens}</td>
                        <td className="px-3 py-1.5 border-r border-border text-right text-success">{outTokens}</td>
                        <td className={`px-3 py-1.5 font-bold ${statusColor}`}>
                          {statusDisplay}
                        </td>
                      </tr>
                    );
                 })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      <div className="text-[10px] text-text-muted italic">
        Logs are stored in SQLite database.
      </div>
    </div>
  );
}
