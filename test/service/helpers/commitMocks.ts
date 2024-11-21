import { Commit, CommitFile, CommitWithFiles } from "../../../src/graphql/dto_types";
import { Counter } from "./Counter";
import { IdIssuer } from "./types";

export function getCommitMock(id?: IdIssuer): Commit {
    const idValue = id?.get() ?? "123";

    const commit: Commit = {
        id: `C_${idValue}`,
        oid: `abc${idValue}`,
        committedDate: new Date(),
        commitUrl: `https://github.com/owner/repo/commit/abc${idValue}`,
        changedFiles: 2,
        additions: 10,
        deletions: 5,
        message: "test commit",
        comments: { nodes: [] },
        associatedPullRequests: { nodes: [] },
    };

    return commit;
}

export function getCommitWithFilesMock(files: number = 1, id?: IdIssuer): CommitWithFiles {
    const commit: CommitWithFiles = {
        ...getCommitMock(id),
        files: getCommitFilesMock(files, new Counter()),
    };
    return commit;
}

export function getCommitFilesMock(size: number = 1, id?: IdIssuer): CommitFile[] {
    const files = Array.from({ length: size }, () => getCommitFile(id));

    return files;
}

function getCommitFile(id?: IdIssuer): CommitFile {
    const idValue = id?.get() ?? "123";
    const file: CommitFile = {
        sha: `abc${idValue}`,
        filename: `test${idValue}.ts`,
        additions: 10,
        deletions: 5,
        changes: 15,
        status: "modified",
        blob_url: "",
        contents_url: "",
        raw_url: "",
    };
    return file;
}
