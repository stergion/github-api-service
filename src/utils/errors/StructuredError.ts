export interface ErrorDetails {
    message: string;
    [key: string]: any;
}

export interface JsonResponse {
    statusCode: number;
    name: string;
    message: string;
}

export abstract class StructuredError extends Error {
    abstract name: string;
    abstract statusCode: number;
    abstract message: string;

    constructor() {
        super();
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    abstract toJsonResponse(): JsonResponse;
}
