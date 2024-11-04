import "dotenv/config";

import express from "express";
import swaggerJsdoc, { OAS3Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { injectOctokit } from "./middleware/octokit.js";
import { RepositoryRouter } from "./routes/RepositoryRouter.js";
import { UserContributionsRouter } from "./routes/UserContributionsRouter.js";
import { UserRepositoryRouter } from "./routes/UserRepositoryRouter.js";
import { UserRouter } from "./routes/UserRoutes.js";

const port = process.env["PORT"] ?? 5000;

const options: OAS3Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "GitHub Client Service API",
            version: "1.0.0",
            description: "API documentation for GitHub Client Service",
        },
        servers: [
            {
                url: `http://localhost:${port}`,
            },
        ],
        tags: [
            {
                name: "User",
                description: "User operations",
            },
            {
                name: "User Repositories",
                description: "User Repositories operations",
            },
            {
                name: "User Contributions",
                description: "User Contributions operations",
            },
            {
                name: "Repository",
                description: "Repository operations",
            },
        ],
    },
    apis: ["./dist/routes/*.js", "./swagger/schemas/*.yml", "./swagger/examples/*.yml"],
};

const swaggerSpec = swaggerJsdoc(options);

const app = express();

// Middleware
app.use(injectOctokit());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routers
app.use("/api/user", UserRouter);
app.use("/api/user/:login/repositories", UserRepositoryRouter);
app.use("/api/user/:login/contributions", UserContributionsRouter);
app.use("/api/repository", RepositoryRouter);

// Start
app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`);
});
