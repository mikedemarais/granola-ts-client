# granola-ts-client

Unofficial TypeScript client for the Granola API. It mimics the desktop app to avoid "Unsupported client" errors.

## Installation

```bash
# using npm
npm install granola-ts-client

# using yarn
yarn add granola-ts-client

# using bun
bun add granola-ts-client
```

## Quick Start

```ts
import GranolaClient from 'granola-ts-client';

// Initialize with your API token
const client = new GranolaClient('your-api-token');

// Get workspaces
const workspaces = await client.v1_get_workspaces();
console.log(`Found ${workspaces.workspaces?.length} workspaces`);

// Get documents from a specific workspace
const docs = await client.v2_get_documents({
  workspace_id: 'your-workspace-id',
  limit: 10
});
```
See [`examples/quick-start.ts`](examples/quick-start.ts) for a runnable example that demonstrates this workflow.

## Get Granola Access Token

Grab a Granola access token using one of these methods:

### Method 1: Local App

- Use `jq` to read the token from `supabase.json`:

  ```bash
  # macOS
  jq -r '.cognito_tokens | fromjson | .access_token' "$HOME/Library/Application Support/Granola/supabase.json"

  # Linux
  jq -r '.cognito_tokens | fromjson | .access_token' "$HOME/.config/Granola/supabase.json"
  ```

- Or extract it in code:

  ```ts
  import { join } from 'path';
  import { homedir } from 'os';
  import GranolaClient from 'granola-ts-client';

  const granolaPath = process.platform === 'darwin'
    ? join(homedir(), 'Library/Application Support/Granola/supabase.json')
    : join(homedir(), '.config/Granola/supabase.json');

  const data = await Bun.file(granolaPath).json();
  const accessToken = JSON.parse(data.cognito_tokens).access_token;
  const client = new GranolaClient(accessToken);
  ```

### Method 2: Browser DevTools

- Visit [granola.ai](https://granola.ai) and log in.
- Open DevTools (F12 or Cmd+Option+I).
- In the **Network** tab, navigate within the app.
- Grab the `Authorization` header from any `api.granola.ai` request.

## Authentication

Once you have your token, initialize the client:

```ts
import GranolaClient from 'granola-ts-client';

const client = new GranolaClient('your-access-token-here');
```

## API Methods

### Workspaces

```ts
// Get all workspaces
const workspaces = await client.v1_get_workspaces();
```

### Documents

```ts
import { paginate } from 'granola-ts-client';

// Get documents with pagination
const docs = await client.v2_get_documents({
  workspace_id: 'your-workspace-id',
  limit: 20,
  cursor: 'optional-pagination-cursor'
});

// Iterate through all documents with automatic pagination
for await (const doc of paginate((cursor) =>
  client.v2_get_documents({ workspace_id: 'your-workspace-id', cursor })
)) {
  console.log(`Document: ${doc.title}`);
}

// Get document metadata
const metadata = await client.v1_get_document_metadata({ document_id: 'document-id' });

// Get document transcript
const transcript = await client.v1_get_document_transcript({ document_id: 'document-id' });

// Update document
await client.v1_update_document({
  document_id: 'document-id',
  title: 'New Title',
  notes_markdown: '# Meeting Notes\n\nImportant points...'
});

// Update document panel
await client.v1_update_document_panel({
  document_id: 'document-id',
  panel_id: 'panel-id',
  content: { text: 'Updated content' }
});
```

### Other APIs

```ts
// Get panel templates
const templates = await client.v1_get_panel_templates();

// Get people data
const people = await client.v1_get_people();

// Get feature flags
const featureFlags = await client.v1_get_feature_flags();

// Get Notion integration details
const notionIntegration = await client.v1_get_notion_integration();

// Get subscription information
const subscriptions = await client.v1_get_subscriptions();

// Refresh Google Calendar events
await client.v1_refresh_google_events();

// Check for application updates
const updateInfo = await client.v1_check_for_update_latest_mac_yml();
```

## Client Config

The client pretends to be the desktop app so API calls are accepted. Override these values if needed:

```ts
const client = new GranolaClient('your-api-token', {
  // API configuration
  baseUrl: 'https://api.granola.ai',
  timeout: 10000,
  retries: 3,

  // Client identification (defaults shown)
  appVersion: '6.4.0',
  clientType: 'electron',
  clientPlatform: 'darwin',
  clientArchitecture: 'arm64',
  electronVersion: '33.4.5',
  chromeVersion: '130.0.6723.191',
  nodeVersion: '20.18.3',
  osVersion: '15.3.1',
  osBuild: '24D70',
});
```

## HTTP Utility

All generated API calls use the `Http` class defined in
[`src/http.ts`](src/http.ts) for network communication. Import and use this
class directly if you need to make custom requests that the generated client
doesn't expose.

## Types

All types are fully exported for use in your TypeScript code:

```ts
import GranolaClient, {
  // Exported interfaces
  PeopleResponse,
  FeatureFlagsResponse,
  NotionIntegrationResponse,
  SubscriptionsResponse,
  ClientOpts,

  // Generated API models
  Document,
  WorkspaceResponse,
} from 'granola-ts-client';

// Use with type annotations
const people: PeopleResponse = await client.v1_get_people();

// Use generated models
let doc: Document;
let workspace: WorkspaceResponse;
```
## Generate Types

Run `bun run generate` to refresh client and schema types from `openapi.yaml`.
The command writes the API client and models to `src/generated/`, which is
ignored by git. CI runs this step automatically before building.


## Development

### Requirements

Install dependencies with [Bun](https://bun.sh):

```bash
bun install
```


### Scripts

| Command              | Description                                           |
|----------------------|-------------------------------------------------------|
| `bun run generate`   | Generate client and models from `openapi.yaml`       |
| `bun run build`      | Generate client, build ESM bundle, and create type definitions |
| `bun run test`       | Run tests                                             |
| `bun run lint`       | Auto-fix linting and formatting issues with Biome    |
| `bun run lint:check` | Check for linting issues without auto-fixing         |
| `bun run format`     | Format code with Biome                               |
| `bun run dev`        | Development linting (format, auto-fix, test)         |
| `bun run ci`         | Run full CI pipeline (clean, format, lint-check, test, build) |

## License

MIT
