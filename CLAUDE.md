# Development Guidelines

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
