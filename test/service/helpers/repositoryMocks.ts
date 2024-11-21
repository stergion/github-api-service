import { IdIssuer } from "./types";

export function getRepositoryInfoMock(ownerNum: number, repoNum: number, id?: IdIssuer) {
    const repo = `repo${repoNum}`;
    const owner = `owner${ownerNum}`;
    const info = {
        repository: {
            id: id?.get() ?? "123",
            name: repo,
            owner: { login: owner },
            url: `https://github.com/${owner}/${repo}`,
            repositoryTopics: { totalCount: 0, nodes: [] },
            stargazerCount: 0,
            forkCount: 0,
            primaryLanguage: null,
            watchers: { totalCount: 0 },
        },
    };

    return info;
}
