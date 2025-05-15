# granola-ts-client

A TypeScript client for the Granola API. This client allows you to interact with Granola's note-taking and meeting management platform programmatically.

## Installation

You can install the package using npm, yarn or bun:

```bash
# using npm
npm install granola-ts-client

# using yarn
yarn add granola-ts-client

# using bun
bun add granola-ts-client
```

## Authentication

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

// Initialize client with token from environment variable
const client = new GranolaClient();

// Or provide token explicitly
// const client = new GranolaClient('your-api-token');

// Get workspaces
const workspaces = await client.getWorkspaces();
console.log(`Found ${workspaces.workspaces?.length} workspaces`);

// Get documents from a specific workspace
const docs = await client.getDocuments({ 
  workspace_id: 'your-workspace-id',
  limit: 10
});

// Iterate through all documents
for await (const doc of client.listAllDocuments({ workspace_id: 'your-workspace-id' })) {
  console.log(`Document: ${doc.title}`);
}
```

## Features

- Retrieve workspaces, documents, and document metadata
- Get document transcripts and notes
- Update documents and document panels
- Retrieve panel templates and people data
- Access feature flags and subscription information
- Refresh Google Calendar events
- Check for application updates

## API Reference

Full API documentation is available in the [docs](https://github.com/your-username/granola-ts-client/tree/main/docs) directory.

## Development

This project uses [Bun](https://bun.sh) as the JavaScript/TypeScript runtime.

To install dependencies:
```bash
bun install
```

### Scripts

| Command              | Description                                     |
|----------------------|-------------------------------------------------|
| `bun run generate`   | Generate TypeScript types from `openapi.yaml`   |
| `bun run build`      | Build ESM bundle to `dist/`                     |
| `bun run test`       | Run tests                                       |
| `bun run lint`       | Run biome lint checks                           |
| `bun run format`     | Format code with biome                          |
| `bun run docs`       | Generate HTML docs with TypeDoc in `docs/`      |
| `bun run ci`         | Run CI tasks manually (lint, test, build, docs) |

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
