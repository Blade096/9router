# Usage by Combo Statistics Feature

## TL;DR

> **Quick Summary**: Add "Usage by Combo" aggregation dimension to existing statistics system, enabling users to view usage statistics grouped by combo names with expandable rows showing internal model breakdown.
>
> **Deliverables**:
> - `byCombo` aggregation in `getUsageStats()` function
> - "Usage by Combo" table view in dashboard UI
> - Expandable table rows (combo summary → model details)
> - Tests for combo aggregation logic
>
> **Estimated Effort**: Short
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 5 → Task 8

---

## Context

### Original Request
在已有的统计里面新增一个 Usage by Combo 功能

### Interview Summary

**Key Discussions**:
- **Combo Definition**: Named fallback chain of models (e.g., `premium-coding` = `["cc/claude-opus-4-6", "glm/glm-4.7"]`)
- **Statistics Architecture**: Current system has 6 aggregation dimensions (byProvider, byModel, byAccount, byApiKey, byEndpoint, last10Minutes)
- **Display Columns**: comboName, requests, promptTokens, completionTokens, cost, lastUsed
- **Aggregation Granularity**: Group by combo name (level 1), expandable to show internal models (level 2)
- **UI Format**: Table view only, no charts needed

**Research Findings**:
- Data flow: Request completion → `saveRequestUsage()` → `usage.json` → `getUsageStats()` → UI
- UI components: UsageStats.js (main dashboard), UsageTable.js (sortable expandable table)
- Test framework: Vitest 4.0.0 with clear patterns (vi.mock, describe/it structure)
- Current test coverage: ~0.6% of codebase (mainly embeddings endpoint)

**Critical Decisions Made**:
- **Statistics Attribution**: Requests counted only in byModel, byCombo is a derived view for grouping
- **Non-Combo Requests**: Excluded from byCombo table (only show requests that used combos)
- **Fallback Recording**: Only successful model is recorded (already works in existing usage.json)

### Metis Review

**Identified Gaps** (addressed):
- **Combo Name Propagation**: Since byCombo is derived from byModel data, comboName storage in usage.json is optional for grouping (can be resolved via combo-to-models mapping at aggregation time)
- **Double-Counting Risk**: Resolved - requests only in byModel, byCombo is a virtual view
- **Executable Acceptance Criteria**: All criteria will be written as concrete commands (curl, jq, Playwright)

**Guardrails Applied**:
- **MUST NOT** modify existing aggregation logic (only add new)
- **MUST NOT** add chart visualization for combo usage
- **MUST NOT** change UI for other statistics views
- **MUST NOT** refactor saveRequestUsage signature (only extend if needed)
- **MUST NOT** add combo versioning or historical tracking

**Scope Lock Down**:
- Only aggregate same metrics as other views: requests, promptTokens, completionTokens, cost, lastUsed
- Table view is read-only, no actions or navigation to combo management
- Only store current comboName string, no versioning or model list snapshots

---

## Work Objectives

### Core Objective
Add "Usage by Combo" statistics view to existing usage analytics dashboard, allowing users to see usage grouped by combo names with expandable rows showing internal model breakdown.

### Concrete Deliverables
1. `byCombo` aggregation in `src/lib/usageDb.js` `getUsageStats()` function
2. "Usage by Combo" table view option in `src/shared/components/UsageStats.js`
3. COMBO_COLUMNS configuration following existing column patterns
4. Expandable table rendering in `src/app/(dashboard)/dashboard/usage/components/UsageTable.js`
5. Tests for combo aggregation logic in `/tests/unit/usageDb.combo.test.js`

### Definition of Done
- [ ] byCombo aggregation is returned from `/api/usage/history` endpoint
- [ ] "Usage by Combo" option appears in dashboard table view dropdown
- [ ] Combo table renders with combo names as summary rows
- [ ] Expanding a combo row shows internal models with per-model stats
- [ ] All tests pass (`npm test` in /tests directory)
- [ ] Non-combo requests are excluded from byCombo view

### Must Have
- byCombo aggregation with metrics: requests, promptTokens, completionTokens, cost, lastUsed
- Expandable table rows showing combo → models hierarchy
- "Usage by Combo" option in TABLE_OPTIONS
- Tests for combo aggregation logic
- Non-combo requests excluded from byCombo view

### Must NOT Have (Guardrails)
- Chart visualization for combo usage (explicitly excluded by user)
- Modifications to existing aggregation logic (byProvider, byModel, byAccount, byApiKey, byEndpoint)
- UI changes for other statistics views (model, account, apiKey, endpoint)
- Combo versioning or historical tracking
- Combo management actions in stats view

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.

