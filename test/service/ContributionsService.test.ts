import { describe, expect, it, vi } from "vitest";
import { Commit, CommitFile } from "../../src/graphql/dto_types.js";
import {
    getCommitFilesMock,
    getCommitMock,
    getCommitWithFilesMock,
} from "./helpers/commitMocks.js";
import { Counter } from "./helpers/Counter.js";
import { Octokit } from "octokit";
import {
    fetchCommitFiles,
    fetchRepositoryCommits,
} from "../../src/service/ContributionsService.js";
import { CommitsDocument, CommitsQuery } from "../../src/graphql/typed_queries.js";
import { print } from "graphql";
import fetchMock from "fetch-mock";
import RepositoryNotFound from "../../src/utils/errors/RepositoryNotFound.js";

describe("fetchCommitFiles", () => {
    it("should fetch commit files successfully", async () => {
        const commitMock = getCommitMock();
        const filesMock: CommitFile[] = getCommitFilesMock();

        const octokit = new Octokit({
            auth: `secret123`,
        });

        const getCommitSpy = vi.spyOn(octokit.rest.repos, "getCommit");

        getCommitSpy.mockResolvedValueOnce({
            url: "",
            headers: {} as any,
            status: 200,
            data: {
                author: {} as any,
                committer: {} as any,
                comments_url: "",
                commit: {} as any,
                html_url: "",
                node_id: "",
                parents: [],
                sha: "",
                url: "",
                files: filesMock,
            },
        });

        const files = await fetchCommitFiles(octokit, "owner", "repo", commitMock);

        expect(files).toEqual(filesMock);
        expect(getCommitSpy).toHaveBeenCalledWith({
            owner: "owner",
            repo: "repo",
            ref: commitMock.oid,
        });
    });
});

