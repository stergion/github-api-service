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
