import { FieldValidationError } from "express-validator";
import { ErrorDetails, StructuredError } from "./StructuredError.js";

type ValidationError = Omit<FieldValidationError, "type"> | Record<string, any>;

export class RequestParamsValidationError extends StructuredError {
    name = "RequestParamsValidationError";
    message = "One or more request parameters failed validation";
    statusCode = 400;
    details: ErrorDetails[];

    constructor(errors: Array<ValidationError>) {
        super();
        this.details = errors.map((error) => {
            const { location, path, value, msg } = error;
            return { value, message: msg, location, path };
        });
    }

    toJsonResponse() {
        return {
            statusCode: this.statusCode,
            name: this.name,
            message: this.message,
            deatils: this.details,
        };
    }
}