### Test Decision
- **Infrastructure exists**: YES (Vitest 4.0.0)
- **Automated tests**: Tests after implementation
- **Framework**: Vitest
- **If Tests after**: Tests added after implementation tasks in separate wave

### QA Policy
Every task MUST include agent-executed QA scenarios (see TODO template below).
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Library/Module**: Use Bash (bun/node REPL) — Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

> Maximize throughput by grouping independent tasks into parallel waves.
> Each wave completes before the next begins.
> Target: 5-8 tasks per wave. Fewer than 3 per wave (except final) = under-splitting.

```
Wave 1 (Start Immediately — foundation + data layer):
├── Task 1: Add comboName tracking to saveRequestUsage [quick]
└── Task 2: Add byCombo aggregation to getUsageStats [quick]

Wave 2 (After Wave 1 — UI layer):
├── Task 3: Create COMBO_COLUMNS configuration [quick]
├── Task 4: Add "Usage by Combo" to TABLE_OPTIONS [quick]
└── Task 5: Implement combo view rendering logic [quick]

Wave 3 (After Wave 2 — tests + verification):
├── Task 6: Add tests for combo aggregation logic [quick]
├── Task 7: Integration QA - API verification [unspecified-high]
└── Task 8: Integration QA - UI verification with Playwright [unspecified-high]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 2 → Task 5 → Task 7 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 5 (Waves 1 & 2)
```

### Dependency Matrix

- **1-2**: — — 3-5, 1
- **2**: 1 — 3-5, 6, 2
- **3**: — — 4-5, 2
- **4**: 3 — 5, 2
- **5**: 2, 3, 4 — 7-8, 3
- **6**: 2 — 7, 2
- **7**: 2, 5, 6 — F1-F4, 3
- **8**: 2, 5 — F1-F4, 3

### Agent Dispatch Summary

- **1**: **2** — T1 → `quick`, T2 → `quick`
- **2**: **3** — T3 → `quick`, T4 → `quick`, T5 → `quick`
- **3**: **3** — T6 → `quick`, T7 → `unspecified-high`, T8 → `unspecified-high`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.
> **A task WITHOUT QA Scenarios is INCOMPLETE. No exceptions.**

- [x] 1. Add comboName tracking to saveRequestUsage

  **What to do**:
  - In `src/lib/usageDb.js`, modify `saveRequestUsage()` function to accept optional `comboName` parameter
  - Store `comboName` in usage entry if provided
  - Update all call sites in `open-sse/handlers/chatCore.js` to pass `comboName` (set to null by default for non-combo requests)
  - Ensure backward compatibility: existing usage entries without `comboName` should not break parsing

  **Must NOT do**:
  - Change existing signature breaking compatibility
  - Modify existing aggregation logic (byProvider, byModel, etc.)

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Simple parameter addition to existing function, clear pattern to follow
  - **Skills**: []
    - No specialized skills needed - straightforward code modification
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for this task (no git operations)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 2 (byCombo aggregation depends on comboName being stored)
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `src/lib/usageDb.js:saveRequestUsage()` - Current function signature and storage pattern
  - `open-sse/handlers/chatCore.js:411-764` - All call sites of saveRequestUsage

  **API/Type References** (contracts to implement against):
  - None - extending existing function

  **Test References** (testing patterns to follow):
  - `tests/unit/embeddingsCore.test.js` - Test structure and mocking patterns

  **External References** (libraries and frameworks):
  - None

  **WHY Each Reference Matters** (explain the relevance):
  - `saveRequestUsage()`: Shows current parameter structure and how to add optional parameter without breaking existing calls
  - `chatCore.js`: Shows all call sites that need to be updated to pass comboName (can be null for non-combo requests)
  - `embeddingsCore.test.js`: Shows how to write unit tests with proper mocking and assertion style

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.

  **If Tests after**:
  - [ ] Test file created: tests/unit/usageDb.combo.test.js
  - [ ] bun test tests/unit/usageDb.combo.test.js → PASS (all tests)

  **QA Scenarios (MANDATORY — task is INCOMPLETE without these):**

  > **This is NOT optional. A task without QA scenarios WILL BE REJECTED.**
  >
  > Write scenario tests that verify the ACTUAL BEHAVIOR of what you built.
  > Minimum: 1 happy path + 1 failure/edge case per task.
  > Each scenario = exact tool + exact steps + exact assertions + evidence path.
  >
  > **The executing agent MUST run these scenarios after implementation.**
  > **The orchestrator WILL verify evidence files exist before marking task complete.**

  ```
  Scenario: comboName is saved to usage entry for combo requests
    Tool: Bash (curl + jq)
    Preconditions: Combo "test-combo" exists in db.json, server is running
    Steps:
      1. Send chat request with combo model:
         curl -X POST http://localhost:20128/v1/chat/completions \
           -H "Authorization: Bearer test-key" \
           -H "Content-Type: application/json" \
           -d '{"model": "test-combo", "messages": [{"role": "user", "content": "hello"}]}'
      2. Wait 2 seconds for usage entry to be written
      3. Extract comboName from last usage entry:
         jq '.history[-1].comboName' ~/.9router/usage.json
    Expected Result: Output is "test-combo"
    Failure Indicators: Output is null, empty string, or jq errors
    Evidence: .sisyphus/evidence/task-1-combo-name-saved.txt

  Scenario: comboName is null for non-combo requests
    Tool: Bash (curl + jq)
    Preconditions: Server is running, direct model (not combo) is available
    Steps:
      1. Send chat request with direct model:
         curl -X POST http://localhost:20128/v1/chat/completions \
           -H "Authorization: Bearer test-key" \
           -H "Content-Type: application/json" \
           -d '{"model": "cc/claude-opus-4-6", "messages": [{"role": "user", "content": "hello"}]}'
      2. Wait 2 seconds for usage entry to be written
      3. Extract comboName from last usage entry:
         jq '.history[-1].comboName' ~/.9router/usage.json
    Expected Result: Output is null
    Failure Indicators: Output is a string value (should be null for non-combo)
    Evidence: .sisyphus/evidence/task-1-combo-name-null-direct.txt
  ```

  **Evidence to Capture**:
  - [ ] Each evidence file named: task-{N}-{scenario-slug}.{ext}
  - [ ] Command output saved for verification

  **Commit**: NO (groups with Task 2)
  - Message: `feat(usage): add comboName tracking to saveRequestUsage`
  - Files: `src/lib/usageDb.js`, `open-sse/handlers/chatCore.js`
  - Pre-commit: `npm test` (after Task 6)

