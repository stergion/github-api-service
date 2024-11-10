import { Request, Response } from "express";

import { UserInfo } from "../graphql/dto_types.js";
import { fetchUserInfo } from "../service/UserService.js";

export async function getUserInfo(req: Request<{ login: string }>, res: Response<UserInfo>) {
    const {
        octokit,
        params: { login },
    } = req;

    const userInfo = await fetchUserInfo(octokit, login!);

    res.json(userInfo).end();
}
