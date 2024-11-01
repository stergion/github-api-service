import express from 'express';

import { fetchUserInfo } from "../service/UserService.js";

export { router as UserRouter };

const router = express.Router({ mergeParams: true });

router.get("/:login", async (req, res) => {
    const { octokit, params: { login } } = req;

    const userInfo = await fetchUserInfo(octokit, login);

    res.json(userInfo).end();
});