- [x] 2. Add byCombo aggregation to getUsageStats

  **What to do**:
  - In `src/lib/usageDb.js`, add `byCombo` aggregation to `getUsageStats()` function
  - Follow exact pattern of `byModel` aggregation (lines 596-618)
  - Group usage entries by `entry.comboName`
  - Only include entries where `entry.comboName` is not null
  - For each combo, aggregate: requests, promptTokens, completionTokens, cost, lastUsed
  - Group models within combo: for each combo, create nested object keyed by model name with same metrics
  - Return `byCombo` object in stats result

  **Must NOT do**:
  - Modify existing aggregation logic (byProvider, byModel, byAccount, byApiKey, byEndpoint)
  - Change data structure of other aggregations

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Follows established pattern, straightforward aggregation logic
  - **Skills**: []
    - No specialized skills needed - pattern replication task
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for this task

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 3-5 (UI layer depends on byCombo aggregation)
  - **Blocked By**: Task 1 (depends on comboName being stored)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `src/lib/usageDb.js:getUsageStats()` - Lines 596-618 (byModel aggregation pattern)
  - `src/lib/usageDb.js:getUsageStats()` - Lines 620-642 (byAccount aggregation pattern)
  - `src/lib/usageDb.js:getUsageStats()` - Return statement structure

  **API/Type References** (contracts to implement against):
  - Same data structure as byModel: `{ requests, promptTokens, completionTokens, cost, lastUsed, models: {} }`

  **Test References** (testing patterns to follow):
  - `tests/unit/embeddingsCore.test.js` - Test structure for aggregation functions

  **External References** (libraries and frameworks):
  - None

  **WHY Each Reference Matters** (explain the relevance):
  - `byModel pattern`: Shows exact aggregation logic to replicate (loop, extract tokens, calculate cost, build stats object)
  - `byAccount pattern`: Shows grouping with nested structure (account → model hierarchy) similar to combo → models
  - `Return statement`: Shows where to add byCombo in the returned stats object

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.

  **If Tests after**:
  - [ ] Test file created: tests/unit/usageDb.combo.test.js
  - [ ] bun test tests/unit/usageDb.combo.test.js → PASS (all tests)

  **QA Scenarios (MANDATORY — task is INCOMPLETE without these):**

  > **This is NOT optional. A task without QA scenarios WILL BE REJECTED.**
  >
  > Write scenario tests that verify the ACTUAL BEHAVIOR of what you built.
  > Minimum: 1 happy path + 1 failure/edge case per task.
  > Each scenario = exact tool + exact steps + exact assertions + evidence path.
  >
  > **The executing agent MUST run these scenarios after implementation.**
  > **The orchestrator WILL verify evidence files exist before marking task complete.**

  ```
  Scenario: getUsageStats returns byCombo aggregation with combo names as keys
    Tool: Bash (curl + jq)
    Preconditions: Server is running, usage.json has combo requests
    Steps:
      1. Fetch usage stats from API:
         curl -s http://localhost:20128/api/usage/history | jq '.byCombo'
    Expected Result: Returns object with combo names as keys (e.g., `{"test-combo": {...}, "premium-coding": {...}}`)
    Failure Indicators: Output is null, empty object {}, or missing expected combo names
    Evidence: .sisyphus/evidence/task-2-bycombo-structure.txt

  Scenario: byCombo aggregates metrics correctly per combo
    Tool: Bash (curl + jq)
    Preconditions: usage.json has 2 requests for "test-combo": 1 with 100 prompt tokens, 50 completion tokens; 1 with 200 prompt tokens, 100 completion tokens
    Steps:
      1. Fetch usage stats and extract "test-combo" metrics:
         curl -s http://localhost:20128/api/usage/history | jq '.byCombo["test-combo"]'
    Expected Result: Returns `{ requests: 2, promptTokens: 300, completionTokens: 150, cost: <calculated>, lastUsed: <timestamp> }`
    Failure Indicators: Metrics don't match expected totals, cost is not calculated, lastUsed is missing
    Evidence: .sisyphus/evidence/task-2-bycombo-aggregation.txt

  Scenario: byCombo excludes non-combo requests
    Tool: Bash (curl + jq)
    Preconditions: usage.json has both combo and non-combo requests
    Steps:
      1. Fetch usage stats and check all combo keys:
         curl -s http://localhost:20128/api/usage/history | jq '.byCombo | keys'
    Expected Result: Only combo names appear in keys, direct model requests are excluded
    Failure Indicators: Direct model names (e.g., "claude-opus-4-6 (cc)") appear in byCombo keys
    Evidence: .sisyphus/evidence/task-2-bycombo-excludes-direct.txt

  Scenario: byCombo shows nested models within combo
    Tool: Bash (curl + jq)
    Preconditions: usage.json has 2 requests using "test-combo" that resolved to different models
    Steps:
      1. Fetch usage stats and check models object within combo:
         curl -s http://localhost:20128/api/usage/history | jq '.byCombo["test-combo"].models'
    Expected Result: Returns object with model names as keys and per-model stats
    Failure Indicators: models object is missing, null, or empty
    Evidence: .sisyphus/evidence/task-2-bycombo-nested-models.txt
  ```

  **Evidence to Capture**:
  - [ ] Each evidence file named: task-{N}-{scenario-slug}.{ext}
  - [ ] JSON output saved for verification

  **Commit**: YES (groups with Task 1)
  - Message: `feat(usage): add byCombo aggregation to getUsageStats`
  - Files: `src/lib/usageDb.js`
  - Pre-commit: `npm test` (after Task 6)

