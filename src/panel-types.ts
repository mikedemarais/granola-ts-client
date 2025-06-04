/**
 * Types related to document panels in Granola
 */

/**
 * Panel node attributes
 */
export interface PanelNodeAttrs {
  id: string;
  level?: number;
  isSelected?: boolean;
  tight?: boolean;
}

/**
 * Panel node text content
 */
export interface PanelNodeContent {
  type: string;
  text?: string;
  attrs?: PanelNodeAttrs;
  content?: PanelNodeContent[];
}

/**
 * Panel content structure
 * This follows the ProseMirror document format used by Granola
 */
export interface PanelContent {
  type: string;
  content: PanelNodeContent[];
}

/**
 * Document panel with structured content
 */
export interface DocumentPanel {
  /** Unique identifier for the panel */
  id: string;
  
  /** Panel title (e.g., "Summary", "Action Items") */
  title: string;
  
  /** ID of the document this panel belongs to */
  document_id: string;
  
  /** When the panel was created */
  created_at: string;
  
  /** When the panel was last updated */
  updated_at: string;
  
  /** When the panel content was last updated */
  content_updated_at: string;
  
  /** When the panel was last viewed */
  last_viewed_at?: string;
  
  /** Template used for this panel */
  template_slug: string;
  
  /** Panel is marked as deleted if this timestamp exists */
  deleted_at: string | null;
  
  /** Related note ID in external systems */
  affinity_note_id: string | null;
  
  /** Structured content in ProseMirror format */
  content: PanelContent;
  
  /** Original HTML content */
  original_content: string;
  
  /** AI-suggested questions for this panel */
  suggested_questions: any[] | null;
  
  /** Lines generated for the panel, potentially by AI */
  generated_lines: Array<{
    text: string;
    matches: boolean;
  }>;
  
  /** User feedback on generated content */
  user_feedback: any | null;
}

/**
 * Response structure for document panels endpoint
 */
export type DocumentPanelsResponse = DocumentPanel[];