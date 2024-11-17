import { StructuredError } from "./StructuredError.js";

type Repository = { owner: string; name: string };

export default class RepositoryNotFound extends StructuredError implements StructuredError {
    name = "RepositoryNotFound";
    statusCode = 404;
    message: string;
    repository: Repository | undefined;

    constructor(owner: string, name: string) {
        super();
        this.message = `Could not find repository with the name '${owner}/${name}'`;
        this.repository = { owner, name };
    }

    toJsonResponse() {
        return {
            statusCode: this.statusCode,
            name: this.name,
            message: this.message,
        };
    }
}