- [x] 4. Add "Usage by Combo" to TABLE_OPTIONS
- [x] 3. Create COMBO_COLUMNS configuration
  **What to do**:
  - In `src/shared/components/UsageStats.js`, define COMBO_COLUMNS constant following MODEL_COLUMNS pattern (lines 127-132)
  - Columns: comboName, requests, promptTokens, completionTokens, cost, lastUsed
  - Each column definition: { key, label, sortable, formatFn }
  - comboName: display as-is
  - requests: integer, sort numerically
  - promptTokens/completionTokens: integer, format with commas
  - cost: currency format ($0.00)
  - lastUsed: relative time format ("2 hours ago")

  **Must NOT do**:
  - Modify MODEL_COLUMNS or other column definitions
  - Add columns beyond the specified set

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Simple constant definition, follows existing pattern
  - **Skills**: []
    - No specialized skills needed - configuration task
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for this task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 4 (TABLE_OPTIONS depends on COMBO_COLUMNS)
  - **Blocked By**: Task 2 (depends on byCombo aggregation data structure)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `src/shared/components/UsageStats.js:MODEL_COLUMNS` - Lines 127-132, column definition pattern
  - `src/shared/components/UsageStats.js:ACCOUNT_COLUMNS` - Alternative column definition reference

  **API/Type References** (contracts to implement against):
  - byCombo data structure: { comboName, requests, promptTokens, completionTokens, cost, lastUsed, models: {} }

  **Test References** (testing patterns to follow):
  - None - UI configuration, no tests needed

  **External References** (libraries and frameworks):
  - None

  **WHY Each Reference Matters** (explain the relevance):
  - `MODEL_COLUMNS`: Shows exact structure to replicate for COMBO_COLUMNS (key, label, sortable, formatFn)
  - `ACCOUNT_COLUMNS`: Shows alternative column definitions for reference on different data types

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.

  **QA Scenarios (MANDATORY — task is INCOMPLETE without these):**

  > **This is NOT optional. A task without QA scenarios WILL BE REJECTED.**
  >
  > Write scenario tests that verify the ACTUAL BEHAVIOR of what you built.
  > Minimum: 1 happy path + 1 failure/edge case per task.
  > Each scenario = exact tool + exact steps + exact assertions + evidence path.
  >
  > **The executing agent MUST run these scenarios after implementation.**
  > **The orchestrator WILL verify evidence files exist before marking task complete.**

  ```
  Scenario: COMBO_COLUMNS constant is defined with correct structure
    Tool: Bash (grep)
    Preconditions: File modified with COMBO_COLUMNS constant
    Steps:
      1. Search for COMBO_COLUMNS definition:
         grep -n "const COMBO_COLUMNS" src/shared/components/UsageStats.js
      2. Extract the line to verify structure:
         grep -A 10 "const COMBO_COLUMNS" src/shared/components/UsageStats.js
    Expected Result: Line found, definition includes all 6 columns (comboName, requests, promptTokens, completionTokens, cost, lastUsed)
    Failure Indicators: grep returns no results, constant is commented out, or missing columns
    Evidence: .sisyphus/evidence/task-3-combo-columns-defined.txt
  ```

  **Evidence to Capture**:
  - [ ] Each evidence file named: task-{N}-{scenario-slug}.{ext}
  - [ ] Grep output saved for verification

  **Commit**: NO (groups with Tasks 4, 5)
  - Message: `feat(usage): add COMBO_COLUMNS configuration`
  - Files: `src/shared/components/UsageStats.js`
  - Pre-commit: `npm test` (after Task 6)

