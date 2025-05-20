# granola-ts-client

A TypeScript client for the Granola API. This client allows you to interact with Granola's note-taking and meeting management platform programmatically while automatically mimicking the official Granola desktop application to bypass "Unsupported client" validation.

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
const workspaces = await client.getWorkspaces();
console.log(`Found ${workspaces.workspaces?.length} workspaces`);

// Get documents from a specific workspace
const docs = await client.getDocuments({ 
  workspace_id: 'your-workspace-id', 
  limit: 10 
});
```

## Authentication

### Option 1: Direct Token

```ts
// Use your API token directly
const client = new GranolaClient('your-api-token');
```

### Option 2: Extract from Local Granola App

The client provides a helper method to extract authentication tokens from a local Granola desktop installation:

```ts
// Extract tokens (Node.js environment only)
const { accessToken } = await GranolaClient.getAuthTokens();

// Create client with the extracted token
const client = new GranolaClient(accessToken);
```

You can also extract the token manually:

```bash
jq -r '.cognito_tokens | fromjson | .access_token' "$HOME/Library/Application Support/Granola/supabase.json"
```

## API Client Methods

### Workspaces

```ts
// Get all workspaces
const workspaces = await client.getWorkspaces();
```

### Documents

```ts
// Get documents with pagination
const docs = await client.getDocuments({ 
  workspace_id: 'your-workspace-id',
  limit: 20,
  cursor: 'optional-pagination-cursor'
});

// Iterate through all documents with automatic pagination
for await (const doc of client.listAllDocuments({ workspace_id: 'your-workspace-id' })) {
  console.log(`Document: ${doc.title}`);
}

// Get document metadata
const metadata = await client.getDocumentMetadata('document-id');

// Get document transcript
const transcript = await client.getDocumentTranscript('document-id');

// Update document
await client.updateDocument({
  document_id: 'document-id',
  title: 'New Title',
  notes_markdown: '# Meeting Notes\n\nImportant points...'
});

// Update document panel
await client.updateDocumentPanel({
  document_id: 'document-id',
  panel_id: 'panel-id',
  content: { text: 'Updated content' }
});
```

### Other APIs

```ts
// Get panel templates
const templates = await client.getPanelTemplates();

// Get people data
const people = await client.getPeople();

// Get feature flags
const featureFlags = await client.getFeatureFlags();

// Get Notion integration details
const notionIntegration = await client.getNotionIntegration();

// Get subscription information
const subscriptions = await client.getSubscriptions();

// Refresh Google Calendar events
await client.refreshGoogleEvents();

// Check for application updates
const updateInfo = await client.checkForUpdate();
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
  HttpOpts,
  
  // Generated OpenAPI schema types
  components,
  paths
} from 'granola-ts-client';

// Use with type annotations
const people: PeopleResponse = await client.getPeople();

// Use generated schema types
type Document = components['schemas']['Document'];
type WorkspaceResponse = components['schemas']['WorkspaceResponse'];
```

## Development

### Requirements

This project uses [Bun](https://bun.sh) as the JavaScript/TypeScript runtime.

```bash
# Install dependencies
bun install
```

### Available Scripts

| Command              | Description                                     |
|----------------------|-------------------------------------------------|
| `bun run generate`   | Generate TypeScript types from `openapi.yaml`   |
| `bun run build`      | Build ESM bundle to `dist/`                     |
| `bun run test`       | Run tests                                       |
| `bun run lint`       | Run biome lint checks                           |
| `bun run format`     | Format code with biome                          |
| `bun run ci`         | Run CI tasks manually (lint, test, build)       |

## License

MIT
