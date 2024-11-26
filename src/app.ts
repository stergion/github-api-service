import "dotenv/config";

import express from "express";
import swaggerJsdoc, { OAS3Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { injectOctokit } from "./middleware/octokit.js";
import { RepositoryRouter } from "./routes/RepositoryRouter.js";
import { UserContributionsRouter } from "./routes/UserContributionsRouter.js";
import { UserRepositoryRouter } from "./routes/UserRepositoryRouter.js";
import { UserRouter } from "./routes/UserRoutes.js";
import {
    errorResponseHandler,
    fallbackErrorHandler,
    notFoundHandler,
    sseErrorHandler,
} from "./middleware/ErrorHandling.js";

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
        externalDocs: {
            description: "api-docs.json",
            url: "/api-docs.json",
        },
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
app.get("/api-docs.json", (req, res) => {
    res.json(swaggerSpec).end();
});

// Routers
app.use("/api/user", UserRouter);
app.use("/api/user/:login/repositories", UserRepositoryRouter);
app.use("/api/user/:login/contributions", UserContributionsRouter);
app.use("/api/repository", RepositoryRouter);

// Error handling
app.use(notFoundHandler);
app.use(sseErrorHandler);
app.use(errorResponseHandler);
app.use(fallbackErrorHandler);

// Start
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
    console.log();
    console.log(`API docs on http://localhost:${port}/api-docs`);
});
