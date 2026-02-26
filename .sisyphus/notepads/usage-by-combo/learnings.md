
## Task 3: COMBO_COLUMNS Configuration

**Pattern Applied:**
- Followed existing column definition structure from MODEL_COLUMNS, ACCOUNT_COLUMNS, API_KEY_COLUMNS, ENDPOINT_COLUMNS
- Each column object: `{ field, label, align? }`
- Right-aligned numeric fields: requests, promptTokens, completionTokens, cost, lastUsed

**Implementation:**
- Added COMBO_COLUMNS constant at line 158 in src/shared/components/UsageStats.js
- 6 columns defined: comboName, requests, promptTokens, completionTokens, cost, lastUsed
- Positioned after ENDPOINT_COLUMNS, before TABLE_OPTIONS (consistent with other column definitions)

**Status:** ✓ Complete
- Syntax valid (lsp_diagnostics clean except expected unused hint)
- Structure matches existing patterns
- Ready for Task 4 integration into TABLE_OPTIONS

## Task 5: Combo View Rendering Logic

**Pattern Applied:**
- Followed "model" case structure from lines 248-271 as reference
- Used existing expandable row pattern in UsageTable.js (no changes needed)
- Summary rows show aggregated stats per combo
- Detail rows show individual models within each combo

**Implementation:**
- Added "combo" case in switch statement at line 272
- Groups stats.byCombo by comboName field
- Summary cells: comboName (group key), total requests, dashes for token/cost breakdown, lastUsed
- Detail cells: comboName, requests, promptTokens, completionTokens, cost, lastUsed
- Storage key: "usage-stats:expanded-combos"
- Pending tracking from stats.pending?.byCombo

**Status:** ✓ Complete
- combo case exists in switch statement (line 272)
- Build passes (npm run build successful)
- Follows existing expandable row pattern
- Ready for backend data integration (stats.byCombo)
