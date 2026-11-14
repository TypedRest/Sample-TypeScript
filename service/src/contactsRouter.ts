import { Router } from "express";
import type { Contact, Note } from "@address-book/dto";
import type { ContactsService } from "./ContactsService.ts";
import { BadRequestError } from "./errors.ts";

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
            service.update(contact);
            res.sendStatus(204);
        })
        .delete("/:id", (req, res) => {
            service.delete(req.params.id);
            res.sendStatus(204);
        })
        .get("/:id/note", (req, res) => {
            res.json(service.readNote(req.params.id));
        })
        .put("/:id/note", (req, res) => {
            service.setNote(req.params.id, parseNote(req.body));
            res.sendStatus(204);
        })
        .post("/:id/poke", (req, res) => {
            service.poke(req.params.id);
            res.sendStatus(204);
        });
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
