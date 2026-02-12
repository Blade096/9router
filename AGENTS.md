# AGENTS.md - Guide for AI Coding Agents

This file contains project-specific conventions and commands for AI agents working in this codebase.

## Project Overview

**9Router** is an AI router built with Next.js 16, React 19, and Tailwind CSS 4. It provides a unified interface for multiple AI providers with automatic format translation, quota tracking, and intelligent fallback routing.

**Tech Stack:**
- Runtime: Node.js 20+
- Framework: Next.js 16 (App Router, Webpack bundler)
- UI: React 19 + Tailwind CSS 4
- Database: LowDB (JSON file-based at `~/.9router/db.json`)
- Auth: OAuth 2.0 (PKCE) + JWT + API Key authentication

---

## Essential Commands

### Development & Build
```bash
npm run dev          # Start dev server (Next.js with Webpack)
npm run build        # Production build
npm run start        # Run production server
```

### Linting
```bash
npx eslint .         # Run ESLint (uses Next.js core-web-vitals config)
```

### Testing
```bash
# Test single request translation
node tester/translator/testFromFile.js <file-path>

# Example:
node tester/translator/testFromFile.js data/claude-to-kiro/3_converted_request.json
```

**Note:** No standard test runner (Jest/Vitest) is configured. Use the custom translator tester for validating request format conversions.

---

## Code Style Guidelines

### Language & Type System
- **Flavor:** Modern JavaScript (ESM) with JSDoc type annotations
- **File Extensions:** `.js` (not `.ts`)
- **Type Documentation:** Use JSDoc extensively for parameters and return values
  ```javascript
  /**
   * Make a POST request
   * @param {string} url - API endpoint
   * @param {object} data - Request body
   * @returns {Promise<object>}
   */
  export async function post(url, data, options = {}) { ... }
  ```

### Import Organization
Order imports in this exact sequence:
1. Built-in Node.js modules (`import crypto from "crypto"`)
2. External libraries (`import { NextResponse } from "next/server"`)
3. Internal aliased modules (`import { foo } from "@/shared/utils/bar"`)
4. Local relative imports (`import "./globals.css"`)

**Path Aliases** (defined in `jsconfig.json`):
- `@/*` → `./src/*`
- `open-sse` → `./open-sse`
- `open-sse/*` → `./open-sse/*`

### Naming Conventions
- **Files:** 
  - Directories: kebab-case (`shared-components`, `cloud-sync`)
  - Utilities/services: camelCase (`apiKey.js`, `initCloudSync.js`) OR kebab-case (`server-init.js`)
  - Next.js routes: `page.js`, `layout.js`, `route.js`
- **Variables/Functions:** camelCase (`generateKeyId`, `handleResponse`)
- **Classes:** PascalCase (`CloudSyncScheduler`, `ThemeProvider`)
- **React Components:** PascalCase (`RootLayout`, `PricingModal`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_HEADERS`, `API_KEY_SECRET`)

### Formatting Rules
- **Indentation:** 2 spaces (no tabs)
- **Quotes:** Double quotes for imports and JSX, mixed in JS code (prefer double)
- **Semicolons:** Always use semicolons
- **Trailing Commas:** Use in multi-line objects/arrays
- **Line Length:** Soft limit ~100 characters

### Error Handling Patterns

**1. API Response Handling:**
```javascript
async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || "An error occurred");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
```

**2. Try-Catch with Fallbacks:**
```javascript
try {
  await riskyOperation();
} catch (error) {
  console.error("Operation failed:", error);
  return null; // Graceful fallback
}
```

**3. Empty Catch for Background Tasks:**
```javascript
// For non-critical periodic tasks
this.syncWithRetry().catch(() => {});
```

---

## File Structure & Patterns

### Directory Organization
```
src/
├── app/                      # Next.js App Router
│   ├── (dashboard)/         # Route groups (logical grouping)
│   ├── api/                 # API routes (HTTP endpoints)
│   ├── layout.js            # Root layout with providers
│   └── page.js              # Home page
├── shared/
│   ├── components/          # Reusable UI components
│   ├── utils/               # Pure utility functions
│   └── services/            # Stateful/orchestrated logic
└── lib/                     # Core integrations (DB, auth)
```

### Component Patterns
- **Client Components:** Mark with `"use client"` at file top
- **Server Components:** Default (no directive needed)
- **State Management:** Use Zustand for complex client state
- **Styling:** Tailwind CSS utility classes, no CSS-in-JS

### API Route Structure
```javascript
// src/app/api/endpoint/route.js
export async function POST(request) {
  // Handle logic
  return NextResponse.json({ data });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    }
  });
}
```

### Service Pattern (Singleton)
```javascript
export class CloudSyncScheduler {
  constructor() { ... }
  async start() { ... }
  stop() { ... }
}

