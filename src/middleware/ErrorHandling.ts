import { NextFunction, Request, Response } from "express";
import { JsonResponse, StructuredError } from "../utils/errors/StructuredError.js";
import { SSEStream } from "../utils/SSEStream.js";
import { SSEError } from "../utils/errors/SSEError.js";
import { RouteNotFoundError } from "../utils/errors/NotFound.js";

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
    const err = new RouteNotFoundError("", req.method, req.url);
    next(err);
}

export function errorResponseHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    if (!(err instanceof StructuredError)) {
        return next(err);
    }

    console.error(err);

    res.status(err.statusCode).json(err.toJsonResponse()).end();
}

export function sseErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    if (!(err instanceof SSEError)) {
        return next(err);
    }

    console.error(err);
    
    const stream = new SSEStream(res);
    stream.streamError(err);
    res.end();
}

export function fallbackErrorHandler(
    err: Error,
    req: Request,
    res: Response<JsonResponse>,
    next: NextFunction
) {
    console.error(err);
    const errorResponse = {
        statusCode: 500,
        name: "Internal Server Error",
        message: "An unexpected error occurred",
    };
    res.status(errorResponse.statusCode).json(errorResponse).end();
}
