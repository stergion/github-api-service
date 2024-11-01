import { print } from "graphql";
import { Octokit } from "octokit";

import { Repository } from "../graphql/dto_types.js";
import {
    RepositoriesCommitedToDocument,
    RepositoriesCommitedToQueryVariables,
    RepositoriesContributedToDocument,
    RepositoriesContributedToQueryVariables,
    RepositoryDocument,
    RepositoryQuery,
    RepositoryQueryVariables,
} from "../graphql/typed_queries.js";
import { sendQueryWindowed } from "../routes/helpers/sendQueries.js";
import { DateWindows } from "../utils/DateWindows.js";

type NameWithOwnerWrappedObject = {
    repository: {
        __typename?: "Repository";
        nameWithOwner: string;
    };
    [key: string]: any;
};

interface ContributionsCollection {
    commitContributionsByRepository?: NameWithOwnerWrappedObject[];
    issueContributionsByRepository?: NameWithOwnerWrappedObject[];
    pullRequestContributionsByRepository?: NameWithOwnerWrappedObject[];
    pullRequestReviewContributionsByRepository?: NameWithOwnerWrappedObject[];
}

interface UserContributions {
    user?: {
        contributionsCollection: ContributionsCollection;
    } | null;
}

const CONTRIBUTION_COLLECTIONS = [
    "commitContributionsByRepository",
    "issueContributionsByRepository",
    "pullRequestContributionsByRepository",
    "pullRequestReviewContributionsByRepository",
] as const;

const extractRepositoriesFromQuery = async (response: UserContributions) => {
    const contributionsCollection = response.user!.contributionsCollection;
    const repositories: NameWithOwnerWrappedObject[] = [];

    for (const cb of CONTRIBUTION_COLLECTIONS) {
        if (contributionsCollection[cb]) {
            repositories.push(...contributionsCollection[cb]);
        }
    }
    return repositories;
};

const extractNameWithOwner = async (array: NameWithOwnerWrappedObject[]) => {
    return array.map((item) => item.repository.nameWithOwner);
};

export async function* fetchRepositoriesCommitedToInfo(
    octokit: Octokit,
    login: string,
    fromDate: Date,
    toDate: Date
) {
    const dateWindows = new DateWindows(new Date(toDate), new Date(fromDate)).monthly();

    const queryVariables: RepositoriesCommitedToQueryVariables = {
        login: login,
    };

    const sendQuerieFn = sendQueryWindowed(octokit, RepositoriesCommitedToDocument, queryVariables);

    const uniequeRepositories = new Set<string>();

    for (const dateWindow of dateWindows) {
        const response = await sendQuerieFn(dateWindow);
        const repositories = await extractRepositoriesFromQuery(response);
        const nameWithOwners = await extractNameWithOwner(repositories);

        for (const nameWithOwner of nameWithOwners) {
            if (uniequeRepositories.has(nameWithOwner)) {
                continue;
            }

            uniequeRepositories.add(nameWithOwner);

            const [owner, name] = nameWithOwner.split("/") as [string, string];
            yield fetchRepositoryInfo(octokit, owner, name);
        }
    }
}

export async function* fetchRepositoriesContributedToInfo(
    octokit: Octokit,
    login: string,
    fromDate: Date,
    toDate: Date
) {
    const dateWindows = new DateWindows(toDate, fromDate).monthly();

    const queryVariables: RepositoriesContributedToQueryVariables = {
        login: login,
    };

    const sendQuerieFn = sendQueryWindowed(
        octokit,
        RepositoriesContributedToDocument,
        queryVariables
    );

    const uniequeRepositories = new Set<string>();

    for (const dateWindow of dateWindows) {
        const response = await sendQuerieFn(dateWindow);
        const repositories = await extractRepositoriesFromQuery(response);
        const nameWithOwners = await extractNameWithOwner(repositories);

        for (const nameWithOwner of nameWithOwners) {
            if (uniequeRepositories.has(nameWithOwner)) {
                continue;
            }

            uniequeRepositories.add(nameWithOwner);

            const [owner, name] = nameWithOwner.split("/") as [string, string];
            yield fetchRepositoryInfo(octokit, owner, name);
        }
    }
}

export async function fetchRepositoryInfo(
    octokit: Octokit,
    owner: string,
    name: string
): Promise<Repository> {
    const queryVariables: RepositoryQueryVariables = {
        owner,
        name,
    };
    const repositoryQueryResponse = await octokit.graphql<RepositoryQuery>(
        print(RepositoryDocument),
        queryVariables
    );
    return repositoryQueryResponse.repository!;
}
