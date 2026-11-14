import { Router, type Request } from "express";
import type { Contact, Note } from "@address-book/dto";
import type { ContactsService } from "./ContactsService.ts";
import { BadRequestError, PreconditionFailedError } from "./errors.ts";

/**
 * Provides access to contacts in an address book.
 */
export function contactsRouter(service: ContactsService): Router {
    return Router()
        .get("/", (_req, res) => {
            res.json(service.readAll());
        })
        .post("/", (req, res) => {
            const result = service.create(parseContact(req.body));
            res.status(201).location(`${req.baseUrl}/${encodeURIComponent(result.id!)}`).json(result);
        })
        .get("/:id", (req, res) => {
            res.json(service.read(req.params.id));
        })
        .put("/:id", (req, res) => {
            const contact = parseContact(req.body);
            if (contact.id !== req.params.id) throw new BadRequestError(`ID in URI (${req.params.id}) must match the ID in the body (${contact.id}).`);
            checkIfMatch(req, () => service.read(req.params.id));
            service.update(contact);
            res.sendStatus(204);
        })
        .delete("/:id", (req, res) => {
            checkIfMatch(req, () => service.read(req.params.id));
            service.delete(req.params.id);
            res.sendStatus(204);
        })
        .get("/:id/note", (req, res) => {
            res.json(service.readNote(req.params.id));
        })
        .put("/:id/note", (req, res) => {
            const note = parseNote(req.body);
            checkIfMatch(req, () => service.readNote(req.params.id));
            service.setNote(req.params.id, note);
            res.sendStatus(204);
        })
        .post("/:id/poke", (req, res) => {
            service.poke(req.params.id);
            res.sendStatus(204);
        });
}

/**
 * Implements optimistic concurrency: if the request has an `If-Match` header,
 * compares it with the ETag Express would send for the current state of the resource in a GET response.
 * @param req The incoming request.
 * @param readCurrent Returns the current state of the resource. Only called if the request has an `If-Match` header.
 * @throws {PreconditionFailedError} The resource was changed since the client last read it.
 */
function checkIfMatch(req: Request, readCurrent: () => unknown): void {
    const ifMatch = req.get("If-Match");
    if (!ifMatch) return;

    const current = readCurrent(); // Throws NotFoundError if the resource does not exist
    if (ifMatch.trim() === "*") return;

    // Serialize and hash the same way as res.json() does for GET responses
    const { app } = req;
    const etagFn = app.get("etag fn") as ((body: string, encoding: BufferEncoding) => string) | undefined;
    const currentETag = etagFn?.(JSON.stringify(current, app.get("json replacer"), app.get("json spaces")), "utf8");

    // Weak comparison, since Express generates weak ETags by default
    const opaque = (tag: string) => tag.replace(/^W\//, "");
    const requested = ifMatch.match(/(?:W\/)?"[^"]*"/g) ?? [];
    if (!currentETag || !requested.some(tag => opaque(tag) === opaque(currentETag))) {
        throw new PreconditionFailedError("The resource was modified since it was last read. Reload it and try again.");
    }
}

function parseContact(body: unknown): Contact {
    if (!isObject(body)) throw new BadRequestError("Request body must be a JSON object.");
    const { id, firstName, lastName } = body;
    if (id !== undefined && id !== null && typeof id !== "string") throw new BadRequestError("id must be a string.");
    if (typeof firstName !== "string" || !firstName) throw new BadRequestError("firstName is required.");
    if (typeof lastName !== "string" || !lastName) throw new BadRequestError("lastName is required.");
    return id ? { id, firstName, lastName } : { firstName, lastName };
}

function parseNote(body: unknown): Note {
    if (!isObject(body)) throw new BadRequestError("Request body must be a JSON object.");
    const { content } = body;
    if (typeof content !== "string") throw new BadRequestError("content is required.");
    return { content };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
