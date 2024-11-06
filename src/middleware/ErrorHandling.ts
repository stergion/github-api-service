import { NextFunction, Request, Response } from "express";
import { JsonResponse, StructuredError } from "../utils/errors/StructuredError.js";
import { RouteNotFoundError } from "../utils/errors/NotFound.js";

export function errorResponseHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    if (!(err instanceof StructuredError)) {
        return next(err);
    }

    res.status(err.statusCode).json(err.toJsonResponse()).end();
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
    const err = new RouteNotFoundError("", req.method, req.url);
    next(err);
}

export function fallbackErrorHandler(
    err: Error,
    req: Request,
    res: Response<JsonResponse>,
    next: NextFunction
) {
    const errorResponse = {
        statusCode: 500,
        name: "Internal Server Error",
        message: "An unexpected error occurred",
    };
    res.status(errorResponse.statusCode).json(errorResponse).end();
}
