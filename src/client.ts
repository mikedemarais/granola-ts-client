// src/client.ts
import { Http } from './http';
import type { HttpOpts } from './http';
import { paginate } from './pagination';
import type { components } from './schema';

// Aliases for response schemas
type WorkspaceResponse = components['schemas']['WorkspaceResponse'];
type DocumentsResponse = components['schemas']['DocumentsResponse'];
type DocumentMetadata = components['schemas']['DocumentMetadata'];
type TranscriptSegment = components['schemas']['TranscriptSegment'];
type PanelTemplate = components['schemas']['PanelTemplate'];
type Document = components['schemas']['Document'];

// Define missing response types
/**
 * Response containing information about people
 */
export interface PeopleResponse {
  /** Array of people information */
  people: Array<{
    /** Unique identifier for the person */
    id: string;
    /** Full name of the person */
    name: string;
    /** Email address of the person */
    email: string;
    /** Additional details about the person */
    details?: Record<string, unknown>;
  }>;
}

/**
 * Response containing feature flag settings
 */
export interface FeatureFlagsResponse {
  /** Map of feature names to boolean values indicating if they're enabled */
  flags: Record<string, boolean>;
}

/**
 * Response containing Notion integration details
 */
export interface NotionIntegrationResponse {
  /** Whether the user has connected Notion */
  connected: boolean;
  /** Available Notion workspaces */
  workspaces?: Array<{
    /** Workspace ID */
    id: string;
    /** Workspace name */
    name: string;
  }>;
}

/**
 * Response containing subscription information
 */
export interface SubscriptionsResponse {
  /** Array of subscription details */
  subscriptions: Array<{
    /** Unique identifier for the subscription */
    id: string;
    /** Type of plan (e.g., "free", "pro", "team") */
    plan_type: string;
    /** Current status of the subscription */
    status: string;
    /** When the current billing period ends */
    current_period_end: string;
    /** ID of the workspace this subscription applies to */
    workspace_id?: string;
    /** When the subscription was canceled, if applicable */
    canceled_at?: string;
  }>;
}

/**
 * Client configuration options.
 */
export interface ClientOpts extends HttpOpts {
  /** Base URL for the Granola API */
  baseUrl?: string;
  /** App version for client identification (default: 6.4.0) */
  appVersion?: string;
  /** Client type for identification (default: electron) */
  clientType?: string;
  /** Platform for client identification (default: darwin) */
  clientPlatform?: string;
  /** Architecture for client identification (default: arm64) */
  clientArchitecture?: string;
  /** Electron version for user agent (default: 33.4.5) */
  electronVersion?: string;
  /** Chrome version for user agent (default: 130.0.6723.191) */
  chromeVersion?: string;
  /** Node version for user agent (default: 20.18.3) */
  nodeVersion?: string;
  /** OS version for user agent (default: 15.3.1) */
  osVersion?: string;
  /** OS build for user agent (default: 24D70) */
  osBuild?: string;
}

/**
 * Granola API client.
 */
export class GranolaClient {
  private http: Http;

  /**
   * Extract authentication tokens from a local Granola app installation.
   * This can be used to obtain tokens for authenticating with the API and bypassing
   * the "Unsupported client" validation by using the same tokens as the official app.
   * 
   * Note: This requires:
   * - Running in a Node.js environment 
   * - Having the Granola desktop app installed and logged in on macOS
   * - Access to the Granola tokens file at ~/Library/Application Support/Granola/supabase.json
   * - Only macOS is supported
   * 
   * @returns Object containing access and refresh tokens from the official Granola app
   * @throws Error if tokens cannot be read or parsed
   * @example
   * ```ts
   * // Get tokens from the local Granola app
   * const { accessToken } = await GranolaClient.getAuthTokens();
   * 
   * // Create a client with the extracted token
   * const client = new GranolaClient(accessToken);
   * 
   * // API calls will work without "Unsupported client" errors
   * const workspaces = await client.getWorkspaces();
   * ```
   */
  public static async getAuthTokens(): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // This requires running in a Node.js environment
      if (typeof process === 'undefined' || typeof require !== 'function') {
        throw new Error('getAuthTokens can only be used in a Node.js environment');
      }
      
      // Dynamically import required modules
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      
      // Path to Granola app support directory (macOS only)
      const homedir = os.homedir();
      const granolaDir = path.join(homedir, 'Library/Application Support/Granola');
      const supabaseFilePath = path.join(granolaDir, 'supabase.json');
      
      // Check if the file exists
      if (!fs.existsSync(supabaseFilePath)) {
        throw new Error(`Granola token file not found at ${supabaseFilePath}. Make sure Granola desktop app is installed and you're logged in. The expected path is: ~/Library/Application Support/Granola/supabase.json`);
      }
      
