import { CommitComment } from "../../../src/graphql/dto_types";
import { Counter } from "./Counter";

export function getCommitCommentMock(id?: Counter): CommitComment {
    const idValue = id?.get() ?? "123";
    return {
        id: `CC_${idValue}`,
        url: `https://github.com/owner/repo/commit/abc${idValue}#commitcomment-${idValue}`,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
        publishedAt: new Date("2023-01-01"),
        lastEditedAt: new Date("2023-01-01"),
        position: 42,
        body: "Test comment",
        commit: {
            id: `C_${idValue}`,
            url: `https://github.com/owner/repo/commit/abc${idValue}`,
        },
        repository: {
            name: "repo",
            owner: {
                login: "owner",
            },
        },
        reactions: {
            totalCount: 0,
        },
    };
}
