import { ResponseFormat } from "@/models/enums";

interface ResponseFormatText {
    type: ResponseFormat.TEXT;
};

interface ResponseFormatJSONObject {
    type: ResponseFormat.JSON_OBJECT;
};

interface ResponseFormatJSONSchema {
    json_schema: ResponseFormatNamespace.JSONSchema;
    type: ResponseFormat.JSON_SCHEMA;
};

export namespace ResponseFormatNamespace {
    export interface JSONSchema {
        name: string;
        description?: string;
        schema?: Record<string, unknown>;
        strict?: boolean | null;
    };
};

export {
    ResponseFormatText,
    ResponseFormatJSONObject,
    ResponseFormatJSONSchema
};