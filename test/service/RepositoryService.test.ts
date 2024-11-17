import fetchMock from "fetch-mock";
import { print } from "graphql";
import { Octokit } from "octokit";
import { GraphqlResponseError } from "@octokit/graphql";
import { describe, it, expect, vi } from "vitest";

import { RepositoryDocument, RepositoryQuery } from "../../src/graphql/typed_queries";
import { fetchRepositoryInfo } from "../../src/service/RepositoryService";
import { InternalServerError } from "../../src/utils/errors/InternalServerError";
import RepositoryNotFound from "../../src/utils/errors/RepositoryNotFound";

describe("fetchRepositoryInfo", () => {
    it("should fetch user info successfully", async () => {
        const mockRepositoryInfo: RepositoryQuery = {
            repository: {
                id: "123",
                owner: {
                    login: "stergion",
                },
                name: "github-api-service",
                url: "",
                repositoryTopics: {
                    totalCount: 0,
                    nodes: [],
                },

                stargazerCount: 0,
                forkCount: 0,
                primaryLanguage: null,
                watchers: {
                    totalCount: 0,
                },
            },
        };

        const mock = fetchMock
            .createInstance()
            .postOnce("https://api.github.com/graphql", (_url, request) => {
                const body = JSON.parse(mock.callHistory.calls()[0].options.body!.toString());
                expect(body.query).toEqual(print(RepositoryDocument));

                return {
                    data: mockRepositoryInfo,
                };
            });

        const octokit = new Octokit({
            auth: `secret123`,
            request: {
                fetch: mock.fetchHandler,
            },
        });

        await expect(
            fetchRepositoryInfo(octokit, "stergion", "github-api-service")
        ).resolves.toEqual(mockRepositoryInfo.repository);
    });

    it("should throw RepositoryNotFound error when repository is not found", async () => {
        const mockResponse = {
            data: null,
            errors: [
                {
                    type: "NOT_FOUND",
                    path: ["repository"],
                    locations: [
                        {
                            line: 2,
                            column: 9,
                        },
                    ],
                    message:
                        "Could not resolve to a Repository with the name 'notGHOwner/orNotGitHubRepoName'.",
                },
            ],
        };

        const mock = fetchMock
            .createInstance()
            .postOnce("https://api.github.com/graphql", (_url, request) => {
                const body = JSON.parse(mock.callHistory.calls()[0].options.body!.toString());
                expect(body.query).toEqual(print(RepositoryDocument));

                return mockResponse;
            });

        const octokit = new Octokit({
            auth: `secret123`,
            request: {
                fetch: mock.fetchHandler,
            },
        });

        await expect(
            fetchRepositoryInfo(octokit, "notGHOwner", "orNotGitHubRepoName")
        ).rejects.toThrow(RepositoryNotFound);
    });

    it("should throw original error for non-NOT_FOUND GraphQL errors", async () => {
        const mockResponse = {
            data: null,
            errors: [
                {
                    type: "ERROR_TYPE",
                    locations: [
                        {
                            line: 2,
                            column: 3,
                        },
                    ],
                    message: "Some error message",
                },
            ],
        };

        const mock = fetchMock
            .createInstance()
            .postOnce("https://api.github.com/graphql", (_url, request) => {
                const body = JSON.parse(mock.callHistory.calls()[0].options.body!.toString());
                expect(body.query).toEqual(print(RepositoryDocument));

                return mockResponse;
            });

        const octokit = new Octokit({
            auth: `secret123`,
            request: {
                fetch: mock.fetchHandler,
            },
        });

        await expect(fetchRepositoryInfo(octokit, "testowner", "testname")).rejects.toThrow(
            GraphqlResponseError
        );
    });

    it("should throw InternalServerError when response is missing repository data", async () => {
        const mockResponse = {
            data: null,
        };

        const mock = fetchMock
            .createInstance()
            .postOnce("https://api.github.com/graphql", (_url, request) => {
                const body = JSON.parse(mock.callHistory.calls()[0].options.body!.toString());
                expect(body.query).toEqual(print(RepositoryDocument));

                return mockResponse;
            });

        const octokit = new Octokit({
            auth: `secret123`,
            request: {
                fetch: mock.fetchHandler,
            },
        });

        await expect(fetchRepositoryInfo(octokit, "testowner", "testname")).rejects.toThrow(
            InternalServerError
        );
    });

    it("should rethrow unhandled errors", async () => {
        const mockError = new Error("Some error");
        const octokit = new Octokit({
            auth: `secret123`,
        });
        vi.spyOn(octokit, "graphql").mockRejectedValue(mockError);

        await expect(fetchRepositoryInfo(octokit, "testowner", "testname")).rejects.toThrow(
            mockError
        );
    });
});
