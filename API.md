# Granola API Documentation

This document provides details of the Granola API endpoints based on analysis of network requests.

## Authentication

All API requests require a Bearer token for authentication:

```
Authorization: Bearer <token>
```

## Base URL

```
https://api.granola.ai
```

## Endpoints

### 1. Get Workspaces

Retrieves the list of workspaces for the authenticated user.

**Endpoint:** `/v1/get-workspaces`  
**Method:** `POST`  
**Request Body:** Empty object (`{}`)

**Response:**

```json
{
  "workspaces": [
    {
      "workspace": {
        "workspace_id": "string",
        "slug": "string",
        "display_name": "string",
        "is_locked": boolean,
        "created_at": "string (ISO date)",
        "updated_at": "string (ISO date)",
        "privacy_mode_enabled": boolean,
        "sharing_link_visibility": string|null
      },
      "role": "string",
      "plan_type": "string"
    }
  ]
}
```

### 2. Get Documents

Retrieves the list of documents for the authenticated user.

**Endpoint:** `/v2/get-documents`  
**Method:** `POST`  
**Request Body:** Contains filter/query parameters

**Response:**

```json
{
  "docs": [
    {
      "id": "string",
      "created_at": "string (ISO date)",
      "notes": {
        "type": "string",
        "content": [
          {
            "type": "string",
            "attrs": {
              "id": "string",
              "timestamp": null,
              "timestamp-to": null
            }
          }
        ]
      },
      "title": "string",
      "user_id": "string",
      "cloned_from": null,
      "notes_plain": "string",
      "transcribe": boolean,
      "google_calendar_event": {
        // Calendar event details
      },
      "updated_at": "string (ISO date)",
      "deleted_at": null,
      "type": null,
      "overview": null,
      "public": boolean,
      "people": {
        "creator": {
          "name": "string",
          "email": "string",
          "details": {
            "person": {
              "name": {
                "fullName": "string"
              },
              "avatar": "string (URL)",
              "employment": {
                "name": "string",
                "title": "string"
              }
            },
            "company": {
              "name": "string"
            }
          }
        },
        "attendees": [
          // Array of attendee objects
        ]
      },
      "chapters": null,
      "meeting_end_count": number,
      "notes_markdown": "string",
      "selected_template": null,
      "valid_meeting": boolean,
      "summary": null,
      "affinity_note_id": null,
      "has_shareable_link": boolean,
      "show_private_notes": boolean,
      "attachments": [],
      "hubspot_note_url": null,
      "creation_source": "string",
      "subscription_plan_id": "string",
      "status": null,
      "external_transcription_id": null,
      "audio_file_handle": null,
      "privacy_mode_enabled": boolean,
      "workspace_id": null,
      "visibility": null,
      "sharing_link_visibility": "string",
      "notification_config": null
    }
  ]
}
```

### 3. Get Document Metadata

Retrieves metadata for a specific document.

**Endpoint:** `/v1/get-document-metadata`  
**Method:** `POST`  
**Request Body:**

```json
{
  "document_id": "string"
}
```

**Response:**

```json
{
  "creator": {
    "name": "string",
    "email": "string",
    "details": {
      "person": {
        "name": {
          "fullName": "string"
        },
        "avatar": "string (URL)",
        "employment": {
          "title": "string",
          "name": "string"
        }
      },
      "company": {
        "name": "string"
      }
    }
  },
  "attendees": []
}
```

### 4. Get Document Transcript

Retrieves the transcript for a specific document.

**Endpoint:** `/v1/get-document-transcript`  
**Method:** `POST`  
**Request Body:**

```json
{
  "document_id": "string"
}
```

**Response:**
An array of transcript segments, each with:

```json
[
  {
    "document_id": "string",
    "start_timestamp": "string (ISO date)",
    "text": "string",
    "source": "string",
    "id": "string",
    "is_final": boolean,
    "end_timestamp": "string (ISO date)"
  }
]
```

### 5. Update Document

Updates a document.

**Endpoint:** `/v1/update-document`  
**Method:** `POST`  
**Request Body:** Document data to update

### 6. Update Document Panel

Updates a document panel.

**Endpoint:** `/v1/update-document-panel`  
**Method:** `POST`  
**Request Body:** Panel data to update

### 7. Get Panel Templates

Retrieves available panel templates.

**Endpoint:** `/v1/get-panel-templates`  
**Method:** `POST`  
**Request Body:** Empty object (`{}`)

**Response:**
An array of template objects:

```json
[
  {
    "id": "string",
    "is_granola": boolean,
    "created_at": "string (ISO date)",
    "owner_id": null,
    "category": "string",
    "title": "string",
    "deleted_at": null,
    "sections": [
      {
        "id": "string",
        "heading": "string",
        "section_description": "string"
      }
    ],
    "color": "string",
    "symbol": "string",
    "description": "string",
    "shared_with": "string",
    "copied_from": "string",
    "updated_at": "string (ISO date)",
    "chat_suggestions": null,
    "user_types": [
      {
        "user_type": "string"
      }
    ]
  }
]
```

### 8. Get People

Retrieves people data.

**Endpoint:** `/v1/get-people`  
**Method:** `POST`

### 9. Get Feature Flags

Retrieves feature flags for the authenticated user.

**Endpoint:** `/v1/get-feature-flags`  
**Method:** `POST`

### 10. Get Notion Integration

Retrieves Notion integration details.

**Endpoint:** `/v1/get-notion-integration`  
**Method:** `POST`

### 11. Get Subscriptions

Retrieves subscription information for the authenticated user.

**Endpoint:** `/v1/get-subscriptions`  
**Method:** `POST`

### 12. Refresh Google Events

Refreshes Google Calendar events.

**Endpoint:** `/v1/refresh-google-events`  
**Method:** `POST`

### 13. Check for Update

Checks for application updates.

**Endpoint:** `/v1/check-for-update/latest-mac.yml`  
**Method:** `GET`