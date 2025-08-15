# granola-ts-client

TypeScript client for the Granola API.

## Installation

```bash
npm install granola-ts-client
```

## Quick Start

```typescript
import GranolaClient from 'granola-ts-client';

const client = new GranolaClient('your-api-token');

// Get all documents
for await (const doc of client.listAllDocuments({ workspace_id: 'abc-123' })) {
  console.log(doc.title);
}
```

## API Reference

### Core Methods

- `getWorkspaces()` - Get user workspaces
- `getDocuments(options)` - Get documents with pagination
- `getDocumentMetadata(id)` - Get document metadata
- `getDocumentTranscript(id)` - Get document transcript
- `updateDocument(id, updates)` - Update document
- `updateDocumentPanel(id, panelId, content)` - Update document panel
- `getPanelTemplates()` - Get available panel templates
- `listAllDocuments(options)` - Iterate all documents (async generator)

### Other Methods

- `getPeople()` - Get people data
- `getFeatureFlags()` - Get feature flags
- `getNotionIntegration()` - Get Notion integration details
- `getSubscriptions()` - Get subscription information
- `refreshGoogleEvents()` - Refresh Google Calendar events
- `checkForUpdate()` - Check for app updates

> **Backwards Compatibility**: Legacy method names (e.g., `v1_get_workspaces`) are supported automatically.

## Examples

### Basic Usage

```typescript
import GranolaClient from 'granola-ts-client';

const client = new GranolaClient('your-api-token');

// Get workspaces
const workspaces = await client.getWorkspaces();
console.log(`Found ${workspaces.workspaces.length} workspaces`);

// Get documents with pagination
const docs = await client.getDocuments({ 
  workspace_id: workspaces.workspaces[0].id,
  limit: 10 
});

// Get document details
const metadata = await client.getDocumentMetadata(docs.docs[0].id);
const transcript = await client.getDocumentTranscript(docs.docs[0].id);

// Update a document
await client.updateDocument(docs.docs[0].id, {
  title: 'Updated Title',
  notes_markdown: '# Notes\n\nUpdated content'
});
```

### Iterate All Documents

```typescript
// Process all documents in a workspace
for await (const doc of client.listAllDocuments({ workspace_id: 'abc-123' })) {
  console.log(`Processing: ${doc.title}`);
  // Process each document
}

// Or collect into an array
const allDocs = [];
for await (const doc of client.listAllDocuments({ workspace_id: 'abc-123' })) {
  allDocs.push(doc);
}
```

## Getting a Granola Access Token

### From Local App

```bash
# macOS - Try WorkOS token first (new auth)
jq -r '.workos_tokens | fromjson | .access_token' \
  "$HOME/Library/Application Support/Granola/supabase.json"

# macOS - Fall back to Cognito token (legacy)
jq -r '.cognito_tokens | fromjson | .access_token' \
  "$HOME/Library/Application Support/Granola/supabase.json"

# Linux
jq -r '.workos_tokens | fromjson | .access_token' \
  "$HOME/.config/Granola/supabase.json"
```

### Using the Optional Token Utility

```typescript
import { extractGranolaToken } from 'granola-ts-client/utils';

const token = await extractGranolaToken();
const client = new GranolaClient(token);
```

### From Web App

Open developer console at [app.granola.so](https://app.granola.so) and run:

```javascript
await cookieStore.get('access_token')
```

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build

# Generate from OpenAPI spec
bun run generate
```

## Architecture

This library uses a stable wrapper pattern to protect against breaking changes from code generation. The public API methods (`getWorkspaces`, `getDocuments`, etc.) will never change, ensuring your code continues to work even when we regenerate the underlying client.

## License

MIT