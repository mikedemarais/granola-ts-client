# Granola TypeScript Client

A TypeScript client for the Granola API with enhanced features.

## Features

- **Basic API Client:** Full TypeScript client for the Granola API
- **Automatic Authentication:** Extracts tokens from the local Granola app installation
- **Enhanced Transcripts:** Speaker identification, deduplication, and improved formatting
- **Document Panels:** Access and extract structured content from meeting summaries
- **Organization Detection:** Determine which organization a meeting belongs to

## Installation

```bash
npm install granola-ts-client
# or
yarn add granola-ts-client
# or
bun add granola-ts-client
```

## Basic Usage

```typescript
import { GranolaClient } from 'granola-ts-client';

// Initialize with automatic token retrieval from local Granola app
const client = new GranolaClient();

// Get workspaces
const workspaces = await client.getWorkspaces();
console.log(`You have ${workspaces.workspaces.length} workspaces`);

// Get documents
const documents = await client.getDocuments({ limit: 20 });
console.log(`Found ${documents.docs.length} documents`);

// Get transcript for a document
const transcript = await client.getDocumentTranscript('document-id');
console.log(`Transcript has ${transcript.length} segments`);
```

## Enhanced Transcript Features

The `TranscriptClient` extends the base client with speaker identification and transcript processing:

```typescript
import { TranscriptClient } from 'granola-ts-client';

// Initialize client
const client = new TranscriptClient();

// Get transcript with speaker identification
const transcriptWithSpeakers = await client.getDocumentTranscriptWithSpeakers('document-id');

// Export a formatted transcript to markdown
await client.exportTranscriptMarkdown('document-id', 'output.md', {
  groupBySpeaker: true,
  includeTimestamps: true
});
```

## Document Panel Access

The `PanelClient` provides access to document panels and their structured content:

```typescript
import { PanelClient } from 'granola-ts-client';

// Initialize client
const client = new PanelClient();

// Get all panels for a document
const panels = await client.getDocumentPanels('document-id');
console.log(`Document has ${panels.length} panels`);

// Get a specific panel by title
const summaryPanel = await client.getDocumentPanelByTitle('document-id', 'Summary');

// Extract structured content from a panel
if (summaryPanel) {
  const sections = client.extractStructuredContent(summaryPanel);
  console.log('Introduction:', sections['Introduction']);
  console.log('Key Decisions:', sections['Key Decisions']);
}
```

## Organization Detection

The library includes an organization detection system that can be customized:

```typescript
import { OrganizationDetector } from 'granola-ts-client';

// Create detector with custom configuration
const detector = OrganizationDetector.fromFile('./organization-config.json');

// Detect organization for a meeting
const meetingData = await client.getDocuments({ limit: 1 });
const meeting = meetingData.docs[0];
const organization = detector.detectOrganization(meeting);
console.log(`Meeting belongs to: ${organization}`);
```

### Organization Configuration

Create a file named `organization-config.json` with your organization definitions:

```json
{
  "organizations": [
    {
      "name": "Organization1",
      "titleKeywords": ["org1", "team1"],
      "emailDomains": ["org1.com"],
      "emailAddresses": ["admin@org1.com"],
      "companyNames": ["Organization One, Inc."]
    },
    {
      "name": "Organization2",
      "titleKeywords": ["org2", "team2"],
      "emailDomains": ["org2.org"],
      "emailAddresses": ["admin@org2.org"],
      "companyNames": ["Organization Two, LLC"]
    }
  ],
  "defaultOrganization": "Unknown"
}
```

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build
```

## License

MIT