# Codex Provider Local Patch Notes

Date: 2026-02-27
Scope: local-only patch for personal environment (not intended as upstream contribution)

## 1. Background

Goal:
- Use Codex provider with API Key instead of OAuth.
- Route Codex traffic through custom base URL:
  - `https://right.codes/codex/v1`

Observed issues during rollout:
- Provider test showed: `Provider test not supported`
- CLI requests sometimes ended too early ("auto finish")

## 2. Root Causes

### 2.1 Codex executor ignored per-connection base URL

`codex` execution path used a fixed default endpoint and did not read
`providerSpecificData.baseUrl` from provider connection.

Impact:
- Even if connection config had custom base URL, runtime could still hit default path.

### 2.2 Provider API-key test had no Codex branch

The provider test utility supported many API-key providers, but not `codex` in apikey mode.

Impact:
- Test button returned `Provider test not supported`.

### 2.3 Responses stream -> OpenAI stream translation mismatch in tool-call flows

For Codex streaming responses:
- Upstream used Responses API event stream (e.g. `event: response.completed`).
- Translation path for OpenAI-style clients required proper event/type tagging and correct final `finish_reason`.

Two important findings:
- In tool-call scenarios, final finish reason was emitted as `stop`, which can cause CLI orchestration to treat task as fully done too early.
- Added diagnostics confirmed stream was complete, but finish semantics were not ideal for tool-call continuation.

## 3. Changes Applied

## 3.1 Runtime URL support for Codex API-key connections

File:
- `open-sse/executors/codex.js`

Change:
- Added Codex `buildUrl(...)` override:
  - Prefer `credentials.providerSpecificData.baseUrl` when present.
  - Accept both forms:
    - `.../v1` (auto append `/responses`)
    - `.../responses` (use as-is)

Result:
- Codex can now call custom gateway endpoints per connection.

## 3.2 Codex API-key test support

File:
- `src/app/api/providers/[id]/test/testUtils.js`

Change:
- Added `case "codex"` in API-key test switch.
- Test uses configured base URL and verifies via `/models`.

Result:
- Provider test button no longer returns "not supported" for Codex apikey mode.

## 3.3 Codex stream diagnostics and parser hardening

Files:
- `open-sse/handlers/chatCore.js`
- `open-sse/utils/stream.js`

Changes:
- During investigation, temporary `CODEX DEBUG` / `CODEX STREAM` logs were added to inspect:
  - format/stream mode decisions
  - upstream done/finish counters
  - synthetic `[DONE]` emission
  - event type distribution and stream summary
- Stream parser handling was hardened for Responses-style SSE:
  - when upstream sends `event: xxx` + `data: {...}` and `data` lacks `type`,
    event name is propagated into parsed object before translation.

Status:
- Temporary debug logs have been removed after validation.
- Parser hardening remains as a functional fix.

## 3.4 Final finish reason fix for tool-call flows

File:
- `open-sse/translator/response/openai-responses.js`

Change:
- Track whether tool calls exist in stream (`state.hasToolCalls`).
- Emit final `finish_reason` as:
  - `tool_calls` when tool calls are present
  - `stop` otherwise

Result:
- CLI no longer prematurely treats tool-call rounds as final completion.

## 4. Local Configuration Patch

Local file edited (outside repo):
- `~/.9router/db.json`

Applied state:
- Codex connection set/ensured as `authType: "apikey"`
- `providerSpecificData.baseUrl` set to:
  - `https://right.codes/codex/v1`

Backup created:
- `~/.9router/db.json.bak.20260227-102352`

## 5. Verification Summary

Verified outcomes:
- Codex API-key connection is active and using custom base URL path.
- Provider test no longer reports unsupported for Codex API key.
- Stream diagnostics showed complete event flow with `response.completed`.
- After finish-reason fix, CLI "auto end" issue no longer reproduces in current tests.

## 6. Current Modified Files (repo)

- `open-sse/executors/codex.js`
- `src/app/api/providers/[id]/test/testUtils.js`
- `open-sse/handlers/chatCore.js` (Codex translation path guard for responses clients)
- `open-sse/utils/stream.js` (SSE event-tag propagation for translation path)
- `open-sse/translator/response/openai-responses.js`

## 7. Notes For Next Step

If this patch remains local-only:
- Keep current state as-is.

If preparing cleaner long-term branch later:
- Current state is already in "cleaned" form (diagnostic logs removed).
- Keep functional fixes in executor/test/stream translator paths.

## 8. 2026-02-28 Addendum: `codex-su8` Provider ID (API Key, non-OAuth)

Date: 2026-02-28  
Scope: add a new provider ID that reuses Codex runtime behavior, without adding OAuth login flow

### 8.1 Task Requirement (for future re-apply)

Goal:
- Keep existing built-in `codex` provider unchanged.
- Add an additional provider card with a new ID:
  - `codex-su8`
