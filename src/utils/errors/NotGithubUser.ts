export default class NotGithubUser extends Error {
    [key: string]: any;
    constructor(login: string) {
        super(`Could not find user with the login of '${login}'`);
        this["login"] = login;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    name = "NotGithubUser";
}
