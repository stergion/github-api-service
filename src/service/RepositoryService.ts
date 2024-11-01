import { Octokit } from "octokit";
import {
    RepositoriesContributedToQueryVariables,
    RepositoriesContributedToDocument,
    RepositoriesContributedToQuery,
    RepositoryQueryVariables,
    RepositoryDocument,
    RepositoryQuery,
} from "../graphql/typed_queries.js";
import { sendQueryWindowed } from "../routes/helpers/sendQueries.js";
import { DateWindows } from "../utils/DateWindows.js";
import { print } from "graphql";
import { set } from "../utils/deepFindPathToProperty.js";
import { Repository } from "../graphql/dto_types.js";

type NameWithOwnerWrappedObject = {
    repository: {
        __typename?: "Repository";
        nameWithOwner: string;
    };
    [key: string]: any;
};

const extractRepositoriesFromQuery = async (response: RepositoriesContributedToQuery) => {
    const { user } = response;
    const {
        contributionsCollection: {
            commitContributionsByRepository,
            issueContributionsByRepository,
            pullRequestContributionsByRepository,
            pullRequestReviewContributionsByRepository,
        },
    } = user!;

    return [
        ...commitContributionsByRepository,
        ...issueContributionsByRepository,
        ...pullRequestContributionsByRepository,
        ...pullRequestReviewContributionsByRepository,
    ];
};

const extractNameWithOwner = async (array: NameWithOwnerWrappedObject[]) => {
    return array.map((item) => item.repository.nameWithOwner);
};

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
