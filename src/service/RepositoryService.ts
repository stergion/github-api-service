import { print } from "graphql";
import { Octokit } from "octokit";

import { Repository } from "../graphql/dto_types.js";
import {
    RepositoriesCommittedToDocument,
    RepositoriesCommittedToQueryVariables,
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

export async function* fetchRepositoriesCommittedToInfo(
    octokit: Octokit,
    login: string,
    fromDate: Date,
    toDate: Date
) {
    const dateWindows = new DateWindows(new Date(toDate), new Date(fromDate)).monthly();

    const queryVariables: RepositoriesCommittedToQueryVariables = {
        login: login,
    };

    const sendQueryFn = sendQueryWindowed(octokit, RepositoriesCommittedToDocument, queryVariables);

    const uniqueRepositories = new Set<string>();

    for (const dateWindow of dateWindows) {
        const response = await sendQueryFn(dateWindow);
        const repositories = await extractRepositoriesFromQuery(response);
        const nameWithOwners = await extractNameWithOwner(repositories);

        for (const nameWithOwner of nameWithOwners) {
            if (uniqueRepositories.has(nameWithOwner)) {
                continue;
            }

            uniqueRepositories.add(nameWithOwner);

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

    const sendQueryFn = sendQueryWindowed(
        octokit,
        RepositoriesContributedToDocument,
        queryVariables
    );

    const uniqueRepositories = new Set<string>();

    for (const dateWindow of dateWindows) {
        const response = await sendQueryFn(dateWindow);
        const repositories = await extractRepositoriesFromQuery(response);
        const nameWithOwners = await extractNameWithOwner(repositories);

        for (const nameWithOwner of nameWithOwners) {
            if (uniqueRepositories.has(nameWithOwner)) {
                continue;
            }

            uniqueRepositories.add(nameWithOwner);

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
