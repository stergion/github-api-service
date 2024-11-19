import { GraphqlResponseError } from "@octokit/graphql";
import fetchMock from "fetch-mock";
import { print } from "graphql";
import { Octokit } from "octokit";
import { describe, expect, it, vi } from "vitest";

import { Repository } from "../../src/graphql/dto_types";
import {
    RepositoriesCommittedToDocument,
    RepositoriesCommittedToQuery,
    RepositoriesContributedToDocument,
    RepositoriesContributedToQuery,
    RepositoryDocument,
    RepositoryQuery,
} from "../../src/graphql/typed_queries";
import {
    fetchRepositoriesCommittedToInfo,
    fetchRepositoriesContributedToInfo,
    fetchRepositoryInfo,
} from "../../src/service/RepositoryService";
import { InternalServerError } from "../../src/utils/errors/InternalServerError";
import NotGithubUser from "../../src/utils/errors/NotGithubUser";
import RepositoryNotFound from "../../src/utils/errors/RepositoryNotFound";
import { Counter } from "./helpers/Counter";
import { getRepositoryInfoMock } from "./helpers/repositoryMocks";

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

describe("fetchRepositoriesContributedToInfo", () => {
    it("should fetch repositories contributed to successfully", async () => {
        const mockContributedToResponse: RepositoriesContributedToQuery = {
            user: {
                contributionsCollection: {
                    issueContributionsByRepository: [
                        {
                            repository: {
                                nameWithOwner: "owner1/repo1",
                            },
                        },
                        {
                            repository: {
                                nameWithOwner: "owner1/repo2",
                            },
                        },
                    ],
                    pullRequestContributionsByRepository: [
                        {
                            repository: {
                                nameWithOwner: "owner2/repo1",
                            },
                        },
                        {
                            repository: {
                                nameWithOwner: "owner2/repo2",
                            },
                        },
                    ],
                    pullRequestReviewContributionsByRepository: [
                        {
                            repository: {
                                nameWithOwner: "owner3/repo1",
                            },
                        },
                        {
                            repository: {
                                nameWithOwner: "owner3/repo2",
                            },
                        },
                    ],
                    commitContributionsByRepository: [
                        {
                            repository: {
                                nameWithOwner: "owner4/repo1",
                            },
                        },
                        {
                            repository: {
                                nameWithOwner: "owner4/repo2",
                            },
                        },
                    ],
                },
            },
        };

        const counter = new Counter();

        const mockRepoInfo11: RepositoryQuery = getRepositoryInfoMock(1, 1, counter);
        const mockRepoInfo12: RepositoryQuery = getRepositoryInfoMock(1, 2, counter);
        const mockRepoInfo21: RepositoryQuery = getRepositoryInfoMock(2, 1, counter);
        const mockRepoInfo22: RepositoryQuery = getRepositoryInfoMock(2, 2, counter);
        const mockRepoInfo31: RepositoryQuery = getRepositoryInfoMock(3, 1, counter);
        const mockRepoInfo32: RepositoryQuery = getRepositoryInfoMock(3, 2, counter);
        const mockRepoInfo41: RepositoryQuery = getRepositoryInfoMock(4, 1, counter);
        const mockRepoInfo42: RepositoryQuery = getRepositoryInfoMock(4, 2, counter);

        const octokit = new Octokit({
            auth: `secret123`,
        });

        const graphqlMock = vi.spyOn(octokit, "graphql");

        graphqlMock
            .mockResolvedValueOnce(mockContributedToResponse) // First call for contributions
            .mockResolvedValueOnce(mockRepoInfo11)
            .mockResolvedValueOnce(mockRepoInfo12)
            .mockResolvedValueOnce(mockRepoInfo21)
            .mockResolvedValueOnce(mockRepoInfo22)
            .mockResolvedValueOnce(mockRepoInfo31)
            .mockResolvedValueOnce(mockRepoInfo32)
            .mockResolvedValueOnce(mockRepoInfo41)
            .mockResolvedValueOnce(mockRepoInfo42);

        const fromDate = new Date("2023-01-01");
        const toDate = new Date("2023-01-31");
        const repositories: Repository[] = await Array.fromAsync(
            fetchRepositoriesContributedToInfo(octokit, "testuser", fromDate, toDate)
        );

        expect(repositories).toHaveLength(8);
        expect(repositories[0]).toEqual(mockRepoInfo11.repository);
        expect(repositories[1]).toEqual(mockRepoInfo12.repository);
        expect(repositories[2]).toEqual(mockRepoInfo21.repository);
        expect(repositories[3]).toEqual(mockRepoInfo22.repository);
        expect(repositories[4]).toEqual(mockRepoInfo31.repository);
        expect(repositories[5]).toEqual(mockRepoInfo32.repository);
        expect(repositories[6]).toEqual(mockRepoInfo41.repository);
        expect(repositories[7]).toEqual(mockRepoInfo42.repository);

        // Verify GraphQL queries
        expect(graphqlMock).toHaveBeenCalledTimes(9);
        expect(graphqlMock).toHaveBeenNthCalledWith(
            1,
            print(RepositoriesContributedToDocument),
            expect.objectContaining({ login: "testuser" })
        );
        expect(graphqlMock).toHaveBeenCalledWith(
            print(RepositoryDocument),
            expect.objectContaining({ owner: "owner1", name: "repo1" })
        );
        expect(graphqlMock).toHaveBeenCalledWith(
            print(RepositoryDocument),
            expect.objectContaining({ owner: "owner1", name: "repo2" })
        );
        expect(graphqlMock).toHaveBeenCalledWith(
            print(RepositoryDocument),
            expect.objectContaining({ owner: "owner2", name: "repo1" })
        );
        expect(graphqlMock).toHaveBeenCalledWith(
            print(RepositoryDocument),
            expect.objectContaining({ owner: "owner2", name: "repo2" })
        );
        expect(graphqlMock).toHaveBeenCalledWith(
            print(RepositoryDocument),
            expect.objectContaining({ owner: "owner3", name: "repo1" })
        );
        expect(graphqlMock).toHaveBeenCalledWith(
            print(RepositoryDocument),
            expect.objectContaining({ owner: "owner3", name: "repo2" })
        );
        expect(graphqlMock).toHaveBeenCalledWith(
            print(RepositoryDocument),
            expect.objectContaining({ owner: "owner4", name: "repo1" })
        );
        expect(graphqlMock).toHaveBeenCalledWith(
            print(RepositoryDocument),
            expect.objectContaining({ owner: "owner4", name: "repo2" })
        );
    });

    it("should handle empty contributions", async () => {
        const mockEmptyResponse: RepositoriesContributedToQuery = {
            user: {
                contributionsCollection: {
                    issueContributionsByRepository: [],
                    pullRequestContributionsByRepository: [],
                    pullRequestReviewContributionsByRepository: [],
                    commitContributionsByRepository: [],
                },
            },
        };

        const mockRepoInfo1: RepositoryQuery = getRepositoryInfoMock(1, 1);

        const octokit = new Octokit({ auth: "secret123" });
        const graphqlMock = vi.spyOn(octokit, "graphql");

        graphqlMock.mockResolvedValueOnce(mockEmptyResponse).mockResolvedValueOnce(mockRepoInfo1);

        const fromDate = new Date("2023-01-01");
        const toDate = new Date("2023-01-31");
        const repositories: Repository[] = await Array.fromAsync(
            fetchRepositoriesContributedToInfo(octokit, "testuser", fromDate, toDate)
        );

        expect(repositories).toHaveLength(0);

        // Verify GraphQL queries
        expect(graphqlMock).toHaveBeenCalledTimes(1);
        expect(graphqlMock).toHaveBeenNthCalledWith(
            1,
            print(RepositoriesContributedToDocument),
            expect.objectContaining({ login: "testuser" })
        );
    });

    describe("on duplicate repositories", () => {
        it("should deduplicate repositories across time windows", async () => {
            const mockResponse1: RepositoriesContributedToQuery = {
                user: {
                    contributionsCollection: {
                        issueContributionsByRepository: [],
                        pullRequestContributionsByRepository: [],
                        pullRequestReviewContributionsByRepository: [],
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
            const mockResponse2: RepositoriesContributedToQuery = {
                user: {
                    contributionsCollection: {
                        issueContributionsByRepository: [
                            {
                                repository: {
                                    nameWithOwner: "owner1/repo1",
                                },
                            },
                        ],
                        pullRequestContributionsByRepository: [],
                        pullRequestReviewContributionsByRepository: [],
                        commitContributionsByRepository: [],
                    },
                },
            };

            const mockRepoInfo: RepositoryQuery = getRepositoryInfoMock(1, 1);

            const octokit = new Octokit({ auth: "secret123" });
            const graphqlMock = vi.spyOn(octokit, "graphql");

            // Same repo appears in multiple months
            graphqlMock
                .mockResolvedValueOnce(mockResponse1)
                .mockResolvedValueOnce(mockRepoInfo)
                .mockResolvedValueOnce(mockResponse2)
                .mockResolvedValueOnce(mockRepoInfo);

            const fromDate = new Date("2023-01-01");
            const toDate = new Date("2023-02-28");
            const repositories: Repository[] = await Array.fromAsync(
                fetchRepositoriesContributedToInfo(octokit, "testuser", fromDate, toDate)
            );

            // Should only appear once despite being returned twice
            expect(repositories).toHaveLength(1);
            expect(repositories[0]).toEqual(mockRepoInfo.repository);

            // Verify GraphQL queries
            expect(graphqlMock).toHaveBeenCalledTimes(3);
            expect(graphqlMock).toHaveBeenNthCalledWith(
                1,
                print(RepositoriesContributedToDocument),
                expect.objectContaining({ login: "testuser" })
            );
            expect(graphqlMock).toHaveBeenNthCalledWith(
                2,
                print(RepositoryDocument),
                expect.objectContaining({ owner: "owner1", name: "repo1" })
            );
            expect(graphqlMock).toHaveBeenNthCalledWith(
                3,
                print(RepositoriesContributedToDocument),
                expect.objectContaining({ login: "testuser" })
            );
            expect(graphqlMock).not.toHaveBeenNthCalledWith(
                4,
                print(RepositoryDocument),
                expect.objectContaining({ owner: "owner1", name: "repo1" })
            );
        });

        it("should deduplicate repositories in the same window", async () => {
            const mockResponse: RepositoriesContributedToQuery = {
                user: {
                    contributionsCollection: {
                        issueContributionsByRepository: [],
                        pullRequestContributionsByRepository: [],
                        pullRequestReviewContributionsByRepository: [
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

            const mockRepoInfo: RepositoryQuery = getRepositoryInfoMock(1, 1);

            const octokit = new Octokit({ auth: "secret123" });
            const graphqlMock = vi.spyOn(octokit, "graphql");

            // Same repo appears in multiple months
            graphqlMock
                .mockResolvedValueOnce(mockResponse)
                .mockResolvedValueOnce(mockRepoInfo)
                .mockResolvedValueOnce(mockRepoInfo)
                .mockResolvedValueOnce(mockRepoInfo)
                .mockResolvedValueOnce(mockRepoInfo);

            const fromDate = new Date("2023-01-01");
            const toDate = new Date("2023-01-31");
            const repositories: Repository[] = await Array.fromAsync(
                fetchRepositoriesContributedToInfo(octokit, "testuser", fromDate, toDate)
            );

            // Should only appear once despite being returned twice
            expect(repositories).toHaveLength(1);
            expect(repositories[0]).toEqual(mockRepoInfo.repository);

            // Verify GraphQL queries
            expect(graphqlMock).toHaveBeenCalledTimes(2);
            expect(graphqlMock).toHaveBeenNthCalledWith(
                1,
                print(RepositoriesContributedToDocument),
                expect.objectContaining({ login: "testuser" })
            );
            expect(graphqlMock).toHaveBeenNthCalledWith(
                2,
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
                expect(body.query).toEqual(print(RepositoriesContributedToDocument));

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
            fetchRepositoriesContributedToInfo(octokit, "notuser", fromDate, toDate)
        );

        await expect(repositories).rejects.toThrow(NotGithubUser);

        // Verify GraphQL queries
        expect(graphqlSpy).toHaveBeenCalledTimes(1);
        expect(graphqlSpy).toHaveBeenCalledWith(
            print(RepositoriesContributedToDocument),
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
                expect(body.query).toEqual(print(RepositoriesContributedToDocument));

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
            fetchRepositoriesContributedToInfo(octokit, "testuser", fromDate, toDate)
        );

        await expect(repositories).rejects.toThrow(GraphqlResponseError);

        // Verify GraphQL queries
        expect(graphqlSpy).toHaveBeenCalledTimes(1);
        expect(graphqlSpy).toHaveBeenCalledWith(
            print(RepositoriesContributedToDocument),
            expect.objectContaining({ login: "testuser" })
        );
    });
});
