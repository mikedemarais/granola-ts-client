import { describe, test, expect } from "bun:test";
import { PanelClient } from "../src/panel-client";
import type { DocumentPanel } from "../src/panel-types";

describe("PanelClient section extraction", () => {
  const client = new PanelClient("fake-token");
  
  test("extractStructuredContent should parse sections from HTML content", () => {
    // Create a mock panel with HTML content containing sections
    const mockPanel = {
      id: "panel-123",
      title: "Summary",
      document_id: "doc-456",
      template_slug: "b491d27c-1106-4ebf-97c5-d5129742945c",
      original_content: `
        <h1>Introduction</h1>
        <p>This is the introduction paragraph.</p>
        <p>It has multiple parts.</p>
        
        <h1>Agenda Items</h1>
        <ul>
          <li>Item 1 with some details</li>
          <li>Item 2 with more information</li>
        </ul>
        
        <h1>Key Decisions</h1>
        <p>These are the important decisions made:</p>
        <ul>
          <li>Decision A was made</li>
          <li>Decision B was confirmed</li>
        </ul>
        
        <h1>Action Items</h1>
        <ul>
          <li>Person 1: Complete task X</li>
          <li>Person 2: Finish project Y</li>
        </ul>
      `,
      content: { type: "doc", content: [] }, // Simplified for test
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      content_updated_at: "2023-01-01T00:00:00Z",
      deleted_at: null,
      affinity_note_id: null,
      last_viewed_at: "2023-01-01T00:00:00Z",
      generated_lines: [],
      suggested_questions: null,
      user_feedback: null
    } as DocumentPanel;
    
    // Extract sections
    const sections = client.extractStructuredContent(mockPanel);
    
    // Verify all sections were correctly extracted
    expect(Object.keys(sections)).toEqual([
      "Introduction",
      "Agenda Items",
      "Key Decisions",
      "Action Items"
    ]);
    
    // Verify content of specific sections
    expect(sections["Introduction"]).toContain("This is the introduction paragraph");
    expect(sections["Introduction"]).toContain("It has multiple parts");
    
    // Verify list items are formatted with bullets
    expect(sections["Agenda Items"]).toContain("• Item 1 with some details");
    expect(sections["Agenda Items"]).toContain("• Item 2 with more information");
    
    // Verify nested content structure
    expect(sections["Key Decisions"]).toContain("These are the important decisions made:");
    expect(sections["Key Decisions"]).toContain("• Decision A was made");
    
    // Verify action items
    expect(sections["Action Items"]).toContain("• Person 1: Complete task X");
    expect(sections["Action Items"]).toContain("• Person 2: Finish project Y");
  });
  
  test("extractStructuredContent should handle empty or missing content", () => {
    // Panel with no original_content
    const emptyPanel = {
      id: "panel-empty",
      title: "Empty Panel",
      document_id: "doc-456",
      template_slug: "empty-template",
      original_content: "",
      content: { type: "doc", content: [] },
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      content_updated_at: "2023-01-01T00:00:00Z",
      deleted_at: null,
      affinity_note_id: null,
      last_viewed_at: "2023-01-01T00:00:00Z",
      generated_lines: [],
      suggested_questions: null,
      user_feedback: null
    } as DocumentPanel;
    
    // Extract sections
    const sections = client.extractStructuredContent(emptyPanel);
    
    // Verify result is empty object
    expect(sections).toEqual({});
  });
  
  test("extractStructuredContent should handle sections without content", () => {
    // Panel with headings but no content
    const sparsePanel = {
      id: "panel-sparse",
      title: "Sparse Panel",
      document_id: "doc-456",
      template_slug: "sparse-template",
      original_content: `
        <h1>First Section</h1>
        
        <h1>Second Section</h1>
        
        <h1>Third Section</h1>
        <p></p>
      `,
      content: { type: "doc", content: [] },
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      content_updated_at: "2023-01-01T00:00:00Z",
      deleted_at: null,
      affinity_note_id: null,
      last_viewed_at: "2023-01-01T00:00:00Z",
      generated_lines: [],
      suggested_questions: null,
      user_feedback: null
    } as DocumentPanel;
    
    // Extract sections
    const sections = client.extractStructuredContent(sparsePanel);
    
    // Verify all section keys exist
    expect(Object.keys(sections)).toEqual([
      "First Section",
      "Second Section",
      "Third Section"
    ]);
    
    // Verify content is empty or minimal
    expect(sections["First Section"]).toBe("");
    expect(sections["Second Section"]).toBe("");
    expect(sections["Third Section"]).toBe("");
  });
  
  test("extractStructuredContent should handle HTML entities in content", () => {
    // Panel with HTML entities
    const entityPanel = {
      id: "panel-entities",
      title: "Entity Panel",
      document_id: "doc-456",
      template_slug: "entity-template",
      original_content: `
        <h1>HTML Entities</h1>
        <p>This has &amp; ampersand and &lt;tags&gt; and &quot;quotes&quot;</p>
      `,
      content: { type: "doc", content: [] },
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      content_updated_at: "2023-01-01T00:00:00Z",
      deleted_at: null,
      affinity_note_id: null,
      last_viewed_at: "2023-01-01T00:00:00Z",
      generated_lines: [],
      suggested_questions: null,
      user_feedback: null
    } as DocumentPanel;
    
    // Extract sections
    const sections = client.extractStructuredContent(entityPanel);
    
    // Verify HTML entities are decoded
    expect(sections["HTML Entities"]).toBe("This has & ampersand and <tags> and \"quotes\"");
  });
});