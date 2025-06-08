# Development Guidelines

## Tech Stack & Environment

- **Runtime**: This project uses [Bun](https://bun.sh/) as the JavaScript/TypeScript runtime
- **Language**: TypeScript is required for all new code
- **Package Management**: Use Bun's built-in package manager (`bun install`) instead of npm
- **Testing**: Use Bun's test runner (`bun test`) for all unit and integration tests

## Development Practices

### Dependency Management

- Prefer Bun's native APIs over external dependencies whenever possible
- Examples of native Bun APIs to leverage:
  - `Bun.file()` for file operations instead of fs modules
  - `Bun.serve()` for HTTP servers instead of Express/Fastify
  - Built-in test runner instead of Jest/Mocha
  - Built-in bundler instead of webpack/rollup
- Document any new external dependencies with justification in PR descriptions

### Code Quality

- Run `bun run dev:lint` during development (auto-fixes issues and runs tests)
- Run `bun run ci` before committing changes to ensure all checks pass
- Biome automatically fixes most linting and formatting issues when using `bun run lint`
- Follow the established TypeScript configuration without modifications
- Maintain 80%+ test coverage for all new code
- Use async/await syntax rather than Promises with then/catch

### Linting and Formatting

- **Biome** is configured for both linting and formatting with auto-fix enabled
- `bun run lint` - Auto-fixes all fixable formatting and linting issues
- `bun run lint:check` - Checks for issues without making changes (used in CI)
- `bun run format` - Formats code only
- Import organization is automatically handled by Biome
- The `dist/` folder is ignored to prevent linting generated code

### TypeScript and Type Exports

- All public-facing types must be explicitly exported from the package
- Update `src/index.ts` when adding new interfaces or types that should be available to package consumers
- Document exported types with JSDoc comments
- Ensure all exported types follow the naming conventions established in the codebase
- Run `bun build` and verify type exports are correctly generated in the `dist` folder after making type-related changes

### Git Workflow

- Make atomic git commits that represent single logical changes
- Write descriptive commit messages using present tense verbs
- Always create a git commit before:
  - Making large structural changes
  - Modifying multiple files simultaneously
  - Switching between features/tasks
- Branch naming convention: `feature/short-description` or `fix/issue-reference`

### Biome Usage

- Use [Biome](https://biomejs.dev/) for all code formatting and linting.
- Run `bun run format` and `bun run lint` before every commit.
- The configuration lives in `.biome.json` and `.biomeignore` excludes `dist`, `coverage`, and `node_modules`.
- The Node import rule is disabled because the project uses Bun; add `// biome-ignore lint/style/useNodejsImportProtocol` for dynamic imports if needed.

### File Synchronization

- Any changes made to `AGENTS.md` **must** also be made in `CLAUDE.md` and vice versa to keep both guideline files identical.
