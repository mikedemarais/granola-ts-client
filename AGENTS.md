# Development Guidelines

## CRITICAL: You Are Building a Library That Others Depend On

### Golden Rules of Library Development

1. **NEVER BREAK EXISTING USAGE PATTERNS**
   - If `new GranolaClient(token)` works today, it must work tomorrow
   - If it returns data today, it must return the same structure tomorrow
   - Breaking changes = major version bump (1.0.0 → 2.0.0)

2. **FAIL LOUDLY, NEVER SILENTLY**
   ```typescript
   // ❌ NEVER DO THIS:
   if (!token) return [];  // Silent failure
   
   // ✅ ALWAYS DO THIS:
   if (!token) throw new Error('Authentication required');
   ```

3. **TEST WITH REAL CONSUMER CODE**
   ```bash
   # Before ANY release:
   cd ../test-consumer-project
   npm link ../granola-ts-client
   npm test  # Must pass existing tests
   ```

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

## Backwards Compatibility Contract

### Constructor Compatibility Requirements

**The constructor is the most critical API surface. NEVER break it.**

When modifying constructor:
1. Support ALL previous signatures
2. Add new capabilities via overloading, not replacement
3. Test every historical usage pattern

```typescript
// If these work in version X, they must work in version X+1:
new GranolaClient('token')                    // v0.1.0 style
new GranolaClient({ apiKey: 'token' })       // v0.5.0 style  
new GranolaClient({ token: 'token' })        // v0.8.0 style
new GranolaClient()                           // v0.10.0 style
```

### Authentication State Management

**Authentication must be explicit and validated:**

```typescript
class GranolaClient {
  private assertAuthenticated(): void {
    if (!this.hasValidToken()) {
      throw new Error(
        'GranolaClient: No valid authentication token. ' +
        'Provide token via constructor or call setToken()'
      );
    }
  }
  
  async anyApiMethod() {
    this.assertAuthenticated();  // EVERY method must check
    // ... rest of implementation
  }
}
```

## API Design Principles

### Optional Parameters Are Dangerous

**Making required parameters optional is a BREAKING CHANGE:**

```typescript
// Version 1.0.0
constructor(token: string)  // Required

// Version 1.1.0 - THIS IS BREAKING!
constructor(token?: string)  // Optional

// Correct approach for 1.1.0:
constructor(token: string | Options)  // Overloaded
```

### Empty Data vs No Data vs Errors

**Be explicit about what empty responses mean:**

```typescript
interface ApiResponse<T> {
  data: T;           // Actual data
  hasData: boolean;  // Explicitly indicate emptiness
  error?: Error;     // Explicit errors
}

// Clear intention:
if (!response.hasData) {
  // Legitimately no data
}
if (response.error) {
  // Something went wrong
}
```

## Regression Prevention

### Required Integration Tests

**tests/client-compatibility.test.ts** must exist and test:

```typescript
describe('Backwards Compatibility', () => {
  // Test EVERY historical constructor pattern
  test('v0.3.0: new GranolaClient(token)', async () => {
    const client = new GranolaClient('test-token');
    expect(client).toBeDefined();
    // Mock and verify auth header is set
  });

  test('Fails clearly without auth', async () => {
    const client = new GranolaClient();
    await expect(client.getWorkspaces())
      .rejects.toThrow('Authentication required');
  });

  test('Returns expected data structure', async () => {
    const client = new GranolaClient('token');
    const transcript = await client.getDocumentTranscript('id');
    expect(Array.isArray(transcript)).toBe(true);
    // Never return undefined/null when authenticated
  });
});
```

### Consumer Simulation Testing

**Maintain test/consumer-simulation/** directory:

```typescript
// Simulates how real consumers use the library
import GranolaClient from '../src';

// This must NEVER break between versions:
async function typicalUsage() {
  const client = new GranolaClient(process.env.TOKEN);
  const workspaces = await client.getWorkspaces();
  
  for await (const doc of client.listAllDocuments()) {
    const transcript = await client.getDocumentTranscript(doc.id);
    if (transcript.length > 0) {  // This pattern must work
      console.log('Has transcript');
    }
  }
}
```

## Version Management

### Semantic Versioning Rules

**This is not optional. Follow semver.org strictly:**

- **PATCH (0.0.X)**: Bug fixes only, zero API changes
- **MINOR (0.X.0)**: New features, MUST be backwards compatible  
- **MAJOR (X.0.0)**: ANY breaking change, no matter how small

**Breaking changes include:**
- Changing required/optional status of parameters
- Changing return types (even `T[]` to `T[] | undefined`)
- Removing methods/properties
- Changing error behavior
- Requiring new environment setup

### Pre-release Checklist

Before ANY npm publish:

```bash
# 1. Test with real token against real API
GRANOLA_TOKEN=xxx npm test

# 2. Test in consumer project
cd ../actual-consumer
npm link ../granola-ts-client
npm test

# 3. Verify constructor patterns
npm run test:backwards-compat

# 4. Check for silent failures
npm run test:error-handling

# 5. Document breaking changes
# Update CHANGELOG.md with BREAKING markers
```

## Debugging Aid Requirements

### Never Hide Problems

**Every class should expose debugging info:**

```typescript
class GranolaClient {
  // Consumers need to debug issues:
  public hasToken(): boolean {
    return !!this.token;
  }
  
  public getLastError(): Error | null {
    return this.lastError;
  }
  
  public getDebugInfo(): object {
    return {
      hasToken: this.hasToken(),
      baseUrl: this.baseUrl,
      lastRequestTime: this.lastRequestTime,
      version: PACKAGE_VERSION
    };
  }
}
```

### Meaningful Error Messages

**Include actionable debugging info:**

```typescript
// ❌ Bad:
throw new Error('Invalid request');

// ✅ Good:
throw new Error(
  `GranolaClient.getDocumentTranscript failed:\n` +
  `- Document ID: ${documentId}\n` +
  `- Authenticated: ${this.hasToken()}\n` +
  `- Response status: ${response.status}\n` +
  `- Suggestion: Check if token is valid and document exists`
);
```

## Migration Strategy

### Breaking Change Protocol

If you MUST make breaking changes:

1. **Add deprecation warnings first** (minor version):
   ```typescript
   console.warn('DEPRECATED: new GranolaClient(token) will require ' +
                'object format in v2.0. Use new GranolaClient({ apiKey: token })');
   ```

2. **Provide migration guide** (in repo):
   ```markdown
   # Migrating from v1.x to v2.0
   ## Constructor changes
   - Old: `new GranolaClient(token)`
   - New: `new GranolaClient({ apiKey: token })`
   - Why: Supporting multiple auth methods
   ```

3. **Support both patterns temporarily** (1-2 major versions)

4. **Announce in changelog** with **BREAKING:** prefix

## Dependency Management

### If Claude Code Is Upgrading Dependencies

**STOP and verify:**

1. "Is this a major version jump?" (0.3 → 0.11 = YES)
2. "Am I testing the upgrade before committing?"
3. "Do I have a rollback plan?"
4. "Have I checked the changelog for breaking changes?"

**When Claude suggests `bun add package@latest`:**
- First check current version: `npm view package version`
- Check changelog: `npm view package repository.url`
- Test in isolation first
- Commit BEFORE and AFTER separately

Remember: **Every breaking change breaks someone's production code.**

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