# Granola SDK for Bun + TypeScript

A concise blueprint that an autonomous LLM agent (or any engineer) can follow to generate a fully‑typed, production‑ready client for the unofficial **Granola API**.

---

## 0 · What You’ll Build

*   **Package name:** `granola-ts-client`
*   **Runtime:** [Bun](https://bun.sh/) (ESM only)
*   **Language:** TypeScript
*   **Output:** `dist/` (ESM + `.d.ts`)
*   **Key features:**
    *   Typed methods for every public endpoint in `openapi.yaml`
    *   Built‑in retry with exponential back‑off (honours `Retry‑After`)
    *   Optional auto‑pagination iterator
    *   Zero external runtime deps
    *   Lint/format with **Biome**
    *   One‑command docs generation with **TypeDoc**

---

## 1 · Prerequisites

| Item | Reason |
|------|--------|
| `openapi.yaml`, `API.md`, `CLAUDE.md` | Spec + high‑level docs + coding guidelines |
| Bun ≥ 1.1 | Native fetch, test runner, bundler |
| Node‑style `.env` file | Supplies `GRANOLA_TOKEN` for dev/tests |

> ℹ️ Stateless by design — caching is left to the integrator.

---

## 2 · Project Bootstrap

```bash
bun init granola-ts-client               # tsconfig.json & index.ts
cd granola-ts-client
bun add -d openapi-typescript biome typedoc # dev‑only deps
```

`package.json` essentials (omit unrelated fields for brevity):

```jsonc
{
  "name": "granola-ts-client",
  "version": "0.1.0",
  "type": "module",
  "exports": { ".": "./dist/index.js" },
  "types": "./dist/index.d.ts",
  "scripts": {
    "generate": "openapi-typescript openapi.yaml -o src/schema.d.ts",
    "build":    "bun build src/index.ts --outdir dist",
    "test":     "bun test",
    "format":   "biome format . --write",
    "lint":     "biome check .",
    "docs":     "typedoc --entryPoints src/index.ts --out docs"
  }
}
```

Run `bun run generate` whenever the spec changes.

---

## 3 · Suggested Layout

```
.
├── src/
│   ├── http.ts          # fetch wrapper w/ retry
│   ├── pagination.ts    # async iterator helper
│   ├── client.ts        # GranolaClient class
│   └── index.ts         # re‑export default
├── openapi.yaml         # API spec (provided)
├── schema.d.ts          # generated types (git‑ignored)
├── tests/
│   └── client.test.ts
└── docs/                # generated HTML docs
```

---

## 4 · Implementation Highlights

### 4.1 HTTP Layer (`src/http.ts`)

* Wraps global `fetch`
* `timeout` (ms) and `retries` exposed via constructor
* Exponential back‑off: `delay = res.headers["Retry‑After"] ?? 2^attempt × 250ms`

### 4.2 Pagination (`src/pagination.ts`)

```ts
export async function* paginate<T>(fetchPage: (cursor?: string) => Promise<{ items: T[]; next?: string }>) {
  let cursor: string | undefined;
  do {
    const { items, next } = await fetchPage(cursor);
    for (const i of items) yield i;
    cursor = next;
  } while (cursor);
}
```

### 4.3 Client (`src/client.ts`)

```ts
import { Http, HttpOpts } from './http';
import { paginate } from './pagination';
import type { WorkspaceResponse, DocumentsResponse /* … */ } from './schema';

export interface ClientOpts extends HttpOpts { baseUrl?: string; }

export class GranolaClient {
  private http: Http;
  constructor(token = process.env.GRANOLA_TOKEN!, opts: ClientOpts = {}) {
    this.http = new Http(token, opts.baseUrl, opts);
  }

  // Workspaces
  getWorkspaces() {
    return this.http.post<WorkspaceResponse>('/v1/get-workspaces');
  }

  // Documents
  getDocuments(filters = {}) {
    return this.http.post<DocumentsResponse>('/v2/get-documents', filters);
  }
  async *listAllDocuments(filters = {}) {
    yield* paginate(async (cursor?: string) => {
      const r = await this.getDocuments({ ...filters, cursor });
      return { items: r.docs, next: (r as any).next_cursor };
    });
  }

  // add remaining endpoints here …
}
export default GranolaClient;
```

---

## 5 · Endpoint Checklist (MVP)

| Client method | HTTP path |
|---------------|-----------|
| `getWorkspaces()` | `POST /v1/get-workspaces` |
| `getDocuments()` / `listAllDocuments()` | `POST /v2/get-documents` |
| `getDocumentMetadata(id)` | `POST /v1/get-document-metadata` |
| `getDocumentTranscript(id)` | `POST /v1/get-document-transcript` |
| `updateDocument(payload)` | `POST /v1/update-document` |
| `updateDocumentPanel(payload)` | `POST /v1/update-document-panel` |
| `getPanelTemplates()` | `POST /v1/get-panel-templates` |
| `getPeople()` | `POST /v1/get-people` |
| `getFeatureFlags()` | `POST /v1/get-feature-flags` |
| `getNotionIntegration()` | `POST /v1/get-notion-integration` |
| `getSubscriptions()` | `POST /v1/get-subscriptions` |
| `refreshGoogleEvents()` | `POST /v1/refresh-google-events` |
| `checkForUpdate()` | `GET  /v1/check-for-update/latest-mac.yml` |

---

## 6 · Dev Workflow

1. **Commit 1:** scaffold, add spec, generate types.
2. **Commit 2:** implement `http.ts` (+ tests).
3. **Commit 3:** implement `client.ts` for first 4 endpoints.
4. Incremental commits: one per new endpoint, docs, CI, etc.

---

## 7 · Quality Gates

* **Lint:** `bun run lint`
* **Format:** `bun run format`
* **Test:** `bun test` (mock `fetch` via `bun:mock`)
* **Docs:** `bun run docs` → `docs/`
* **CI:** GitHub Action: `lint → test → build → docs`

---

## 8 · Publish

```bash
bun run build
bun publish --access public
```

---

## 9 · Reference Files

* `openapi.yaml` — machine‑readable spec (generates `schema.d.ts`)
* `API.md` — human‑readable endpoint docs
* `CLAUDE.md` — engineering conventions

All relevant context is distilled here; no external conversation history required.

