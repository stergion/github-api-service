import { StructuredError } from "./StructuredError.js";

export class RouteNotFoundError extends StructuredError {
    name = "RouteNotFoundError";
    statusCode = 404;
    message: string;
    resource: string;

    constructor(msg: string, method: string, url: string) {
        super();
        if (!msg || msg.trim() === "") {
            msg = "The requested resource was not found";
        }
        this.message = msg!.trim();
        this.resource = `${method} ${url}`;
    }

    toJsonResponse() {
        return {
            statusCode: this.statusCode,
            name: this.name,
            message: this.message,
            resource: this.resource,
        };
    }
}
