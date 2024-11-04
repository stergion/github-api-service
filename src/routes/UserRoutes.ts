import express from 'express';

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
router.get("/:login", async (req, res) => {
    const { octokit, params: { login } } = req;

    const userInfo = await fetchUserInfo(octokit, login);

    res.json(userInfo).end();
});