      // Read and parse the tokens
      const supabaseData = JSON.parse(fs.readFileSync(supabaseFilePath, 'utf8'));
      
      if (!supabaseData.cognito_tokens) {
        throw new Error(`No cognito_tokens found in ${supabaseFilePath}`);
      }
      
      const cognitoTokens = JSON.parse(supabaseData.cognito_tokens);
      
      return {
        accessToken: cognitoTokens.access_token,
        refreshToken: cognitoTokens.refresh_token
      };
    } catch (error) {
      console.error('Error extracting Granola authentication tokens:', error);
      throw new Error(`Failed to extract authentication tokens: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new GranolaClient.
   * @param token API authentication token (optional - will be automatically retrieved if not provided)
   * @param opts HTTP and client options
   * @example
   * ```ts
   * // Auto-retrieval of token from local Granola installation
   * const client = new GranolaClient();
   * 
   * // Basic client with explicitly provided token
   * const client = new GranolaClient("your_token");
   * 
   * // Client with custom client identification
   * const client = new GranolaClient("your_token", {
   *   appVersion: "6.5.0",
   *   clientType: "electron", 
   *   clientPlatform: "darwin",
   *   clientArchitecture: "arm64"
   * });
   * ```
   */
  constructor(token?: string, opts: ClientOpts = {}) {
    this.http = new Http(token, opts.baseUrl, opts);
    
    // If no token is provided, we'll lazily fetch it when needed
    if (!token) {
      this.http.setTokenProvider(async () => {
        const { accessToken } = await GranolaClient.getAuthTokens();
        return accessToken;
      });
    }
  }

  /**
   * Retrieve all workspaces for the user.
   * @returns List of workspaces the user has access to
   * @example
   * ```ts
   * const workspaces = await client.getWorkspaces();
   * console.log(`You have ${workspaces.workspaces.length} workspaces`);
   * ```
   */
  public getWorkspaces(): Promise<WorkspaceResponse> {
    return this.http.post<WorkspaceResponse>('/v1/get-workspaces', {});
  }

  /**
   * Fetch a single page of documents.
   * @param filters Optional query filters
   * @param filters.workspace_id Optional workspace ID to filter by
   * @param filters.cursor Optional pagination cursor
   * @param filters.limit Optional limit of documents to return
   * @returns A page of documents
   * @example
   * ```ts
   * // Get first page of documents
   * const docs = await client.getDocuments({ limit: 20 });
   * 
   * // Get documents from a specific workspace
   * const workspaceDocs = await client.getDocuments({ 
   *   workspace_id: 'abc-123',
   *   limit: 50
   * });
   * ```
   */
  public getDocuments(filters: {
    workspace_id?: string;
    cursor?: string;
    limit?: number;
    [key: string]: unknown;
  } = {}): Promise<DocumentsResponse> {
    return this.http.post<DocumentsResponse>('/v2/get-documents', filters);
  }

  /**
   * Async iterator to paginate through all documents.
   * @param filters Optional query filters (same as getDocuments)
   * @returns AsyncGenerator that yields documents one by one
   * @example
   * ```ts
   * // Iterate through all documents in a workspace
   * for await (const doc of client.listAllDocuments({ workspace_id: 'abc-123' })) {
   *   console.log(`Document: ${doc.title}`);
   * }
   * ```
   */
  public async *listAllDocuments(filters: {
    workspace_id?: string;
    limit?: number;
    [key: string]: unknown;
  } = {}): AsyncGenerator<Document, void, unknown> {
    yield* paginate(async (cursor?: string) => {
      const response = await this.getDocuments({ ...filters, cursor });
      // Handle next_cursor which may be present in the response
      const nextCursor = 'next_cursor' in response ? 
        (response as unknown as { next_cursor?: string }).next_cursor : 
        undefined;
      
      return { 
        items: response.docs ?? [], 
        next: nextCursor
      };
    });
  }

  /**
   * Retrieve metadata for a document.
   * @param documentId ID of the document
   * @returns Document metadata including creator and attendees
   * @example
   * ```ts
   * const metadata = await client.getDocumentMetadata('doc-123');
   * console.log(`Created by: ${metadata.creator.name}`);
   * ```
   */
  public getDocumentMetadata(documentId: string): Promise<DocumentMetadata> {
    return this.http.post<DocumentMetadata>('/v1/get-document-metadata', { document_id: documentId });
  }

  /**
   * Retrieve transcript segments for a document.
   * @param documentId ID of the document
   * @returns Array of transcript segments with timestamps
   * @example
   * ```ts
   * const transcript = await client.getDocumentTranscript('doc-123');
   * for (const segment of transcript) {
   *   console.log(`${segment.start_timestamp}: ${segment.text}`);
   * }
   * ```
   */
  public getDocumentTranscript(documentId: string): Promise<TranscriptSegment[]> {
    return this.http.post<TranscriptSegment[]>('/v1/get-document-transcript', { document_id: documentId });
  }

  /**
   * Update a document.
   * @param payload Document fields to update
   * @param payload.document_id ID of the document to update
   * @param payload.title Optional new title for the document
   * @param payload.notes Optional new notes content
   * @param payload.overview Optional new overview content
   * @param payload.notes_plain Optional new plain text notes
   * @param payload.notes_markdown Optional new markdown formatted notes
   * @returns Promise that resolves when the update is complete
   */
  public updateDocument(payload: {
    document_id: string;
    title?: string;
    notes?: Record<string, unknown>;
    overview?: string;
    notes_plain?: string;
    notes_markdown?: string;
    [key: string]: unknown;
  }): Promise<void> {
    return this.http.post<void>('/v1/update-document', payload);
  }

  /**
   * Update a document panel.
   * @param payload Panel data to update
   * @param payload.document_id ID of the document the panel belongs to
   * @param payload.panel_id ID of the panel to update
   * @param payload.content Content to update in the panel
   * @returns Promise that resolves when the update is complete
   */
  public updateDocumentPanel(payload: {
    document_id: string;
    panel_id: string;
    content: Record<string, unknown>;
    [key: string]: unknown;
  }): Promise<void> {
    return this.http.post<void>('/v1/update-document-panel', payload);
  }

  /**
   * Retrieve available panel templates.
   * @returns Array of panel templates that can be used with documents
   * @example
   * ```ts
   * const templates = await client.getPanelTemplates();
   * console.log(`Available templates: ${templates.map(t => t.title).join(', ')}`);
   * ```
   */
  public getPanelTemplates(): Promise<PanelTemplate[]> {
    return this.http.post<PanelTemplate[]>('/v1/get-panel-templates', {});
  }

  /**
   * Retrieve people data.
   * @returns Information about people in the user's network
   * @example
   * ```ts
   * const peopleData = await client.getPeople();
   * console.log(`Found ${peopleData.people.length} people`);
   * ```
   */
  public getPeople(): Promise<PeopleResponse> {
    return this.http.post<PeopleResponse>('/v1/get-people');
  }

  /**
   * Retrieve feature flags for the user.
   * @returns Object containing feature flag values
   * @example
   * ```ts
   * const featureFlags = await client.getFeatureFlags();
   * if (featureFlags.flags.newFeature) {
   *   // Use new feature
   * }
   * ```
   */
  public getFeatureFlags(): Promise<FeatureFlagsResponse> {
    return this.http.post<FeatureFlagsResponse>('/v1/get-feature-flags');
  }

  /**
   * Retrieve Notion integration details.
   * @returns Information about the user's Notion integration
   * @example
   * ```ts
   * const notionIntegration = await client.getNotionIntegration();
   * if (notionIntegration.connected) {
   *   console.log('Notion is connected');
   * }
   * ```
   */
  public getNotionIntegration(): Promise<NotionIntegrationResponse> {
    return this.http.post<NotionIntegrationResponse>('/v1/get-notion-integration');
  }

  /**
   * Retrieve subscription information for the user.
   * @returns Details about the user's subscription plans
   * @example
   * ```ts
   * const subscriptions = await client.getSubscriptions();
   * for (const sub of subscriptions.subscriptions) {
   *   console.log(`Plan: ${sub.plan_type}, Status: ${sub.status}`);
   * }
   * ```
   */
  public getSubscriptions(): Promise<SubscriptionsResponse> {
    return this.http.post<SubscriptionsResponse>('/v1/get-subscriptions');
  }

  /**
   * Refresh Google Calendar events.
   * @returns Promise that resolves when the refresh is complete
   * @example
   * ```ts
   * await client.refreshGoogleEvents();
   * console.log('Google events refreshed');
   * ```
   */
  public refreshGoogleEvents(): Promise<void> {
    return this.http.post<void>('/v1/refresh-google-events');
  }

  /**
   * Check for application updates (YAML manifest).
   * @returns YAML string containing update information
   * @example
   * ```ts
   * const updateInfo = await client.checkForUpdate();
   * console.log('Update info:', updateInfo);
   * ```
   */
  public checkForUpdate(): Promise<string> {
    return this.http.getText('/v1/check-for-update/latest-mac.yml');
  }
}

export default GranolaClient;