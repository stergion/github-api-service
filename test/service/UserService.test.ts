import { GraphqlResponseError } from "@octokit/graphql";
import fetchMock from "fetch-mock";
import { print } from "graphql";
import { Octokit } from "octokit";
import { describe, expect, it, vi } from "vitest";

import { UserInfoDocument, UserInfoQuery } from "../../src/graphql/typed_queries.js";
import { fetchUserInfo } from "../../src/service/UserService.js";
import { InternalServerError } from "../../src/utils/errors/InternalServerError.js";
import NotGithubUser from "../../src/utils/errors/NotGithubUser.js";

describe("fetchUserInfo", () => {
    it("should fetch user info successfully", async () => {
        const mockUserInfo: UserInfoQuery = {
            user: {
                id: "123",
                login: "testuser",
                name: "Test User",
                url: "https://github.com/testuser",
                avatarUrl: "",
                email: "",
            },
        };

        const mock = fetchMock
            .createInstance()
            .postOnce("https://api.github.com/graphql", (_url, request) => {
                const body = JSON.parse(mock.callHistory.calls()[0].options.body!.toString());
                expect(body.query).toEqual(print(UserInfoDocument));

                return {
                    data: mockUserInfo,
                };
            });

        const octokit = new Octokit({
            auth: `secret123`,
            request: {
                fetch: mock.fetchHandler,
            },
        });

        await expect(fetchUserInfo(octokit, "testuser")).resolves.toEqual(mockUserInfo.user);
    });

    it("should throw NotGithubUser error when user is not found", async () => {
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
                    message: "Could not resolve to a User with the login of 'notghuser'.",
                },
            ],
        };

        const mock = fetchMock
            .createInstance()
            .postOnce("https://api.github.com/graphql", (_url, request) => {
                const body = JSON.parse(mock.callHistory.calls()[0].options.body!.toString());
                expect(body.query).toEqual(print(UserInfoDocument));

                return mockResponse;
            });

        const octokit = new Octokit({
            auth: `secret123`,
            request: {
                fetch: mock.fetchHandler,
            },
        });

        await expect(fetchUserInfo(octokit, "notghuser")).rejects.toThrow(NotGithubUser);
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
                expect(body.query).toEqual(print(UserInfoDocument));

                return mockResponse;
            });

        const octokit = new Octokit({
            auth: `secret123`,
            request: {
                fetch: mock.fetchHandler,
            },
        });

        await expect(fetchUserInfo(octokit, "testuser")).rejects.toThrow(GraphqlResponseError);
    });

    it("should throw InternalServerError when response is missing user data", async () => {
        const mockResponse = {
            data: null,
        };

        const mock = fetchMock
            .createInstance()
            .postOnce("https://api.github.com/graphql", (_url, request) => {
                const body = JSON.parse(mock.callHistory.calls()[0].options.body!.toString());
                expect(body.query).toEqual(print(UserInfoDocument));

                return mockResponse;
            });

        const octokit = new Octokit({
            auth: `secret123`,
            request: {
                fetch: mock.fetchHandler,
            },
        });

        await expect(fetchUserInfo(octokit, "testuser")).rejects.toThrow(InternalServerError);
    });

    it("should rethrow unhandled errors", async () => {
        const mockError = new Error("Some error");
        const octokit = new Octokit({
            auth: `secret123`,
        });
        vi.spyOn(octokit, "graphql").mockRejectedValue(mockError);

        await expect(fetchUserInfo(octokit, "testuser")).rejects.toThrow(mockError);
    });
});
