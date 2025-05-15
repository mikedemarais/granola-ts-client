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

- Run `bun lint` and `bun typecheck` before committing changes
- Follow the established TypeScript configuration without modifications
- Maintain 80%+ test coverage for all new code
- Use async/await syntax rather than Promises with then/catch

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