- This new ID must behave like Codex at runtime:
  - Responses API stream behavior
  - Codex executor request transform
  - support `providerSpecificData.baseUrl` + `apiKey`
- No OAuth requirement for `codex-su8`:
  - manage as API key connection
  - allow independent per-connection base URL in `db.json`

Reason:
- Need multiple independent Codex-like cards/accounts with separate `baseUrl + apiKey`.
- Compatible-node flow is not used for this requirement.

### 8.2 Functional Behavior Expected

- UI: `codex-su8` appears in API-key provider list as `OpenAI Codex (Su8)`.
- Connection type: `authType: "apikey"`.
- Runtime routing:
  - requests for `codex-su8/*` use Codex executor path (not generic OpenAI/default executor).
  - same translation/streaming rules as `codex`.
- Validation/test/models endpoints:
  - `codex-su8` accepted in API-key validation.
  - per-connection tests for `codex-su8` use `/models` against configured base URL.
  - model import endpoint supports `codex-su8`.
- Alias/model/pricing:
  - `codex-su8` maps to Codex alias/model pool (`cx`) to reuse existing model definitions/pricing.

### 8.3 Files Modified for This Addendum

- `src/shared/constants/providers.js`
  - add API key provider entry: `codex-su8` (alias `cx8`, display `OpenAI Codex (Su8)`).
- `open-sse/executors/index.js`
  - map `codex-*` provider IDs to `CodexExecutor`.
- `open-sse/services/provider.js`
  - add `isCodexProvider(...)` helper and treat `codex-*` as Codex in config/url/header logic.
- `open-sse/handlers/chatCore.js`
  - extend Codex-specific streaming/translation guards from `provider === "codex"` to `codex-*`.
- `src/app/api/providers/validate/route.js`
  - accept `codex-*` in API-key validation path.
- `src/app/api/providers/[id]/test/testUtils.js`
  - accept `codex-*` in API-key test path (per-connection base URL aware).
- `src/app/api/providers/[id]/models/route.js`
  - accept `codex-*` when fetching provider models.
- `open-sse/config/providerModels.js`
  - add provider-id-to-alias mapping: `codex-su8 -> cx`.
- `open-sse/services/model.js`
  - add alias mapping: `cx8 -> codex-su8`.
- `src/lib/localDb.js`
  - extend pricing provider-id mapping: `codex-su8 -> cx`.

### 8.4 Local `db.json` Example (target shape)

```json
{
  "provider": "codex-su8",
  "authType": "apikey",
  "name": "SU8 Key",
  "apiKey": "sk-***",
  "providerSpecificData": {
    "baseUrl": "https://right.codes/codex/v1"
  }
}
```

Notes:
- Base URL may be `.../v1` or `.../responses`; runtime normalizes to Responses endpoint.
- This addendum does not remove/replace existing `codex` provider.

### 8.5 Re-Execution Checklist (if code was reverted)

1. Re-add `codex-su8` to `APIKEY_PROVIDERS`.
2. Re-introduce `isCodexProvider(...)` helper in runtime/API modules listed above.
3. Ensure `getExecutor` returns `CodexExecutor` for `codex-*`.
4. Re-apply `codex-su8 -> cx` mapping in model/pricing paths.
5. Verify:
   - provider card visible,
   - API-key connection can be created/validated,
   - `/models` import works,
   - chat stream path uses Codex behavior for `codex-su8`.

### 8.6 Backup Template: Add More Codex IDs (`codex-su9`, `codex-su10`, ...)

Use this template when more parallel Codex cards are required.

Code-side pattern:
- Add new provider IDs in `APIKEY_PROVIDERS`:
  - `codex-su9`, `codex-su10`, ...
- Add provider alias entries in `open-sse/services/model.js`:
  - `cx9 -> codex-su9`
  - `cx10 -> codex-su10`
- Map each new provider ID to `cx` model pool:
  - `open-sse/config/providerModels.js` (`PROVIDER_ID_TO_ALIAS`)
  - `src/lib/localDb.js` pricing mapping (`PROVIDER_ID_TO_ALIAS`)
- No extra runtime branching needed if code already uses `provider.startsWith("codex-")`.

`db.json` reusable snippets (example):

```json
{
  "providerConnections": [
    {
      "provider": "codex-su9",
      "authType": "apikey",
      "name": "SU9 Key",
      "apiKey": "sk-***",
      "providerSpecificData": {
        "baseUrl": "https://example-9/codex/v1"
      }
    },
    {
      "provider": "codex-su10",
      "authType": "apikey",
      "name": "SU10 Key",
      "apiKey": "sk-***",
      "providerSpecificData": {
        "baseUrl": "https://example-10/codex/v1"
      }
    }
  ]
}
```

Quick validation after adding each new ID:
1. Provider card appears in dashboard provider list.
2. API key can be checked/saved.
3. `/api/providers/{id}/models` returns model list.
4. `/v1/chat/completions` with `{provider-alias}/{model}` routes through Codex path.
