import { ValidationError } from "express-validator";
import { ErrorDetails, StructuredError } from "./StructuredError.js";

export class RequestParamsValidationError extends StructuredError {
    name = "RequestParamsValidationError";
    message = "One or more request parameters failed validation";
    statusCode = 400;
    details: ErrorDetails[];

    constructor(errors: Array<ValidationError>) {
        super();
        this.details = errors.map((error) => {
            const { type, msg, ...rest } = error;
            return { message: msg, ...rest };
        });
    }

    toJsonResponse() {
        return {
            statusCode: this.statusCode,
            name: this.name,
            message: this.message,
            details: this.details,
        };
    }
}
