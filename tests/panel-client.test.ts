import { describe, test, expect, beforeEach, mock } from "bun:test";
import { PanelClient } from "../src/panel-client";
import { DocumentPanel } from "../src/panel-types";

// Sample response for mocking
const mockPanelsResponse: DocumentPanel[] = [
  {
    id: "panel-123",
    title: "Summary",
    document_id: "doc-456",
    created_at: "2025-06-01T12:00:00Z",
    updated_at: "2025-06-01T12:30:00Z",
    content_updated_at: "2025-06-01T12:30:00Z",
    template_slug: "v2:notes-centric-short-input",
    deleted_at: null,
    affinity_note_id: null,
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { id: "heading-1", level: 3 },
          content: [{ type: "text", text: "Meeting Overview" }]
        },
        {
          type: "paragraph",
          attrs: { id: "para-1" },
          content: [{ type: "text", text: "This is a sample meeting summary." }]
        }
      ]
    },
    original_content: "<h3>Meeting Overview</h3><p>This is a sample meeting summary.</p>",
    suggested_questions: null,
    generated_lines: [
      { text: "Meeting Overview", matches: false },
      { text: "This is a sample meeting summary.", matches: false }
    ],
    user_feedback: null
  },
  {
    id: "panel-789",
    title: "Action Items",
    document_id: "doc-456",
    created_at: "2025-06-01T12:05:00Z",
    updated_at: "2025-06-01T12:35:00Z",
    content_updated_at: "2025-06-01T12:35:00Z",
    template_slug: "v2:notes-centric-action-items",
    deleted_at: null,
    affinity_note_id: null,
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { id: "heading-2", level: 3 },
          content: [{ type: "text", text: "Action Items" }]
        },
        {
          type: "bulletList",
          attrs: { tight: true },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "para-2" },
                  content: [{ type: "text", text: "Complete task A" }]
                }
              ]
            }
          ]
        }
      ]
    },
    original_content: "<h3>Action Items</h3><ul><li>Complete task A</li></ul>",
    suggested_questions: null,
    generated_lines: [],
    user_feedback: null
  }
];

describe("PanelClient", () => {
  let client: PanelClient;
  let mockHttpPost: any;
  
  beforeEach(() => {
    client = new PanelClient("fake-token");
    
    // Mock the HTTP post method
    mockHttpPost = mock(() => Promise.resolve(mockPanelsResponse));
    // @ts-ignore - Access and replace private method for testing
    client.http.post = mockHttpPost;
  });
  
  test("getDocumentPanels should fetch panels for a document", async () => {
    const documentId = "doc-456";
    const panels = await client.getDocumentPanels(documentId);
    
    // Verify correct endpoint and params were called
    expect(mockHttpPost).toHaveBeenCalledWith('/v1/get-document-panels', { document_id: documentId });
    
    // Verify result
    expect(panels).toEqual(mockPanelsResponse);
    expect(panels.length).toBe(2);
    expect(panels[0].title).toBe("Summary");
    expect(panels[1].title).toBe("Action Items");
  });
  
  test("getDocumentPanelByTitle should return the matching panel", async () => {
    const documentId = "doc-456";
    const summaryPanel = await client.getDocumentPanelByTitle(documentId, "Summary");
    
    // Verify the underlying API was called
    expect(mockHttpPost).toHaveBeenCalledWith('/v1/get-document-panels', { document_id: documentId });
    
    // Verify result
    expect(summaryPanel).not.toBeNull();
    expect(summaryPanel?.title).toBe("Summary");
    expect(summaryPanel?.id).toBe("panel-123");
  });
  
  test("getDocumentPanelByTitle should return null if no match", async () => {
    const documentId = "doc-456";
    const nonExistentPanel = await client.getDocumentPanelByTitle(documentId, "Non Existent Panel");
    
    // Verify the underlying API was called
    expect(mockHttpPost).toHaveBeenCalledWith('/v1/get-document-panels', { document_id: documentId });
    
    // Verify result
    expect(nonExistentPanel).toBeNull();
  });
  
  test("getDocumentPanelByTitle should be case insensitive", async () => {
    const documentId = "doc-456";
    const summaryPanel = await client.getDocumentPanelByTitle(documentId, "summary");
    
    // Verify result
    expect(summaryPanel).not.toBeNull();
    expect(summaryPanel?.title).toBe("Summary");
  });
  
  test("hasAiGeneratedSummary should detect AI-generated content", async () => {
    const documentId = "doc-456";
    const hasAiSummary = await client.hasAiGeneratedSummary(documentId);
    
    // Verify the correct panel was checked
    expect(mockHttpPost).toHaveBeenCalledWith('/v1/get-document-panels', { document_id: documentId });
    
    // Verify result (our mock has AI-generated lines)
    expect(hasAiSummary).toBe(true);
  });
  
  test("extractAiGeneratedSummary should return text from generated lines", async () => {
    const documentId = "doc-456";
    const summaryText = await client.extractAiGeneratedSummary(documentId);
    
    // Verify the correct panel was checked
    expect(mockHttpPost).toHaveBeenCalledWith('/v1/get-document-panels', { document_id: documentId });
    
    // Verify result
    expect(summaryText).toBe("Meeting Overview\nThis is a sample meeting summary.");
  });
  
  test("hasDocumentPanels should return true when panels exist", async () => {
    const documentId = "doc-456";
    const hasPanels = await client.hasDocumentPanels(documentId);
    
    // Verify API call
    expect(mockHttpPost).toHaveBeenCalledWith('/v1/get-document-panels', { document_id: documentId });
    
    // Verify result
    expect(hasPanels).toBe(true);
  });
  
  test("hasDocumentPanels should return false when API throws error", async () => {
    // Mock API failure
    // @ts-ignore - Access and replace private method for testing
    client.http.post = mock(() => Promise.reject(new Error("API Error")));
    
    const documentId = "doc-456";
    const hasPanels = await client.hasDocumentPanels(documentId);
    
    // Verify result
    expect(hasPanels).toBe(false);
  });
  
  test("extractPlainTextFromPanel should handle HTML content", async () => {
    const panel = mockPanelsResponse[0];
    const text = client.extractPlainTextFromPanel(panel);
    
    // Verify text extraction from HTML
    expect(text).toBe("Meeting Overview This is a sample meeting summary.");
  });
});