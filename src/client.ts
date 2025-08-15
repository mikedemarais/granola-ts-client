/**
 * Stable public API for the Granola TypeScript client.
 */

import type { HttpOpts } from "./http";
import type {
	Document,
	DocumentMetadata,
	DocumentsResponse,
	PanelTemplate,
	TranscriptSegment,
	WorkspaceResponse,
} from "./internal/generated";
import { GranolaClient as InternalClient } from "./internal/manual-client";

// Map old method names to new ones for backwards compatibility
const METHOD_ALIASES: Record<string, string> = {
	v1_get_workspaces: "getWorkspaces",
	v2_get_documents: "getDocuments",
	v1_get_document_metadata: "getDocumentMetadata",
	v1_get_document_transcript: "getDocumentTranscript",
	v1_update_document: "updateDocument",
	v1_update_document_panel: "updateDocumentPanel",
	v1_get_panel_templates: "getPanelTemplates",
	v1_get_people: "getPeople",
	v1_get_feature_flags: "getFeatureFlags",
	v1_get_notion_integration: "getNotionIntegration",
	v1_get_subscriptions: "getSubscriptions",
	v1_refresh_google_events: "refreshGoogleEvents",
	v1_check_for_update_latest_mac_yml: "checkForUpdate",
};

/**
 * Granola API Client with automatic backwards compatibility.
 *
 * @example
 * ```ts
 * import GranolaClient from 'granola-ts-client';
 *
 * const client = new GranolaClient('your-api-token');
 * const workspaces = await client.getWorkspaces();
 *
 * // Iterate through all documents
 * for await (const doc of client.listAllDocuments({ workspace_id: 'abc' })) {
 *   console.log(doc.title);
 * }
 * ```
 */
class GranolaClientImpl {
	private internal: InternalClient;

	constructor(token?: string, baseUrl?: string, opts?: HttpOpts) {
		this.internal = new InternalClient(token, baseUrl, opts);

		// Bind all methods to ensure they work when destructured
		this.setToken = this.setToken.bind(this);
		this.getWorkspaces = this.getWorkspaces.bind(this);
		this.getDocuments = this.getDocuments.bind(this);
		this.getDocumentMetadata = this.getDocumentMetadata.bind(this);
		this.getDocumentTranscript = this.getDocumentTranscript.bind(this);
		this.updateDocument = this.updateDocument.bind(this);
		this.updateDocumentPanel = this.updateDocumentPanel.bind(this);
		this.getPanelTemplates = this.getPanelTemplates.bind(this);
		this.getPeople = this.getPeople.bind(this);
		this.getFeatureFlags = this.getFeatureFlags.bind(this);
		this.getNotionIntegration = this.getNotionIntegration.bind(this);
		this.getSubscriptions = this.getSubscriptions.bind(this);
		this.refreshGoogleEvents = this.refreshGoogleEvents.bind(this);
		this.checkForUpdate = this.checkForUpdate.bind(this);
		this.listAllDocuments = this.listAllDocuments.bind(this);
	}

	/** Set the authentication token */
	setToken(token: string): void {
		this.internal.setToken(token);
	}

	/** Get user's workspaces */
	async getWorkspaces(body = {}): Promise<WorkspaceResponse> {
		return this.internal.v1_get_workspaces(body);
	}

	/** Get documents with pagination */
	async getDocuments(options = {}): Promise<DocumentsResponse> {
		return this.internal.v2_get_documents(options);
	}

	/** Get document metadata */
	async getDocumentMetadata(documentId: string): Promise<DocumentMetadata> {
		return this.internal.v1_get_document_metadata({ document_id: documentId });
	}

	/** Get document transcript */
	async getDocumentTranscript(
		documentId: string,
	): Promise<TranscriptSegment[]> {
		const response = await this.internal.v1_get_document_transcript({
			document_id: documentId,
		});
		return response?.transcript || [];
	}

	/** Update a document */
	async updateDocument(
		documentId: string,
		updates: Record<string, unknown>,
	): Promise<unknown> {
		return this.internal.v1_update_document({
			document_id: documentId,
			...updates,
		});
	}

	/** Update a document panel */
	async updateDocumentPanel(
		documentId: string,
		panelId: string,
		content?: unknown,
	): Promise<unknown> {
		return this.internal.v1_update_document_panel({
			document_id: documentId,
			panel_id: panelId,
			content,
		});
	}