- [ ] 4. Add "Usage by Combo" to TABLE_OPTIONS

  **What to do**:
  - In `src/shared/components/UsageStats.js`, add new option to TABLE_OPTIONS array (around line 158-163)
  - Follow existing pattern for "model" option
  - New option: { id: "combo", label: "Usage by Combo", columns: COMBO_COLUMNS }
  - Position: After "model" option or at appropriate position in dropdown

  **Must NOT do**:
  - Modify existing TABLE_OPTIONS entries
  - Change option structure or label format

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Simple array entry addition, clear pattern to follow
  - **Skills**: []
    - No specialized skills needed - configuration task
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for this task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Task 5 (combo view rendering depends on TABLE_OPTIONS)
  - **Blocked By**: Task 3 (depends on COMBO_COLUMNS being defined)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `src/shared/components/UsageStats.js:TABLE_OPTIONS` - Lines 158-163, option definition pattern
  - `src/shared/components/UsageStats.js:case "model"` - Lines 238-261, rendering logic for model view

  **API/Type References** (contracts to implement against):
  - None - adding to existing array

  **Test References** (testing patterns to follow):
  - None - UI configuration, no tests needed

  **External References** (libraries and frameworks):
  - None

  **WHY Each Reference Matters** (explain the relevance):
  - `TABLE_OPTIONS`: Shows exact array structure to replicate (id, label, columns reference)
  - `case "model"`: Shows how to reference table data from stats (e.g., stats.byModel)

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.

  **QA Scenarios (MANDATORY — task is INCOMPLETE without these):**

  > **This is NOT optional. A task without QA scenarios WILL BE REJECTED.**
  >
  > Write scenario tests that verify the ACTUAL BEHAVIOR of what you built.
  > Minimum: 1 happy path + 1 failure/edge case per task.
  > Each scenario = exact tool + exact steps + exact assertions + evidence path.
  >
  > **The executing agent MUST run these scenarios after implementation.**
  > **The orchestrator WILL verify evidence files exist before marking task complete.**

  ```
  Scenario: "Usage by Combo" option appears in TABLE_OPTIONS
    Tool: Bash (grep)
    Preconditions: TABLE_OPTIONS modified
    Steps:
      1. Search for "Usage by Combo" in UsageStats.js:
         grep -n "Usage by Combo" src/shared/components/UsageStats.js
    Expected Result: Line found with option definition
    Failure Indicators: grep returns no results, option is commented out
    Evidence: .sisyphus/evidence/task-4-combo-option-added.txt
  ```

  **Evidence to Capture**:
  - [ ] Each evidence file named: task-{N}-{scenario-slug}.{ext}
  - [ ] Grep output saved for verification

  **Commit**: NO (groups with Tasks 3, 5)
  - Message: `feat(usage): add Usage by Combo to TABLE_OPTIONS`
  - Files: `src/shared/components/UsageStats.js`
  - Pre-commit: `npm test` (after Task 6)

