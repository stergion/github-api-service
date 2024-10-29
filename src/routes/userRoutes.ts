import express from 'express';

import { print } from "graphql";
import { UserInfoDocument, UserInfoQuery } from "../graphql/typed_queries.js";

export { router as userRouter };

const router = express.Router({ mergeParams: true });

router.get("/:login", async (req, res) => {
    const { octokit, params: { login } } = req;

    const userInfo = await octokit.graphql<UserInfoQuery>(print(UserInfoDocument), { login: login });

    console.log(JSON.stringify(userInfo));

    res.json(userInfo).end();
});

