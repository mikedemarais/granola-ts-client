# Development Guidelines

## Library Architecture & Scope

### Core Principle: Separation of Concerns
- **granola-ts-client is a pure API client library** - it accepts tokens and makes API calls
- **Token extraction/management is NOT the library's responsibility** - that belongs to the application layer
- The library should remain **environment-agnostic** (work in browsers, Node.js, Bun, etc.)
- Do NOT add file system operations, token extraction, or environment-specific code to the library core

### What belongs in the library:
- API client methods (generated from OpenAPI spec)
- HTTP request handling and retry logic
- Type definitions for API responses
- Pagination utilities
- Error handling for API responses

### Optional Utilities (src/utils/):
- Token extraction utilities are exported separately via `granola-ts-client/utils`
- These are **optional helpers** that applications can choose to use
- They are Node.js/Bun specific and will not work in browsers
- The main client (`granola-ts-client`) does NOT depend on these utilities
- Applications can import only what they need:
  - Browser apps: `import GranolaClient from 'granola-ts-client'`
  - Node apps: Can also use `import { extractGranolaToken } from 'granola-ts-client/utils'`

### What does NOT belong in the library core:
- Direct usage of token extraction in the main client
- Authentication flows or token refresh logic in the main client
- Required dependencies on Node.js/Bun APIs
- Credential management in the main client

### Architecture Principle:
- Main client remains pure and environment-agnostic
- Optional utilities are clearly separated and opt-in only
- Build process compiles utilities with `--target node` separately
- Examples demonstrate both pure client usage and utility usage

## Environment
- Use [Bun](https://bun.sh/) for all commands.
- Install dependencies with `bun install`.
- All code is TypeScript and tests run via `bun test`.
- Invoke CLI tools with `bun x`.

## Workflow
- Prefer Bun APIs over external packages and document new dependencies in PRs.
- Run `bun run dev` while coding to format, lint and test automatically.
- Run `bun run ci` before committing; it cleans `dist/`, lints, tests and builds.
- Avoid modifying `tsconfig.json` and use async/await instead of `.then()` chains.

## Linting & Formatting
- Biome enforces style with `bun run format` and `bun run lint`.
- `bun run lint:check` runs in CI.
- Node import protocol is disabled; add `// biome-ignore lint/style/useNodejsImportProtocol` for dynamic imports.
- Additional rules check complexity and disallow `console` calls except `warn`, `error` and `info`.

## Architecture: Stable Wrapper Layer with Proxy Pattern
- The public API (`src/client.ts`) is a stable wrapper around internal implementation
- Generated code lives in `src/internal/generated/` and is NOT exposed directly
- Method names in the public API (e.g., `getWorkspaces()`) never change
- Backwards compatibility is maintained automatically through a Proxy pattern (no code duplication)
- Legacy method names (e.g., `v1_get_workspaces()`) are handled dynamically by the Proxy
- This ensures regenerating the OpenAPI client never breaks consumer code
- Total implementation: ~260 lines (reduced from 447 lines, 42% smaller)

## Types
- Export public types from `src/index.ts` and document them with JSDoc.
- Verify exports with `bun build`.

## Git & PRs
- Make small atomic commits in present tense.
- Branch names: `feature/...` or `fix/...`.
- Before a PR, run `bun run generate` and `bun run ci`.
- PR titles should be imperative and include a summary and **Testing** section listing command results.

## Documentation
- README snippets and files in `examples/` must compile with the generated client.

## Pre-commit
- `bun run format`
- `bun run lint`
- `bun run ci`

## File Sync
- `AGENTS.md` and `CLAUDE.md` must be kept identical.
