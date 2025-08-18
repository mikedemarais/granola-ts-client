# Fix Critical Bugs in granola-ts-client@0.11.1

## Executive Summary
There are two critical bugs in granola-ts-client@0.11.1 where the client expects wrapped API responses but the Granola API returns arrays directly. This causes `getDocumentTranscript` and `getPanelTemplates` to always return empty arrays even when data exists.

## Bugs Identified

### Bug 1: getDocumentTranscript (CRITICAL - Breaking Transcript Fetching)
**Location:** `dist/index.js` around line 235-242

**Current buggy code:**
```javascript
async getDocumentTranscript(documentId) {
  const response = await this.internal.v1_get_document_transcript({
    document_id: documentId
  });
  if (response === undefined && !this.internal.hasToken()) {
    throw new Error("Authentication required to fetch transcript");
  }
  return response?.transcript || [];  // BUG: response IS the array, not {transcript: [...]}
}
```

**The Problem:**
- API endpoint `/v1/get-document-transcript` returns: `[{segment1}, {segment2}, ...]` (array directly)
- Code expects: `{ transcript: [{segment1}, {segment2}, ...] }` (object with transcript property)
- Result: `response?.transcript` is always undefined, returning empty array `[]`

### Bug 2: getPanelTemplates (Breaking Panel Template Fetching)
**Location:** `dist/index.js` around line 258-265

**Current buggy code:**
```javascript
async getPanelTemplates(body = {}) {
  const response = await this.internal.v1_get_panel_templates(body);
  if (response === undefined && !this.internal.hasToken()) {
    throw new Error("Authentication required to fetch panel templates");
  }
  return response?.panel_templates || [];  // BUG: response IS the array, not {panel_templates: [...]}
}
```

**The Problem:**
- API endpoint `/v1/get-panel-templates` returns: `[{template1}, {template2}, ...]` (array directly)
- Code expects: `{ panel_templates: [{template1}, {template2}, ...] }` (object with panel_templates property)
- Result: `response?.panel_templates` is always undefined, returning empty array `[]`

## Required Fixes

### Fix 1: getDocumentTranscript
```javascript
async getDocumentTranscript(documentId) {
  const response = await this.internal.v1_get_document_transcript({
    document_id: documentId
  });
  if (response === undefined && !this.internal.hasToken()) {
    throw new Error("Authentication required to fetch transcript");
  }
  // FIX: The API returns the transcript array directly
  if (Array.isArray(response)) {
    return response;
  }
  // Fallback for backwards compatibility if API structure changes
  return response?.transcript || [];
}
```

### Fix 2: getPanelTemplates
```javascript
async getPanelTemplates(body = {}) {
  const response = await this.internal.v1_get_panel_templates(body);
  if (response === undefined && !this.internal.hasToken()) {
    throw new Error("Authentication required to fetch panel templates");
  }
  // FIX: The API returns the array directly
  if (Array.isArray(response)) {
    return response;
  }
  // Fallback for backwards compatibility if API structure changes
  return response?.panel_templates || [];
}
```

## API Response Structure Reference

For clarity, here's how each API endpoint actually responds:

| Endpoint | Current Response | Client Expects | Status |
|----------|-----------------|----------------|--------|
| `/v1/get-document-transcript` | `[{segment}, ...]` | `{transcript: [...]}` | ❌ BROKEN |
| `/v1/get-panel-templates` | `[{template}, ...]` | `{panel_templates: [...]}` | ❌ BROKEN |
| `/v1/get-workspaces` | `{workspaces: [...]}` | `{workspaces: [...]}` | ✅ WORKING |
| `/v2/get-documents` | `{docs: [...], deleted: [...]}` | `{docs: [...], deleted: [...]}` | ✅ WORKING |
| `/v1/get-document-metadata` | `{title, created_at, ...}` | `{title, created_at, ...}` | ✅ WORKING |
| `/v1/get-people` | `[{person}, ...]` | `[{person}, ...]` | ✅ WORKING |

## Testing & Verification

### Test 1: Document Transcript
```javascript
const client = new GranolaClient(token);
const transcript = await client.getDocumentTranscript('document-id-with-transcript');

// Should return:
// [{
//   "document_id": "...",
//   "start_timestamp": "2025-08-18T14:04:59.643Z",
//   "text": "Hello world",
//   "source": "microphone",
//   "id": "...",
//   "is_final": true,
//   "end_timestamp": "2025-08-18T14:05:01.183Z"
// }, ...]

console.assert(Array.isArray(transcript), 'Transcript should be an array');
console.assert(transcript.length > 0, 'Transcript should have segments');
```

### Test 2: Panel Templates
```javascript
const templates = await client.getPanelTemplates();

// Should return:
// [{
//   "id": "...",
//   "title": "Meeting Notes",
//   "sections": [...],
//   ...
// }, ...]

console.assert(Array.isArray(templates), 'Templates should be an array');
console.assert(templates.length > 0, 'Should have templates');
```

## Root Cause
This regression was introduced during the refactor from v0.3.0 to v0.11.x where response handling was changed to expect wrapped responses, but some API endpoints return arrays directly.

## Recommended Additional Improvements

1. **Add integration tests** that verify actual API response structures
2. **Add response logging** in development mode to catch these issues earlier
3. **Consider a response normalizer** that handles both array and wrapped responses consistently
4. **Update TypeScript types** to accurately reflect actual API responses

## Release Notes Suggestion for v0.11.2

```
### Bug Fixes
- Fixed getDocumentTranscript returning empty array when transcripts exist
- Fixed getPanelTemplates returning empty array when templates exist
- Both methods now correctly handle API responses that return arrays directly

### Breaking Changes
- None

### Migration Guide
- No changes required - this fix restores the expected behavior
```

## Impact
- **Critical**: Currently all users of v0.11.0 and v0.11.1 cannot fetch transcript data
- **High**: Panel templates functionality is also broken
- **Immediate fix needed**: This affects core functionality of the client

Please publish this fix as **v0.11.2** as soon as possible.