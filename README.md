# granola-ts-client

A TypeScript client for the Granola API. The OpenAPI spec in this repository is reverse-engineered and unofficial. The client automatically mimics the official desktop application to bypass "Unsupported client" validation.

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

## Retrieve Your Token

You need a Granola access token to use this client. Here are the easiest ways to get one:

### Method 1: Extract from Local Granola App (macOS/Linux)

If you have the Granola desktop app installed, you can extract the token from the local storage:

**Using jq (command line):**
```bash
# macOS
jq -r '.cognito_tokens | fromjson | .access_token' "$HOME/Library/Application Support/Granola/supabase.json"

# Linux  
jq -r '.cognito_tokens | fromjson | .access_token' "$HOME/.config/Granola/supabase.json"
```

**Extracting the Granola Access Token within your application:**
```ts
import { join } from 'path';
import { homedir } from 'os';
import GranolaClient from 'granola-ts-client';

// Extract token programmatically within your app
const granolaPath = process.platform === 'darwin' 
  ? join(homedir(), 'Library/Application Support/Granola/supabase.json')
  : join(homedir(), '.config/Granola/supabase.json');

const data = await Bun.file(granolaPath).json();
const accessToken = JSON.parse(data.cognito_tokens).access_token;

// Use the extracted token with your client
const client = new GranolaClient(accessToken);
```

### Method 2: Browser DevTools (Universal)

1. Open [granola.ai](https://granola.ai) in your browser and log in
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to the **Network** tab
4. Navigate to any page in the Granola web app
5. Find any API request to `api.granola.ai`
6. Look at the request headers for `Authorization: Bearer your-token-here`
7. Copy the token (everything after `Bearer `)

## Authentication

Once you have your token, initialize the client:

```ts
import GranolaClient from 'granola-ts-client';

const client = new GranolaClient('your-access-token-here');
```

## API Client Methods

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

## Client Configuration

The client automatically mimics the official Granola desktop app to bypass API validation. You can customize various aspects of the client if needed:

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

## TypeScript Types

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
## Generating Types

Run `bun run generate` to update the TypeScript definitions from `openapi.yaml`. The CI workflow in `.github/workflows/ci.yml` runs this command before it builds the package with `bun run build`.


## Development

### Requirements

This project uses [Bun](https://bun.sh) as the JavaScript/TypeScript runtime.

```bash
# Install dependencies
bun install
```


### Available Scripts

| Command              | Description                                           |
|----------------------|-------------------------------------------------------|
| `bun run generate`   | Generate client and models from `openapi.yaml`       |
| `bun run build`      | Generate client, build ESM bundle, and create type definitions |
| `bun run test`       | Run tests                                             |
| `bun run lint`       | Auto-fix linting and formatting issues with Biome    |
| `bun run lint:check` | Check for linting issues without auto-fixing         |
| `bun run format`     | Format code with Biome                               |
| `bun run dev:lint`   | Development linting (format, auto-fix, test)         |
| `bun run ci`         | Run full CI pipeline (clean, format, lint-check, test, build) |

## License

MIT