- [x] 5. Implement combo view rendering logic

  **What to do**:
  - In `src/shared/components/UsageStats.js`, add case "combo" in table view switch statement (around line 238-261)
  - Follow existing pattern for case "model"
  - Set groupedData to group combo stats by combo name
  - Set renderDetailCells and renderSummaryCells functions for combo-specific rendering
  - In `src/app/(dashboard)/dashboard/usage/components/UsageTable.js`, handle combo data structure for expandable rows
  - Summary row: show combo name and total stats
  - Detail rows (expanded): show individual models with per-model stats

  **Must NOT do**:
  - Modify existing case statements (model, account, apiKey, endpoint)
  - Change table structure or expandable row mechanism

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `visual-engineering`
    - Reason: UI rendering logic requires understanding React components and table patterns
  - **Skills**: []
    - No specialized skills needed - follows existing UI patterns
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for this task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: Tasks 7-8 (QA depends on combo view rendering)
  - **Blocked By**: Task 2 (depends on byCombo aggregation), Task 4 (depends on TABLE_OPTIONS)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `src/shared/components/UsageStats.js:case "model"` - Lines 238-261, view configuration pattern
  - `src/app/(dashboard)/dashboard/usage/components/UsageTable.js` - Expandable row rendering implementation

  **API/Type References** (contracts to implement against):
  - byCombo data structure: { comboName, requests, promptTokens, completionTokens, cost, lastUsed, models: {} }

  **Test References** (testing patterns to follow):
  - None - UI rendering, tested via Playwright in Task 8

  **External References** (libraries and frameworks):
  - None

  **WHY Each Reference Matters** (explain the relevance):
  - `case "model"`: Shows exact pattern for configuring table view (groupedData, render functions)
  - `UsageTable.js`: Shows expandable row mechanism to replicate for combo → models hierarchy

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.

  **QA Scenarios (MANDATORY — task is INCOMPLETE without these):**

  > **This is NOT optional. A task without QA scenarios WILL BE REJECTED.**
  >
  > Write scenario tests that verify the ACTUAL BEHAVIOR of what you built.
  > Minimum: 1 happy path + 1 failure/edge case per task.
  > Each scenario = exact tool + exact steps + exact assertions + evidence path.
  >
  > **The executing agent MUST run these scenarios after implementation.**
  > **The orchestrator WILL verify evidence files exist before marking task complete.**

  ```
  Scenario: combo view renders with combo names as summary rows
    Tool: Bash (curl + grep)
    Preconditions: Server is running, usage.json has combo requests
    Steps:
      1. Fetch dashboard HTML and search for combo table rendering:
         curl -s http://localhost:20128/dashboard/usage | grep -i "combo"
    Expected Result: HTML contains combo-related rendering code or data
    Failure Indicators: No combo-related HTML found, grep returns no results
    Evidence: .sisyphus/evidence/task-5-combo-view-renders.txt
  ```

  **Evidence to Capture**:
  - [ ] Each evidence file named: task-{N}-{scenario-slug}.{ext}
  - [ ] HTML grep output saved for verification

  **Commit**: YES (groups with Tasks 3, 4)
  - Message: `feat(usage): add combo view rendering logic`
  - Files: `src/shared/components/UsageStats.js`, `src/app/(dashboard)/dashboard/usage/components/UsageTable.js`
  - Pre-commit: `npm test` (after Task 6)

