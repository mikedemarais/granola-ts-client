# Development Guidelines

## Tech Stack & Environment

- **Runtime**: This project uses [Bun](https://bun.sh/) as the JavaScript/TypeScript runtime
- **Language**: TypeScript is required for all new code
- **Package Management**: Use Bun's built-in package manager (`bun install`) instead of npm
- **Testing**: Use Bun's test runner (`bun test`) for all unit and integration tests
- Always invoke binaries with `bun x` instead of the deprecated `bunx` alias

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

- Run `bun run dev` during development (auto-fixes issues and runs tests)
- Run `bun run ci` before committing changes to ensure all checks pass
- Biome automatically fixes most linting and formatting issues when using `bun run lint`
- The CI process uses a clean build approach: removes dist/, lints source code, runs tests, then builds
- Follow the established TypeScript configuration without modifications
- Do not enforce any specific test coverage percentage
- Use async/await syntax rather than Promises with then/catch

### Linting and Formatting

- **Biome** is configured for both linting and formatting with auto-fix enabled
- `bun run lint` - Auto-fixes all fixable formatting and linting issues
- `bun run lint:check` - Checks for issues without making changes (used in CI)
- `bun run format` - Formats code only
- Import organization is automatically handled by Biome
- Generated code in `dist/` is avoided during CI by using a clean build process that removes build artifacts before linting

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
- Before opening a pull request, run `bun run ci` and regenerate schema types with `bun run generate`

### Pull Request Guidelines

- Use a short title written in the imperative mood (e.g., "Add feature" not "Added feature").
- Summarize what changed and why in the description.
- Include a **Testing** section describing the results of `bun run format`, `bun run lint`, and `bun run ci`.
- Reference related issues or pull requests when applicable.

### Biome Usage

- Use [Biome](https://biomejs.dev/) for all code formatting and linting.
- Run `bun run format` and `bun run lint` before every commit.
- The configuration lives in `.biome.json` which excludes `node_modules`, `coverage`, and `*.lock` files
- The CI process ensures clean builds by removing the `dist/` folder before linting to avoid conflicts with generated code
- The Node import rule is disabled because the project uses Bun; add `// biome-ignore lint/style/useNodejsImportProtocol` for dynamic imports if needed.
- Additional lint rules help keep the codebase clean:
  - `complexity/noExcessiveCognitiveComplexity` warns when a function becomes too complex.
  - `suspicious/noConsole` warns on `console` usage except for `warn`, `error`, and `info` calls.

### Documentation Consistency

- README snippets and `examples/*.ts` must compile against the current generated client.
- After running `bun run generate`, run `bun run docs:check` to compile the examples and verify key README snippets.

### Pre-commit Checklist

- `bun run format` - format the code
- `bun run lint` - fix and check lint issues
- `bun run ci` - run tests and build
- Write commit messages in present tense and describe the change clearly.
- Update README snippets and examples when generated methods change and verify with `bun run docs:check`.

### File Synchronization

- Any changes made to `AGENTS.md` **must** also be made in `CLAUDE.md` and vice versa to keep both guideline files identical. You can run `diff AGENTS.md CLAUDE.md` to verify they're in sync.
