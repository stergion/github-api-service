import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { print } from "graphql";
import { Octokit } from "octokit";

export function sendQueryWindowedPaginated<
    TData extends {},
    TVariables extends { fromDate?: Date; toDate?: Date }
>(
    octokit: Octokit,
    queryDocument: TypedDocumentNode<TData, TVariables>,
    queryVariables: TVariables
) {
    return ([fromDate, toDate]: [Date, Date]) => {
        if (fromDate > toDate) throw new Error("FromDate greater than toDate")

        queryVariables.toDate = toDate;
        queryVariables.fromDate = fromDate;

        return octokit.graphql.paginate<TData>(print(queryDocument), queryVariables);
    };
}

export function sendQueryWindowed<
    TData extends {},
    TVariables extends { fromDate?: Date; toDate?: Date }
>(
    octokit: Octokit,
    queryDocument: TypedDocumentNode<TData, TVariables>,
    queryVariables: TVariables
) {
    return ([fromDate, toDate]: [Date, Date]) => {
        if (fromDate > toDate) throw new Error("FromDate greater than toDate")

        queryVariables.toDate = toDate;
        queryVariables.fromDate = fromDate;

        return octokit.graphql<TData>(print(queryDocument), queryVariables);
    };
}
