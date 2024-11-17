import { GraphqlResponseError } from "@octokit/graphql";
import { print } from "graphql";
import { Octokit } from "octokit";

import { UserInfo } from "../graphql/dto_types.js";
import {
    UserInfoDocument,
    UserInfoQuery,
    UserInfoQueryVariables,
} from "../graphql/typed_queries.js";
import { InternalServerError } from "../utils/errors/InternalServerError.js";
import NotGithubUser from "../utils/errors/NotGithubUser.js";

export async function fetchUserInfo(octokit: Octokit, login: string): Promise<UserInfo> {
    const userInfoVariables: UserInfoQueryVariables = {
        login,
    };

    let userInfo: UserInfoQuery | undefined;

    try {
        userInfo = await octokit.graphql<UserInfoQuery>(print(UserInfoDocument), userInfoVariables);
    } catch (error) {
        if (error instanceof GraphqlResponseError && error.errors) {
            for (const e of error.errors) {
                if (e.type === "NOT_FOUND") {
                    throw new NotGithubUser(login);
                }
            }
        }
        throw error;
    }

    if (!userInfo || !userInfo.user) {
        throw new InternalServerError(new Error("User info not found"));
    }

    return userInfo.user;
}
