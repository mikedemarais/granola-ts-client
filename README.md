# granola-ts-client

# Installation

To install dependencies:
```bash
bun install
```

# Authentication

This client requires a Granola API access token. You can retrieve your token by running:
```bash
jq -r '.cognito_tokens | fromjson | .access_token' "$HOME/Library/Application Support/Granola/supabase.json"
```
Then export it as an environment variable:
```bash
export GRANOLA_TOKEN=$(jq -r '.cognito_tokens | fromjson | .access_token' "$HOME/Library/Application Support/Granola/supabase.json")
```
Alternatively, add `GRANOLA_TOKEN=<your_token>` to a `.env` file in your project root.

## Usage

```ts
import GranolaClient from 'granola-ts-client';

const client = new GranolaClient();
const workspaces = await client.getWorkspaces();
console.log(workspaces);
```

This project was created using `bun init` in bun v1.2.1.

[Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
## Scripts

| Command              | Description                                     |
|----------------------|-------------------------------------------------|
| `bun run generate`   | Generate TypeScript types from `openapi.yaml`   |
| `bun run build`      | Build ESM bundle to `dist/`                     |
| `bun run test`       | Run tests                                       |
| `bun run lint`       | Run biome lint checks                           |
| `bun run format`     | Format code with biome                         |
| `bun run docs`       | Generate HTML docs with TypeDoc in `docs/`      |
| `bun run index.ts`   | Example entry-point (prints a hello message)    |
| `bun run ci`         | Run CI tasks manually (lint, test, build, docs) |
## CI

A GitHub Actions workflow is included at `.github/workflows/ci.yml`, which runs lint, tests, build, and docs generation on push and pull requests.