describe("fetchRepositoryCommits", () => {
    it("should fetch commits with files", async () => {
        const idCounter = new Counter();
        const commitMock1 = getCommitMock(idCounter);
        const commitMock2 = getCommitMock(idCounter);
        const filesMock1: CommitFile[] = getCommitFilesMock();
        const filesMock2: CommitFile[] = getCommitFilesMock();

        const commitsResponse: CommitsQuery = {
            repository: {
                defaultBranchRef: {
                    target: {
                        history: {
                            nodes: [commitMock1, commitMock2],
                            totalCount: 1,
                            pageInfo: {
                                hasNextPage: false,
                                endCursor: null,
                            },
                        },
                    },
                },
            },
        };
        const octokit = new Octokit({
            auth: `secret123`,
        });
        const gqlPaginateSpy = vi.spyOn(octokit.graphql, "paginate");
        const restSpy = vi.spyOn(octokit.rest.repos, "getCommit");

        gqlPaginateSpy.mockResolvedValueOnce(commitsResponse);

        restSpy
            .mockResolvedValueOnce({
                url: "",
                headers: {} as any,
                status: 200,
                data: {
                    author: {} as any,
                    committer: {} as any,
                    comments_url: "",
                    commit: {} as any,
                    html_url: "",
                    node_id: "",
                    parents: [],
                    sha: "",
                    url: "",
                    files: filesMock1,
                },
            })
            .mockResolvedValueOnce({
                url: "",
                headers: {} as any,
                status: 200,
                data: {
                    author: {} as any,
                    committer: {} as any,
                    comments_url: "",
                    commit: {} as any,
                    html_url: "",
                    node_id: "",
                    parents: [],
                    sha: "",
                    url: "",
                    files: filesMock2,
                },
            });

        const commits = await fetchRepositoryCommits(
            octokit,
            "user123",
            "owner",
            "repo",
            new Date("2023-01-01"),
            new Date("2023-12-31")
        );

        expect(commits).toHaveLength(2);
        expect(commits[0]).toEqual({ ...commitMock1, files: filesMock1 });
        expect(commits[1]).toEqual({ ...commitMock2, files: filesMock2 });

        // Verify GraphQL queries
        expect(gqlPaginateSpy).toHaveBeenCalledTimes(1);
        expect(gqlPaginateSpy).toHaveBeenLastCalledWith(
            print(CommitsDocument),
            expect.objectContaining({
                owner: "owner",
                name: "repo",
                authorId: "user123",
            })
        );
        expect(restSpy).toHaveBeenCalledTimes(2);
        expect(restSpy).toHaveBeenNthCalledWith(1, {
            owner: "owner",
            repo: "repo",
            ref: commitMock1.oid,
        });
        expect(restSpy).toHaveBeenNthCalledWith(2, {
            owner: "owner",
            repo: "repo",
            ref: commitMock2.oid,
        });
    });

    it("should fetch commits without files when noFiles option is true", async () => {
        const idCounter = new Counter();
        const commitMock1 = getCommitMock(idCounter);
        const commitMock2 = getCommitMock(idCounter);
        const filesMock1: CommitFile[] = getCommitFilesMock();
        const filesMock2: CommitFile[] = getCommitFilesMock();

        const commitsResponse: CommitsQuery = {
            repository: {
                defaultBranchRef: {
                    target: {
                        history: {
                            nodes: [commitMock1, commitMock2],
                            totalCount: 1,
                            pageInfo: {
                                hasNextPage: false,
                                endCursor: null,
                            },
                        },
                    },
                },
            },
        };
        const octokit = new Octokit({
            auth: `secret123`,
        });
        const gqlPaginateSpy = vi.spyOn(octokit.graphql, "paginate");
        const restSpy = vi.spyOn(octokit.rest.repos, "getCommit");

        gqlPaginateSpy.mockResolvedValueOnce(commitsResponse);

        const commits = await fetchRepositoryCommits(
            octokit,
            "user123",
            "owner",
            "repo",
            new Date("2023-01-01"),
            new Date("2023-12-31"),
            { noFiles: true }
        );

        expect(commits).toHaveLength(2);
        expect(commits[0]).toEqual(commitMock1);
        expect(commits[1]).toEqual(commitMock2);

        // Verify GraphQL queries
        expect(gqlPaginateSpy).toHaveBeenCalledTimes(1);
        expect(gqlPaginateSpy).toHaveBeenLastCalledWith(
            print(CommitsDocument),
            expect.objectContaining({
                owner: "owner",
                name: "repo",
                authorId: "user123",
            })
        );
        expect(restSpy).not.toHaveBeenCalled();
    });

    it("should handle empty commit history", async () => {
        const commitsResponse: CommitsQuery = {
            repository: {
                defaultBranchRef: {
                    target: {
                        history: {
                            nodes: [],
                            totalCount: 1,
                            pageInfo: {
                                hasNextPage: false,
                                endCursor: null,
                            },
                        },
                    },
                },
            },
        };

        const octokit = new Octokit();
        const gqlPaginateSpy = vi.spyOn(octokit.graphql, "paginate");
        const restSpy = vi.spyOn(octokit.rest.repos, "getCommit");

        gqlPaginateSpy.mockResolvedValueOnce(commitsResponse);

        const commits = await fetchRepositoryCommits(
            octokit,
            "user123",
            "owner",
            "repo",
            new Date("2023-01-01"),
            new Date("2023-12-31")
        );

        expect(commits).toHaveLength(0);

        // Verify GraphQL queries
        expect(gqlPaginateSpy).toHaveBeenCalledTimes(1);
        expect(gqlPaginateSpy).toHaveBeenLastCalledWith(
            print(CommitsDocument),
            expect.objectContaining({
                owner: "owner",
                name: "repo",
                authorId: "user123",
            })
        );
        expect(restSpy).not.toHaveBeenCalled();
    });

    it("should throw RepositoryNotFound error on invalid owner or name", async () => {
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
                expect(body.query).toEqual(print(CommitsDocument));

                return mockResponse;
            });

        const octokit = new Octokit({
            auth: `secret123`,
            request: {
                fetch: mock.fetchHandler,
            },
        });

        await expect(
            fetchRepositoryCommits(
                octokit,
                "user123",
                "notGHOwner",
                "orNotGitHubRepoName",
                new Date(),
                new Date()
            )
        ).rejects.toThrow(RepositoryNotFound);
    });
});
