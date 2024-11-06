import { InternalServerError } from "./InternalServerError.js";
import { StructuredError } from "./StructuredError.js";

/**
 * Represents an error that occurs during Server-Sent Events (SSE) operations.
 * This class wraps a StructuredError to provide SSE specific error handling.
 *
 * @class
 * @extends {Error}
 */
export class SSEError extends Error {
    name = "SSEError";
    message = "An error occurred during Server-Sent Events (SSE) operations.";
    casue: StructuredError;

    constructor(err: StructuredError | Error) {
        super();
        if (err instanceof StructuredError) {
            this.casue = err;
        } else {
            this.casue = new InternalServerError(err.message);
        }
    }

    toData() {
        return this.casue.toJsonResponse();
    }
}
