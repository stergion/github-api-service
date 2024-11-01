import "dotenv/config";

import express from 'express';

import { injectOctokit } from "./middleware/octokit.js";
import { UserContributionsRouter } from "./routes/UserContributionsRouter.js";
import { UserRepositoryRouter } from "./routes/UserRepositoryRouter.js";
import { UserRouter } from "./routes/UserRoutes.js";

const port = process.env["PORT"] ?? 5000;

const app = express();

// Middleware
app.use(injectOctokit());


// Routers
app.use("/api/user", UserRouter);
app.use("/api/user/:login/repositories", UserRepositoryRouter);
app.use("/api/user/:login/contributions", UserContributionsRouter);

// Start
app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`);
});

