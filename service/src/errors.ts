import type { ErrorRequestHandler } from "express";

/**
 * Thrown when a requested resource does not exist. Reported as HTTP 404.
 */
export class NotFoundError extends Error {
    override name = "NotFoundError";
}

/**
 * Thrown when the request is missing data or contains invalid data. Reported as HTTP 400.
 */
export class BadRequestError extends Error {
    override name = "BadRequestError";
}

/**
 * Thrown when a precondition such as `If-Match` does not hold, e.g. because the resource was changed by someone else in the meantime. Reported as HTTP 412.
 */
export class PreconditionFailedError extends Error {
    override name = "PreconditionFailedError";
}

/**
 * Reports errors with appropriate HTTP status codes as RFC 9457 problem details.
 */
export const problemDetails: ErrorRequestHandler = (err, req, res, _next) => {
    const status = statusCodeFor(err);
    if (status >= 500) {
        console.error(`Responded to HTTP ${req.method} ${req.originalUrl} with ${status} due to error`, err);
    }

    res.status(status).type("application/problem+json").json({
        title: err instanceof Error ? err.name : "Error",
        status,
        detail: err instanceof Error ? err.message : String(err)
    });
};

function statusCodeFor(err: unknown): number {
    if (err instanceof NotFoundError) return 404;
    if (err instanceof BadRequestError) return 400;
    if (err instanceof PreconditionFailedError) return 412;

    // Errors raised by Express itself (e.g. malformed JSON) carry their own status code
    const status = (err as { status?: unknown })?.status;
    if (typeof status === "number" && status >= 400 && status < 600) return status;

    return 500;
}
