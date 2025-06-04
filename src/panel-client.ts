// src/panel-client.ts
import GranolaClient from './client';
import type { DocumentPanel, DocumentPanelsResponse } from './panel-types';

/**
 * Extended client with document panel capabilities
 * Adds methods for retrieving and analyzing document panels,
 * which are not part of the official API but accessible through
 * undocumented endpoints.
 */
export class PanelClient extends GranolaClient {
  /**
   * Retrieve all panels for a document
   * @param documentId ID of the document
   * @returns Array of document panels with their content
   * @example
   * ```ts
   * const panels = await client.getDocumentPanels('doc-123');
   * for (const panel of panels) {
   *   console.log(`Panel: ${panel.title}`);
   *   console.log(`Content: ${panel.original_content.substring(0, 100)}...`);
   * }
   * ```
   */
  public async getDocumentPanels(documentId: string): Promise<DocumentPanel[]> {
    // Access the internal HTTP client to make a request to the undocumented endpoint
    // @ts-ignore - Accessing private http property (needed for undocumented API)
    return this.http.post<DocumentPanelsResponse>('/v1/get-document-panels', { document_id: documentId });
  }

  /**
   * Get a specific panel from a document
   * @param documentId ID of the document
   * @param panelTitle Title of the panel to retrieve (case-insensitive, e.g., "Summary", "Action Items")
   * @returns The requested panel or null if not found
   * @example
   * ```ts
   * const summaryPanel = await client.getDocumentPanelByTitle('doc-123', 'Summary');
   * if (summaryPanel) {
   *   console.log('Summary content:', summaryPanel.original_content);
   * }
   * ```
   */
  public async getDocumentPanelByTitle(documentId: string, panelTitle: string): Promise<DocumentPanel | null> {
    const panels = await this.getDocumentPanels(documentId);
    return panels.find(panel => panel.title.toLowerCase() === panelTitle.toLowerCase()) || null;
  }

  /**
   * Check if a document has an AI-generated summary panel
   * @param documentId ID of the document
   * @returns True if the document has a summary panel with AI-generated content
   * @example
   * ```ts
   * if (await client.hasAiGeneratedSummary('doc-123')) {
   *   console.log('This document has an AI-generated summary');
   * }
   * ```
   */
  public async hasAiGeneratedSummary(documentId: string): Promise<boolean> {
    const summaryPanel = await this.getDocumentPanelByTitle(documentId, 'Summary');
    if (!summaryPanel) return false;
    
    // Check for generated_lines which indicates AI generation
    return Array.isArray(summaryPanel.generated_lines) && 
           summaryPanel.generated_lines.length > 0;
  }

  /**
   * Extract AI-generated text from a document's summary panel
   * @param documentId ID of the document
   * @returns Plain text of the AI-generated summary or null if not found
   * @example
   * ```ts
   * const summary = await client.extractAiGeneratedSummary('doc-123');
   * if (summary) {
   *   console.log('AI Summary:', summary);
   * }
   * ```
   */
  public async extractAiGeneratedSummary(documentId: string): Promise<string | null> {
    const summaryPanel = await this.getDocumentPanelByTitle(documentId, 'Summary');
    if (!summaryPanel || !Array.isArray(summaryPanel.generated_lines)) {
      return null;
    }
    
    // Extract text from generated lines
    const summaryText = summaryPanel.generated_lines
      .map(line => line.text)
      .join('\n');
      
    return summaryText || null;
  }

  /**
   * Check if a document has panels of any kind
   * @param documentId ID of the document
   * @returns True if the document has any panels
   * @example
   * ```ts
   * if (await client.hasDocumentPanels('doc-123')) {
   *   const panels = await client.getDocumentPanels('doc-123');
   *   console.log(`Document has ${panels.length} panels`);
   * }
   * ```
   */
  public async hasDocumentPanels(documentId: string): Promise<boolean> {
    try {
      const panels = await this.getDocumentPanels(documentId);
      return panels.length > 0;
    } catch (error) {
      // If the API fails, assume no panels
      return false;
    }
  }
  
  /**
   * Extract all text content from a panel in plain text format
   * @param panel The panel object
   * @returns Plain text content extracted from the panel
   */
  public extractPlainTextFromPanel(panel: DocumentPanel): string {
    // Use original_content which is HTML and convert to plain text
    if (panel.original_content) {
      // Simple HTML to text conversion (handles basic tags)
      return panel.original_content
        .replace(/<[^>]*>/g, ' ') // Replace HTML tags with space
        .replace(/&amp;/g, '&')   // Replace HTML entities
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();
    }
    
    // Fallback to extracting text from the ProseMirror structure
    if (panel.content && panel.content.content) {
      return this.extractTextFromProseMirror(panel.content);
    }
    
    return '';
  }
  
  /**
   * Recursively extract text from ProseMirror document structure
   * @param node ProseMirror node or content
   * @returns Plain text extracted from the node
   * @private
   */
  private extractTextFromProseMirror(node: any): string {
    if (typeof node === 'string') return node;
    if (!node) return '';
    
    // If node has direct text property
    if (node.text) return node.text;
    
    // If node has content array
    if (Array.isArray(node.content)) {
      return node.content.map((child: any) => this.extractTextFromProseMirror(child)).join(' ');
    }
    
    return '';
  }
  
  /**
   * Extract structured content from a panel by sections
   * @param panel The document panel to extract content from
   * @returns An object with section headings as keys and content as values
   * @example
   * ```ts
   * const client = new PanelClient();
   * const panels = await client.getDocumentPanels('doc-123');
   * const summaryPanel = panels.find(p => p.title === 'Summary');
   * if (summaryPanel) {
   *   const sections = client.extractStructuredContent(summaryPanel);
   *   console.log('Introduction:', sections['Introduction']);
   *   console.log('Action Items:', sections['Action Items']);
   * }
   * ```
   */
  public extractStructuredContent(panel: DocumentPanel): Record<string, string> {
    if (!panel.original_content) {
      return {};
    }

    const html = panel.original_content;
    const sectionRegex = /<h1>(.*?)<\/h1>([\s\S]*?)(?=<h1>|$)/g;
    const sections: Record<string, string> = {};
    
    let match;
    while ((match = sectionRegex.exec(html)) !== null) {
      const heading = match[1].trim();
      let content = match[2].trim();
      
      // Clean HTML but preserve structure
      content = content
        .replace(/<p>([\s\S]*?)<\/p>/g, '$1\n\n')
        .replace(/<li>([\s\S]*?)<\/li>/g, '• $1\n')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
        
      sections[heading] = content;
    }
    
    return sections;
  }
}

export default PanelClient;