- [x] 6. Add tests for combo aggregation logic

  **What to do**:
  - Create `/tests/unit/usageDb.combo.test.js`
  - Test byCombo aggregation in getUsageStats()
  - Test cases:
    - comboName is saved for combo requests
    - comboName is null for non-combo requests
    - byCombo aggregation returns correct structure
    - byCombo excludes non-combo requests
    - byCombo shows nested models within combo
    - byCombo calculates correct totals (requests, tokens, cost)
  - Follow testing patterns from embeddingsCore.test.js
  - Use vi.mock() for external dependencies
  - Use describe/it structure for test organization

  **Must NOT do**:
  - Add tests for existing aggregation logic (only test new byCombo code)

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Straightforward unit tests following existing patterns
  - **Skills**: []
    - No specialized skills needed - test writing follows established conventions
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for this task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8)
  - **Blocks**: Tasks 7-8 (QA depends on tests passing)
  - **Blocked By**: Task 2 (depends on byCombo aggregation being implemented)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `tests/unit/embeddingsCore.test.js` - Test structure, mocking patterns, assertion style
  - `tests/unit/oauth-cursor-auto-import.test.js` - Simplified test structure for reference

  **API/Type References** (contracts to implement against):
  - getUsageStats() function signature and return type
  - byCombo data structure

  **Test References** (testing patterns to follow):
  - Above - following embeddingsCore.test.js pattern

  **External References** (libraries and frameworks):
  - Vitest documentation: https://vitest.dev/guide/

  **WHY Each Reference Matters** (explain the relevance):
  - `embeddingsCore.test.js`: Shows comprehensive test patterns including mocking, setup/teardown, and assertion styles
  - `oauth-cursor-auto-import.test.js`: Shows simpler test structure for straightforward logic

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.

  **QA Scenarios (MANDATORY — task is INCOMPLETE without these):**

  > **This is NOT optional. A task without QA scenarios WILL BE REJECTED.**
  >
  > Write scenario tests that verify the ACTUAL BEHAVIOR of what you built.
  > Minimum: 1 happy path + 1 failure/edge case per task.
  > Each scenario = exact tool + exact steps + exact assertions + evidence path.
  >
  > **The executing agent MUST run these scenarios after implementation.**
  > **The orchestrator WILL verify evidence files exist before marking task complete.**

  ```
  Scenario: All tests pass
    Tool: Bash (bun test)
    Preconditions: Test file created at /tests/unit/usageDb.combo.test.js
    Steps:
      1. Run tests from tests directory:
         cd /tests && npm test usageDb.combo.test.js
    Expected Result: All tests pass, no failures
    Failure Indicators: Test failures, errors, or no tests found
    Evidence: .sisyphus/evidence/task-6-tests-pass.txt
  ```

  **Evidence to Capture**:
  - [ ] Each evidence file named: task-{N}-{scenario-slug}.{ext}
  - [ ] Test run output saved for verification

  **Commit**: YES
  - Message: `test(usage): add combo aggregation tests`
  - Files: `tests/unit/usageDb.combo.test.js`
  - Pre-commit: `cd tests && npm test`

