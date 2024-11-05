import { StructuredError } from "./StructuredError.js";

export default class NotGithubUser extends StructuredError implements StructuredError {
    name = "NotGithubUser";
    statusCode = 404;
    message: string;
    login: string;

    constructor(login: string) {
        super();
        this.message = `Could not find user with the login of '${login}'`;
        this.login = login;
    }

    toJsonResponse() {
        return {
            statusCode: this.statusCode,
            name: this.name,
            message: this.message,
        };
    }
}
