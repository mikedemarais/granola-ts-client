/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DocumentMetadata } from '../models/DocumentMetadata';
import type { DocumentsResponse } from '../models/DocumentsResponse';
import type { PanelTemplate } from '../models/PanelTemplate';
import type { TranscriptSegment } from '../models/TranscriptSegment';
import type { WorkspaceResponse } from '../models/WorkspaceResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Get workspaces
     * Retrieves the list of workspaces for the authenticated user
     * @param requestBody
     * @returns WorkspaceResponse Successful response
     * @throws ApiError
     */
    public static postV1GetWorkspaces(
        requestBody: Record<string, any>,
    ): CancelablePromise<WorkspaceResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/get-workspaces',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get documents
     * Retrieves the list of documents for the authenticated user
     * @param requestBody
     * @returns DocumentsResponse Successful response
     * @throws ApiError
     */
    public static postV2GetDocuments(
        requestBody: Record<string, any>,
    ): CancelablePromise<DocumentsResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v2/get-documents',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get document metadata
     * Retrieves metadata for a specific document
     * @param requestBody
     * @returns DocumentMetadata Successful response
     * @throws ApiError
     */
    public static postV1GetDocumentMetadata(
        requestBody: {
            document_id: string;
        },
    ): CancelablePromise<DocumentMetadata> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/get-document-metadata',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get document transcript
     * Retrieves the transcript for a specific document
     * @param requestBody
     * @returns TranscriptSegment Successful response
     * @throws ApiError
     */
    public static postV1GetDocumentTranscript(
        requestBody: {
            document_id: string;
        },
    ): CancelablePromise<Array<TranscriptSegment>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/get-document-transcript',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update document
     * Updates a document
     * @param requestBody
     * @returns any Successful response
     * @throws ApiError
     */
    public static postV1UpdateDocument(
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/update-document',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update document panel
     * Updates a document panel
     * @param requestBody
     * @returns any Successful response
     * @throws ApiError
     */
    public static postV1UpdateDocumentPanel(
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/update-document-panel',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get panel templates
     * Retrieves available panel templates
     * @param requestBody
     * @returns PanelTemplate Successful response
     * @throws ApiError
     */
    public static postV1GetPanelTemplates(
        requestBody: Record<string, any>,
    ): CancelablePromise<Array<PanelTemplate>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/get-panel-templates',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get people
     * Retrieves people data
     * @returns any Successful response
     * @throws ApiError
     */
    public static postV1GetPeople(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/get-people',
        });
    }
    /**
     * Get feature flags
     * Retrieves feature flags for the authenticated user
     * @returns any Successful response
     * @throws ApiError
     */
    public static postV1GetFeatureFlags(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/get-feature-flags',
        });
    }
    /**
     * Get Notion integration
     * Retrieves Notion integration details
     * @returns any Successful response
     * @throws ApiError
     */
    public static postV1GetNotionIntegration(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/get-notion-integration',
        });
    }
    /**
     * Get subscriptions
     * Retrieves subscription information for the authenticated user
     * @returns any Successful response
     * @throws ApiError
     */
    public static postV1GetSubscriptions(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/get-subscriptions',
        });
    }
    /**
     * Refresh Google events
     * Refreshes Google Calendar events
     * @returns any Successful response
     * @throws ApiError
     */
    public static postV1RefreshGoogleEvents(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/refresh-google-events',
        });
    }
    /**
     * Check for update
     * Checks for application updates
     * @returns any Successful response
     * @throws ApiError
     */
    public static getV1CheckForUpdateLatestMacYml(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/check-for-update/latest-mac.yml',
        });
    }
}
