/**
 * Type definitions for the Granola API client
 */

// Re-export generated types
export type {
	Document,
	DocumentMetadata,
	DocumentsResponse,
	PanelTemplate,
	TranscriptSegment,
	Workspace,
	WorkspaceResponse,
} from "./internal/generated";

// Import for use in interfaces below
import type {
	Document,
	DocumentMetadata,
	DocumentsResponse,
	PanelTemplate,
	TranscriptSegment,
	WorkspaceResponse,
} from "./internal/generated";

// Request types with better type safety
export interface BaseRequest {
	[key: string]: unknown;
}

export interface DocumentsRequest extends BaseRequest {
	workspace_id?: string;
	limit?: number;
	cursor?: string;
}

export interface UpdateDocumentRequest extends BaseRequest {
	title?: string;
	notes_markdown?: string;
}

// Helper type for async generators
export type DocumentIterator = AsyncGenerator<Document, void, unknown>;

// Client method signatures
export interface GranolaClientMethods {
	setToken(token: string): void;
	getWorkspaces(body?: BaseRequest): Promise<WorkspaceResponse>;
	getDocuments(options?: DocumentsRequest): Promise<DocumentsResponse>;
	getDocumentMetadata(documentId: string): Promise<DocumentMetadata>;
	getDocumentTranscript(documentId: string): Promise<TranscriptSegment[]>;
	updateDocument(
		documentId: string,
		updates: UpdateDocumentRequest,
	): Promise<unknown>;
	updateDocumentPanel(
		documentId: string,
		panelId: string,
		content?: unknown,
	): Promise<unknown>;
	getPanelTemplates(body?: BaseRequest): Promise<PanelTemplate[]>;
	listAllDocuments(options?: DocumentsRequest): DocumentIterator;
	getPeople(body?: BaseRequest): Promise<unknown>;
	getFeatureFlags(body?: BaseRequest): Promise<unknown>;
	getNotionIntegration(body?: BaseRequest): Promise<unknown>;
	getSubscriptions(body?: BaseRequest): Promise<unknown>;
	refreshGoogleEvents(body?: BaseRequest): Promise<unknown>;
	checkForUpdate(): Promise<unknown>;
}

// Legacy method signatures for backwards compatibility
export interface LegacyMethods {
	v1_get_workspaces(body?: BaseRequest): Promise<WorkspaceResponse>;
	v2_get_documents(options?: DocumentsRequest): Promise<DocumentsResponse>;
	v1_get_document_metadata(body: {
		document_id: string;
		[key: string]: unknown;
	}): Promise<DocumentMetadata>;
	v1_get_document_transcript(body: {
		document_id: string;
		[key: string]: unknown;
	}): Promise<{ transcript?: TranscriptSegment[] }>;
	v1_update_document(body: {
		document_id: string;
		[key: string]: unknown;
	}): Promise<unknown>;
	v1_update_document_panel(body: {
		document_id: string;
		panel_id: string;
		content?: unknown;
		[key: string]: unknown;
	}): Promise<unknown>;
	v1_get_panel_templates(
		body?: BaseRequest,
	): Promise<{ panel_templates?: PanelTemplate[] }>;
	v1_get_people(body?: BaseRequest): Promise<unknown>;
	v1_get_feature_flags(body?: BaseRequest): Promise<unknown>;
	v1_get_notion_integration(body?: BaseRequest): Promise<unknown>;
	v1_get_subscriptions(body?: BaseRequest): Promise<unknown>;
	v1_refresh_google_events(body?: BaseRequest): Promise<unknown>;
	v1_check_for_update_latest_mac_yml(): Promise<unknown>;
}

// Complete client interface
export interface GranolaClient extends GranolaClientMethods, LegacyMethods {}
