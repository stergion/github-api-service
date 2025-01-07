import { StructuredError } from "./StructuredError.js";

export class InternalServerError extends StructuredError {
    name: string = "InternalServerError";
    statusCode: number = 500;
    message: string;
    cause?: Error;

    constructor(error?: Error | unknown) {
        super();

        if (error instanceof Error) {
            this.cause = error;
        }
        this.message = "An unexpected error occurred";
    }

    toJsonResponse() {
        return {
            statusCode: this.statusCode,
            name: this.name,
            message: this.message,
        };
    }
}
