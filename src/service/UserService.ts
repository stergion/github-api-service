import { print } from "graphql";
import { Octokit } from "octokit";

import {
    UserInfoDocument,
    UserInfoQuery,
    UserInfoQueryVariables,
} from "../graphql/typed_queries.js";
import NotGithubUser from "../utils/errors/NotGithubUser.js";

type NonNullableUserInfoQuery = Omit<UserInfoQuery, "user"> & {
    user: NonNullable<UserInfoQuery["user"]>;
};

export async function fetchUserInfo(octokit: Octokit, login: string) {
    const userInfoVariables: UserInfoQueryVariables = {
        login,
    };

    const userInfo = await octokit.graphql<UserInfoQuery>(
        print(UserInfoDocument),
        userInfoVariables
    );

    if (!userInfo.user) {
        throw new NotGithubUser(login);
    }

    return userInfo as NonNullableUserInfoQuery;
}