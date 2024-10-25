import "dotenv/config";

import express from 'express';

import { injectOctokit } from "./middleware/octokit.js";
import { repositoryRouter } from "./routes/repositoryRouter.js";
import { userRouter } from "./routes/userRoutes.js";
import { contributionsRouter } from "./routes/contributionsRouter.js";

const port = process.env["PORT"] ?? 5000;

const app = express();

// Middleware
app.use(injectOctokit());


// Routers
app.use("/api/user", userRouter);
app.use("/api/user/:login/repositories", repositoryRouter);
app.use("/api/user/:login/contributions", contributionsRouter);

// Start
app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`);
});

