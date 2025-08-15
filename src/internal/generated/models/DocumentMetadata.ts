/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DocumentMetadata = {
    creator?: {
        name?: string;
        email?: string;
        details?: {
            person?: {
                name?: {
                    fullName?: string;
                };
                avatar?: string;
                employment?: {
                    title?: string;
                    name?: string;
                };
            };
            company?: {
                name?: string;
            };
        };
    };
    attendees?: Array<Record<string, any>>;
};

