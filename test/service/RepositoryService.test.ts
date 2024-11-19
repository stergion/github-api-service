import { GraphqlResponseError } from "@octokit/graphql";
import fetchMock from "fetch-mock";
import { print } from "graphql";
import { Octokit } from "octokit";
import { describe, expect, it, vi } from "vitest";

import { Repository } from "../../src/graphql/dto_types";
import {
    RepositoriesCommittedToDocument,
    RepositoriesCommittedToQuery,
    RepositoryDocument,
    RepositoryQuery,
} from "../../src/graphql/typed_queries";
import {
    fetchRepositoriesCommittedToInfo,
    fetchRepositoryInfo,
} from "../../src/service/RepositoryService";
import { InternalServerError } from "../../src/utils/errors/InternalServerError";
import NotGithubUser from "../../src/utils/errors/NotGithubUser";
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

describe("fetchRepositoriesCommittedToInfo", () => {
    it("should fetch repositories committed to successfully", async () => {
        const mockCommittedToResponse: RepositoriesCommittedToQuery = {
            user: {
                contributionsCollection: {
                    commitContributionsByRepository: [
                        {
                            repository: {
                                nameWithOwner: "owner1/repo1",
                            },
                        },
                        {
                            repository: {
                                nameWithOwner: "owner2/repo2",
                            },
                        },
                    ],
                },
            },
        };

        const mockRepoInfo1: RepositoryQuery = {
            repository: {
                id: "123",
                name: "repo1",
                owner: { login: "owner1" },
                url: "https://github.com/owner1/repo1",
                repositoryTopics: { totalCount: 0, nodes: [] },
                stargazerCount: 0,
                forkCount: 0,
                primaryLanguage: null,
                watchers: { totalCount: 0 },
            },
        };

        const mockRepoInfo2: RepositoryQuery = {
            repository: {
                id: "456",
                name: "repo2",
                owner: { login: "owner2" },
                url: "https://github.com/owner2/repo2",
                repositoryTopics: { totalCount: 0, nodes: [] },
                stargazerCount: 0,
                forkCount: 0,
                primaryLanguage: null,
                watchers: { totalCount: 0 },
            },
        };

        const octokit = new Octokit({
            auth: `secret123`,
        });

        const graphqlMock = vi.spyOn(octokit, "graphql");

        graphqlMock
            .mockResolvedValueOnce(mockCommittedToResponse) // First call for contributions
            .mockResolvedValueOnce(mockRepoInfo1) // Second call for repo1 info
            .mockResolvedValueOnce(mockRepoInfo2); // Third call for repo2 info

        const fromDate = new Date("2023-01-01");
        const toDate = new Date("2023-01-31");
        const repositories: Repository[] = await Array.fromAsync(
            fetchRepositoriesCommittedToInfo(octokit, "testuser", fromDate, toDate)
        );

        expect(repositories).toHaveLength(2);
        expect(repositories[0]).toEqual(mockRepoInfo1.repository);
        expect(repositories[1]).toEqual(mockRepoInfo2.repository);

        // Verify GraphQL queries
        expect(graphqlMock).toHaveBeenNthCalledWith(
            1,
            print(RepositoriesCommittedToDocument),
            expect.objectContaining({ login: "testuser" })
        );
        expect(graphqlMock).toHaveBeenNthCalledWith(
            2,
            print(RepositoryDocument),
            expect.objectContaining({ owner: "owner1", name: "repo1" })
        );
        expect(graphqlMock).toHaveBeenNthCalledWith(
            3,
            print(RepositoryDocument),
            expect.objectContaining({ owner: "owner2", name: "repo2" })
        );
    });

    it("should handle empty contributions", async () => {
        const mockEmptyResponse = {
            user: {
                contributionsCollection: {
                    commitContributionsByRepository: [],
                },
            },
        };

        const mockRepoInfo1: RepositoryQuery = {
            repository: {
                id: "123",
                name: "repo1",
                owner: { login: "owner1" },
                url: "https://github.com/owner1/repo1",
                repositoryTopics: { totalCount: 0, nodes: [] },
                stargazerCount: 0,
                forkCount: 0,
                primaryLanguage: null,
                watchers: { totalCount: 0 },
            },
        };

        const octokit = new Octokit({ auth: "secret123" });
        const graphqlMock = vi.spyOn(octokit, "graphql");

        graphqlMock.mockResolvedValueOnce(mockEmptyResponse).mockResolvedValueOnce(mockRepoInfo1);

        const fromDate = new Date("2023-01-01");
        const toDate = new Date("2023-01-31");
        const repositories: Repository[] = await Array.fromAsync(
            fetchRepositoriesCommittedToInfo(octokit, "testuser", fromDate, toDate)
        );

        expect(repositories).toHaveLength(0);

        // Verify GraphQL queries
        expect(graphqlMock).toHaveBeenCalledTimes(1);
        expect(graphqlMock).toHaveBeenNthCalledWith(
            1,
            print(RepositoriesCommittedToDocument),
            expect.objectContaining({ login: "testuser" })
        );
    });

    describe("on duplicate repositories", () => {
        it("should deduplicate repositories across time windows", async () => {
            const mockResponse: RepositoriesCommittedToQuery = {
                user: {
                    contributionsCollection: {
                        commitContributionsByRepository: [
                            {
                                repository: {
                                    nameWithOwner: "owner1/repo1",
                                },
                            },
                        ],
                    },
                },
            };

            const mockRepoInfo: RepositoryQuery = {
                repository: {
                    id: "123",
                    name: "repo1",
                    owner: { login: "owner1" },
                    url: "https://github.com/owner1/repo1",
                    repositoryTopics: { totalCount: 0, nodes: [] },
                    stargazerCount: 0,
                    forkCount: 0,
                    primaryLanguage: null,
                    watchers: { totalCount: 0 },
                },
            };

            const octokit = new Octokit({ auth: "secret123" });
            const graphqlMock = vi.spyOn(octokit, "graphql");

            // Same repo appears in multiple months
            graphqlMock
                .mockResolvedValueOnce(mockResponse)
                .mockResolvedValueOnce(mockRepoInfo)
                .mockResolvedValueOnce(mockResponse)
                .mockResolvedValueOnce(mockRepoInfo);

            const fromDate = new Date("2023-01-01");
            const toDate = new Date("2023-02-28");
            const repositories: Repository[] = await Array.fromAsync(
                fetchRepositoriesCommittedToInfo(octokit, "testuser", fromDate, toDate)
            );

            // Should only appear once despite being returned twice
            expect(repositories).toHaveLength(1);
            expect(repositories[0]).toEqual(mockRepoInfo.repository);

            // Verify GraphQL queries
            expect(graphqlMock).toHaveBeenCalledTimes(3);
            expect(graphqlMock).toHaveBeenNthCalledWith(
                1,
                print(RepositoriesCommittedToDocument),
                expect.objectContaining({ login: "testuser" })
            );
            expect(graphqlMock).toHaveBeenNthCalledWith(
                2,
                print(RepositoryDocument),
                expect.objectContaining({ owner: "owner1", name: "repo1" })
            );
            expect(graphqlMock).toHaveBeenNthCalledWith(
                3,
                print(RepositoriesCommittedToDocument),
                expect.objectContaining({ login: "testuser" })
            );
            expect(graphqlMock).not.toHaveBeenNthCalledWith(
                4,
                print(RepositoryDocument),
                expect.objectContaining({ owner: "owner1", name: "repo1" })
            );
        });

        it("should deduplicate repositories in the same window", async () => {
            const mockResponse: RepositoriesCommittedToQuery = {
                user: {
                    contributionsCollection: {
                        commitContributionsByRepository: [
                            {
                                repository: {
                                    nameWithOwner: "owner1/repo1",
                                },
                            },
                            {
                                repository: {
                                    nameWithOwner: "owner1/repo1",
                                },
                            },
                        ],
                    },
                },
            };

            const mockRepoInfo: RepositoryQuery = {
                repository: {
                    id: "123",
                    name: "repo1",
                    owner: { login: "owner1" },
                    url: "https://github.com/owner1/repo1",
                    repositoryTopics: { totalCount: 0, nodes: [] },
                    stargazerCount: 0,
                    forkCount: 0,
                    primaryLanguage: null,
                    watchers: { totalCount: 0 },
                },
            };

            const octokit = new Octokit({ auth: "secret123" });
            const graphqlMock = vi.spyOn(octokit, "graphql");

            // Same repo appears in multiple months
            graphqlMock
                .mockResolvedValueOnce(mockResponse)
                .mockResolvedValueOnce(mockRepoInfo)
                .mockResolvedValueOnce(mockRepoInfo);

            const fromDate = new Date("2023-01-01");
            const toDate = new Date("2023-01-31");
            const repositories: Repository[] = await Array.fromAsync(
                fetchRepositoriesCommittedToInfo(octokit, "testuser", fromDate, toDate)
            );

            // Should only appear once despite being returned twice
            expect(repositories).toHaveLength(1);
            expect(repositories[0]).toEqual(mockRepoInfo.repository);

            // Verify GraphQL queries
            expect(graphqlMock).toHaveBeenCalledTimes(2);
            expect(graphqlMock).toHaveBeenNthCalledWith(
                1,
                print(RepositoriesCommittedToDocument),
                expect.objectContaining({ login: "testuser" })
            );
            expect(graphqlMock).toHaveBeenNthCalledWith(
                2,
                print(RepositoryDocument),
                expect.objectContaining({ owner: "owner1", name: "repo1" })
            );
            expect(graphqlMock).not.toHaveBeenNthCalledWith(
                3,
                print(RepositoryDocument),
                expect.objectContaining({ owner: "owner1", name: "repo1" })
            );
        });
    });

    it("should throw on invalid user login", async () => {
        const mockResponse = {
            data: null,
            errors: [
                {
                    type: "NOT_FOUND",
                    path: ["user"],
                    locations: [
                        {
                            line: 2,
                            column: 3,
                        },
                    ],
                    message: "Could not resolve to a User with the login of 'notuser'.",
                },
            ],
        };
        const mock = fetchMock
            .createInstance()
            .postOnce("https://api.github.com/graphql", (_url, request) => {
                const body = JSON.parse(mock.callHistory.calls()[0].options.body!.toString());
                expect(body.query).toEqual(print(RepositoriesCommittedToDocument));

                return mockResponse;
            });

        const octokit = new Octokit({
            auth: `secret123`,
            request: {
                fetch: mock.fetchHandler,
            },
        });
        const graphqlSpy = vi.spyOn(octokit, "graphql");
        const fromDate = new Date("2023-01-01");
        const toDate = new Date("2023-01-31");
        const repositories = Array.fromAsync(
            fetchRepositoriesCommittedToInfo(octokit, "notuser", fromDate, toDate)
        );

        await expect(repositories).rejects.toThrow(NotGithubUser);

        // Verify GraphQL queries
        expect(graphqlSpy).toHaveBeenCalledTimes(1);
        expect(graphqlSpy).toHaveBeenCalledWith(
            print(RepositoriesCommittedToDocument),
            expect.objectContaining({ login: "notuser" })
        );
    });

    it("should rethrow non-invalid user GraphQL errors", async () => {
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
                expect(body.query).toEqual(print(RepositoriesCommittedToDocument));

                return mockResponse;
            });

        const octokit = new Octokit({
            auth: `secret123`,
            request: {
                fetch: mock.fetchHandler,
            },
        });

        const graphqlSpy = vi.spyOn(octokit, "graphql");

        const fromDate = new Date("2023-01-01");
        const toDate = new Date("2023-01-31");
        const repositories = Array.fromAsync(
            fetchRepositoriesCommittedToInfo(octokit, "testuser", fromDate, toDate)
        );

        await expect(repositories).rejects.toThrow(GraphqlResponseError);

        // Verify GraphQL queries
        expect(graphqlSpy).toHaveBeenCalledTimes(1);
        expect(graphqlSpy).toHaveBeenCalledWith(
            print(RepositoriesCommittedToDocument),
            expect.objectContaining({ login: "testuser" })
        );
    });
});