- [ ] 7. Integration QA - API verification

  **What to do**:
  - Run all QA scenarios from Tasks 1-2 that involve API endpoints
  - Verify byCombo aggregation is returned from `/api/usage/history`
  - Test with sample data:
    - Create combo requests via API
    - Verify comboName is stored in usage.json
    - Verify byCombo aggregation includes the combo
    - Verify non-combo requests are excluded
  - Capture evidence for all scenarios

  **Must NOT do**:
  - Skip any QA scenarios from previous tasks

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-high`
    - Reason: Comprehensive QA requiring attention to detail and multiple verification steps
  - **Skills**: []
    - No specialized skills needed - uses curl and jq for verification
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for this task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 8)
  - **Blocks**: F1-F4 (Final verification depends on QA completion)
  - **Blocked By**: Tasks 1-6 (all implementation must be complete)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - None - executing QA scenarios from previous tasks

  **API/Type References** (contracts to implement against):
  - `/api/usage/history` endpoint response structure

  **Test References** (testing patterns to follow):
  - QA scenarios from Tasks 1-2

  **External References** (libraries and frameworks):
  - None

  **WHY Each Reference Matters** (explain the relevance):
  - N/A - executing previously defined QA scenarios

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.

  **QA Scenarios (MANDATORY — task is INCOMPLETE without these):**

  > **This is NOT optional. A task without QA scenarios WILL BE REJECTED.**
  >
  > Write scenario tests that verify the ACTUAL BEHAVIOR of what you built.
  > Minimum: 1 happy path + 1 failure/edge case per task.
  > Each scenario = exact tool + exact steps + exact assertions + evidence path.
  >
  > **The executing agent MUST run these scenarios after implementation.**
  > **The orchestrator WILL verify evidence files exist before marking task complete.**

  ```
  Scenario: All API QA scenarios pass
    Tool: Bash (execute all scenarios)
    Preconditions: Implementation complete, server running
    Steps:
      1. Run all QA scenarios from Tasks 1-2
      2. Verify each scenario produces expected output
      3. Check all evidence files exist
    Expected Result: All API scenarios pass, evidence files captured
    Failure Indicators: Any scenario fails, missing evidence files
    Evidence: .sisyphus/evidence/task-7-api-qa-summary.txt
  ```

  **Evidence to Capture**:
  - [ ] Each evidence file named: task-{N}-{scenario-slug}.{ext}
  - [ ] QA summary report saved

  **Commit**: NO
  - [x] 7. Integration QA - API verification

- [x] 8. Integration QA - UI verification with Playwright

  **What to do**:
  - Run all QA scenarios from Tasks 3-5 that involve UI rendering
  - Use Playwright to:
    - Navigate to /dashboard/usage
    - Select "Usage by Combo" from dropdown
    - Verify combo table renders with combo names
    - Click combo row to expand
    - Verify child rows show internal models
    - Verify metrics display correctly
  - Capture screenshots for verification

  **Must NOT do**:
  - Skip any QA scenarios from previous tasks

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-high`
    - Reason: UI QA requiring browser automation and visual verification
  - **Skills**: [`playwright`]
    - `playwright`: Required for browser automation, screenshot capture, and UI interaction
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for this task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 7)
  - **Blocks**: F1-F4 (Final verification depends on QA completion)
  - **Blocked By**: Tasks 1-5 (all implementation must be complete)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - None - executing QA scenarios from previous tasks

  **API/Type References** (contracts to implement against):
  - None - UI verification

  **Test References** (testing patterns to follow):
  - QA scenarios from Tasks 3-5

  **External References** (libraries and frameworks):
  - Playwright documentation: https://playwright.dev/docs/intro

  **WHY Each Reference Matters** (explain the relevance):
  - N/A - executing previously defined QA scenarios

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.

  **QA Scenarios (MANDATORY — task is INCOMPLETE without these):**

  > **This is NOT optional. A task without QA scenarios WILL BE REJECTED.**
  >
  > Write scenario tests that verify the ACTUAL BEHAVIOR of what you built.
  > Minimum: 1 happy path + 1 failure/edge case per task.
  > Each scenario = exact tool + exact steps + exact assertions + evidence path.
  >
  > **The executing agent MUST run these scenarios after implementation.**
  > **The orchestrator WILL verify evidence files exist before marking task complete.**

  ```
  Scenario: All UI QA scenarios pass
    Tool: skill_mcp (playwright)
    Preconditions: Implementation complete, server running
    Steps:
      1. Navigate to /dashboard/usage
      2. Select "Usage by Combo" from dropdown
      3. Verify combo table renders
      4. Click combo row to expand
      5. Verify child rows show models
      6. Capture screenshots
    Expected Result: All UI interactions work correctly, screenshots captured
    Failure Indicators: UI errors, missing elements, screenshots not captured
    Evidence: .sisyphus/evidence/task-8-ui-qa-summary.txt + screenshots
  ```

  **Evidence to Capture**:
  - [ ] Each evidence file named: task-{N}-{scenario-slug}.{ext}
  - [ ] QA summary report saved
  - [ ] Screenshots captured in .sisyphus/evidence/task-8-screenshots/

  **Commit**: NO
  - QA task, no code changes

---

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `bun test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `feat(usage): add comboName tracking and byCombo aggregation` — src/lib/usageDb.js, open-sse/handlers/chatCore.js
- **2**: `feat(usage): add Usage by Combo table view` — src/shared/components/UsageStats.js, src/app/(dashboard)/dashboard/usage/components/UsageTable.js
- **3**: `test(usage): add combo aggregation tests` — tests/unit/usageDb.combo.test.js

---

## Success Criteria

### Verification Commands
```bash
# Verify byCombo aggregation exists in API response
curl -s http://localhost:20128/api/usage/history | jq '.byCombo'
# Expected: Object with combo names as keys

# Verify "Usage by Combo" option exists in UI
curl -s http://localhost:20128/dashboard/usage | grep 'Usage by Combo'
# Expected: Found in HTML

# Verify combo table renders
# (Manual: Navigate to /dashboard/usage, select "Usage by Combo" from dropdown)
# Expected: Table shows combo names as rows, expandable to show models

# Run all tests
cd tests && npm test
# Expected: All tests pass
```

### Final Checklist
- [ ] byCombo aggregation returned from API
- [ ] "Usage by Combo" option in table view dropdown
- [ ] Combo table renders with correct metrics
- [ ] Expandable rows show internal models
- [ ] Non-combo requests excluded from byCombo view
- [ ] All tests pass
- [ ] No breaking changes to existing aggregations
- [ ] No charts added (table view only)
