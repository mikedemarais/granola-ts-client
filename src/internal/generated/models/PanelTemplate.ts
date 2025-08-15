/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PanelTemplate = {
    id?: string;
    is_granola?: boolean;
    created_at?: string;
    owner_id?: string | null;
    category?: string;
    title?: string;
    deleted_at?: string | null;
    sections?: Array<{
        id?: string;
        heading?: string;
        section_description?: string;
    }>;
    color?: string;
    symbol?: string;
    description?: string;
    shared_with?: string;
    copied_from?: string;
    updated_at?: string;
    user_types?: Array<{
        user_type?: string;
    }>;
};

