import express, { Request, Response } from "express";

import { UserInfo } from "../graphql/dto_types.js";
import * as validator from "../middleware/express-validator.js";
import { fetchUserInfo } from "../service/UserService.js";

export { router as UserRouter };

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /api/user/{login}:
 *   get:
 *     summary: Get user information
 *     tags:
 *       - User
 *     parameters:
 *       - name: login
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserInfo'
 */
router.get(
    "/:login",
    validator.loginParamValidtor(),
    validator.run(),
    async (req: Request<{ login: string }>, res: Response<UserInfo>) => {
        const {
            octokit,
            params: { login },
        } = req;

        const userInfo = await fetchUserInfo(octokit, login!);

        res.json(userInfo).end();
    }
);
