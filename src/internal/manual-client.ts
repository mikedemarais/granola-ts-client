import type {
	DocumentMetadata,
	DocumentsResponse,
	PanelTemplate,
	TranscriptSegment,
	WorkspaceResponse,
} from "./generated";
import { Http } from "../http";
import type { HttpOpts } from "../http";

/**
 * Granola API Client
 * Provides methods to interact with the Granola API
 */
export class GranolaClient {
	private http: Http;

	constructor(token?: string, baseUrl?: string, opts?: HttpOpts) {
		this.http = new Http(token, baseUrl, opts);
	}

	/**
	 * Set the authentication token
	 */
	setToken(token: string): void {
		this.http.setToken(token);
	}

	/**
	 * Get workspaces for the authenticated user
	 */
	async v1_get_workspaces(
		// biome-ignore lint/suspicious/noExplicitAny: API accepts arbitrary fields
		body: Record<string, any> = {},
	): Promise<WorkspaceResponse> {
		return this.http.post<WorkspaceResponse>("/v1/get-workspaces", body);
	}

	/**
	 * Get documents from a workspace
	 */
	async v2_get_documents(
		body: {
			workspace_id?: string;
			limit?: number;
			cursor?: string;
			// biome-ignore lint/suspicious/noExplicitAny: API accepts additional fields
			[key: string]: any;
		} = {},
	): Promise<DocumentsResponse> {
		return this.http.post<DocumentsResponse>("/v2/get-documents", body);
	}

	/**
	 * Get document metadata
	 */
	async v1_get_document_metadata(body: {
		document_id: string;
		// biome-ignore lint/suspicious/noExplicitAny: API accepts additional fields
		[key: string]: any;
	}): Promise<DocumentMetadata> {
		return this.http.post<DocumentMetadata>("/v1/get-document-metadata", body);
	}

	/**
	 * Get document transcript
	 */
	async v1_get_document_transcript(body: {
		document_id: string;
		// biome-ignore lint/suspicious/noExplicitAny: API accepts additional fields
		[key: string]: any;
	}): Promise<{ transcript?: TranscriptSegment[] }> {
		return this.http.post<{ transcript?: TranscriptSegment[] }>(
			"/v1/get-document-transcript",
			body,
		);
	}

	/**
	 * Update document
	 */
	async v1_update_document(body: {
		document_id: string;
		title?: string;
		notes_markdown?: string;
		// biome-ignore lint/suspicious/noExplicitAny: API accepts additional fields
		[key: string]: any;
		// biome-ignore lint/suspicious/noExplicitAny: Response type not fully defined
	}): Promise<any> {
		return this.http.post("/v1/update-document", body);
	}

	/**
	 * Update document panel
	 */
	async v1_update_document_panel(body: {
		document_id: string;
		panel_id: string;
		// biome-ignore lint/suspicious/noExplicitAny: Content can be any structure
		content?: any;
		// biome-ignore lint/suspicious/noExplicitAny: API accepts additional fields
		[key: string]: any;
		// biome-ignore lint/suspicious/noExplicitAny: Response type not fully defined
	}): Promise<any> {
		return this.http.post("/v1/update-document-panel", body);
	}

	/**
	 * Get panel templates
	 */
	async v1_get_panel_templates(
		// biome-ignore lint/suspicious/noExplicitAny: API accepts arbitrary fields
		body: Record<string, any> = {},
	): Promise<{ panel_templates?: PanelTemplate[] }> {
		return this.http.post<{ panel_templates?: PanelTemplate[] }>(
			"/v1/get-panel-templates",
			body,
		);
	}

	/**
	 * Get people data
	 */
	// biome-ignore lint/suspicious/noExplicitAny: API accepts arbitrary fields and response type not fully defined
	async v1_get_people(body: Record<string, any> = {}): Promise<any> {
		return this.http.post("/v1/get-people", body);
	}

	/**
	 * Get feature flags
	 */
	// biome-ignore lint/suspicious/noExplicitAny: API accepts arbitrary fields and response type not fully defined
	async v1_get_feature_flags(body: Record<string, any> = {}): Promise<any> {
		return this.http.post("/v1/get-feature-flags", body);
	}

	/**
	 * Get Notion integration details
	 */
	async v1_get_notion_integration(
		// biome-ignore lint/suspicious/noExplicitAny: API accepts arbitrary fields
		body: Record<string, any> = {},
		// biome-ignore lint/suspicious/noExplicitAny: Response type not fully defined
	): Promise<any> {
		return this.http.post("/v1/get-notion-integration", body);
	}

	/**
	 * Get subscription information
	 */
	// biome-ignore lint/suspicious/noExplicitAny: API accepts arbitrary fields and response type not fully defined
	async v1_get_subscriptions(body: Record<string, any> = {}): Promise<any> {
		return this.http.post("/v1/get-subscriptions", body);
	}

	/**
	 * Refresh Google Calendar events
	 */
	// biome-ignore lint/suspicious/noExplicitAny: API accepts arbitrary fields and response type not fully defined
	async v1_refresh_google_events(body: Record<string, any> = {}): Promise<any> {
		return this.http.post("/v1/refresh-google-events", body);
	}

	/**
	 * Check for updates (macOS)
	 */
	// biome-ignore lint/suspicious/noExplicitAny: Response type not fully defined
	async v1_check_for_update_latest_mac_yml(): Promise<any> {
		return this.http.post("/v1/check-for-update/latest-mac.yml", {});
	}
}