	/** Get panel templates */
	async getPanelTemplates(body = {}): Promise<PanelTemplate[]> {
		const response = await this.internal.v1_get_panel_templates(body);
		return response?.panel_templates || [];
	}

	/** Get people data */
	async getPeople(body = {}): Promise<unknown> {
		return this.internal.v1_get_people(body);
	}

	/** Get feature flags */
	async getFeatureFlags(body = {}): Promise<unknown> {
		return this.internal.v1_get_feature_flags(body);
	}

	/** Get Notion integration details */
	async getNotionIntegration(body = {}): Promise<unknown> {
		return this.internal.v1_get_notion_integration(body);
	}

	/** Get subscription information */
	async getSubscriptions(body = {}): Promise<unknown> {
		return this.internal.v1_get_subscriptions(body);
	}

	/** Refresh Google Calendar events */
	async refreshGoogleEvents(body = {}): Promise<unknown> {
		return this.internal.v1_refresh_google_events(body);
	}

	/** Check for app updates */
	async checkForUpdate(): Promise<unknown> {
		return this.internal.v1_check_for_update_latest_mac_yml();
	}

	/**
	 * Iterate through all documents with automatic pagination.
	 *
	 * @example
	 * ```ts
	 * for await (const doc of client.listAllDocuments({ workspace_id: 'abc' })) {
	 *   console.log(doc.title);
	 * }
	 * ```
	 */
	async *listAllDocuments(
		options: Record<string, unknown> = {},
	): AsyncGenerator<Document, void, unknown> {
		let cursor: string | undefined;

		do {
			const response = await this.getDocuments({ ...options, cursor });

			if (response?.docs) {
				for (const doc of response.docs) {
					yield doc;
				}
			}

			// Simple cursor handling - trust the API response
			// biome-ignore lint/suspicious/noExplicitAny: API response structure
			cursor = (response as any)?.next_cursor;
		} while (cursor);
	}

	// Expose internal client for direct access if needed
	get internalClient(): InternalClient {
		return this.internal;
	}
}

/**
 * Create a Proxy-wrapped client for backwards compatibility.
 * Handles old method names transparently.
 */
function createGranolaClient(
	token?: string,
	baseUrl?: string,
	opts?: HttpOpts,
): GranolaClientImpl {
	const client = new GranolaClientImpl(token, baseUrl, opts);

	return new Proxy(client, {
		get(target, prop) {
			// Handle old method names
			if (typeof prop === "string" && prop in METHOD_ALIASES) {
				const newMethod = METHOD_ALIASES[prop];

				// Special handling for methods that need parameter transformation
				if (prop === "v1_get_document_metadata") {
					return async (body: {
						document_id: string;
						[key: string]: unknown;
					}) => {
						return target.getDocumentMetadata(body.document_id);
					};
				}

				if (prop === "v1_get_document_transcript") {
					return async (body: {
						document_id: string;
						[key: string]: unknown;
					}) => {
						const transcript = await target.getDocumentTranscript(
							body.document_id,
						);
						return { transcript };
					};
				}

				if (prop === "v1_update_document") {
					return async (body: {
						document_id: string;
						[key: string]: unknown;
					}) => {
						const { document_id, ...updates } = body;
						return target.updateDocument(document_id, updates);
					};
				}

				if (prop === "v1_update_document_panel") {
					return async (body: {
						document_id: string;
						panel_id: string;
						content?: unknown;
						[key: string]: unknown;
					}) => {
						return target.updateDocumentPanel(
							body.document_id,
							body.panel_id,
							body.content,
						);
					};
				}

				if (prop === "v1_get_panel_templates") {
					return async (body: Record<string, unknown> = {}) => {
						const templates = await target.getPanelTemplates(body);
						return { panel_templates: templates };
					};
				}

				// For simple aliases, return the method directly
				const method = target[newMethod as keyof GranolaClientImpl];
				if (typeof method === "function") {
					return method.bind(target);
				}
			}

			// Return the original property
			return Reflect.get(target, prop);
		},
	}) as GranolaClientImpl;
}

// Export as a class constructor
export const GranolaClient = createGranolaClient as unknown as {
	new (token?: string, baseUrl?: string, opts?: HttpOpts): GranolaClientImpl;
};