// Singleton export
let instance = null;
export async function getCloudSyncScheduler() {
  if (!instance) instance = new CloudSyncScheduler();
  return instance;
}
```

---

## Common Tasks

### Adding a New API Route
1. Create file: `src/app/api/your-route/route.js`
2. Export named HTTP methods: `GET`, `POST`, `PUT`, `DELETE`
3. Add `OPTIONS` handler for CORS
4. Return `NextResponse.json()` for JSON responses
5. Handle errors with try-catch, return appropriate status codes

### Adding a New Page
1. Create directory: `src/app/your-page/page.js`
2. Export default component function
3. Use `"use client"` if using React hooks
4. Follow naming: `YourPagePage` component

### Creating a Utility Function
1. Place in `src/shared/utils/your-util.js`
2. Export named functions (not default)
3. Add JSDoc comments for params/returns
4. Keep functions pure (no side effects)

### Working with Database
- Database file: `~/.9router/db.json` (LowDB)
- Import from: `@/lib/localDb`
- Always use helper functions, don't access DB directly

---

## Important Constraints

### Database Architecture

**Usage Tracking (SQLite)**
- Location: `~/.9router/usage.sqlite`
- Technology: SQLite with WAL mode
- Schema: `src/lib/schema/usage.sql`
- Features:
  - Batch writes (20 records/batch)
  - WAL mode for concurrent access
  - Indexed queries for performance
  - Views for statistics (daily_stats, provider_stats)

**Legacy Migration**
- Migration script: `scripts/migrate-usage-to-sqlite.js`
- Validation tool: `scripts/validate-migration.js`
- Backup retained: `~/.9router/usage.json.backup`

### What NOT to Do
- **Never** suppress type errors with `@ts-ignore` or `@ts-expect-error`
- **Never** use empty catch blocks for critical paths (only background tasks)
- **Never** commit without testing (even if no formal test suite)
- **Never** modify `node_modules` or generated files in `.next/`

### Before Marking Work Complete
1. Run `npx eslint .` on changed files
2. Verify no console errors in dev server
3. Test the actual functionality in browser
4. Check database writes (if applicable) are correct

---

## Special Notes

- **OAuth Callbacks:** Route handlers at `/api/callback/[provider]` must handle PKCE flow
- **Streaming:** Uses Server-Sent Events (SSE) for real-time updates (see `sse/` directory)
- **Cloud Sync:** Background scheduler syncs every 15min (configurable)
- **Environment Variables:** Check `.env.local` for local dev, never commit secrets
- **Port Default:** Dev server runs on port 3000, production on configured port

---

## Quick Reference

- ESLint Config: `eslint.config.mjs` (Next.js core-web-vitals)
- Path Aliases: `jsconfig.json`
- Tailwind Config: `postcss.config.mjs` (Tailwind CSS 4)
- Next.js Config: `next.config.mjs` (Webpack mode)
- Entry Point: `src/app/layout.js` → `src/app/page.js`

**When in doubt:** Read 3-5 similar files in the codebase to match the existing patterns. Consistency > perfection.
