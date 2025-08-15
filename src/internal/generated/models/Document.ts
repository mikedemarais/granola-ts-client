/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Document = {
    id?: string;
    created_at?: string;
    notes?: {
        type?: string;
        content?: Array<Record<string, any>>;
    };
    title?: string;
    user_id?: string;
    cloned_from?: string | null;
    notes_plain?: string;
    transcribe?: boolean;
    google_calendar_event?: Record<string, any> | null;
    updated_at?: string;
    deleted_at?: string | null;
    type?: string | null;
    overview?: string | null;
    public?: boolean;
    people?: {
        creator?: {
            name?: string;
            email?: string;
            details?: Record<string, any>;
        };
        attendees?: Array<Record<string, any>>;
    };
    chapters?: any[] | null;
    meeting_end_count?: number;
    notes_markdown?: string;
    selected_template?: string | null;
    valid_meeting?: boolean;
    summary?: string | null;
    has_shareable_link?: boolean;
    show_private_notes?: boolean;
    attachments?: Array<Record<string, any>>;
    privacy_mode_enabled?: boolean;
    sharing_link_visibility?: string;
};

