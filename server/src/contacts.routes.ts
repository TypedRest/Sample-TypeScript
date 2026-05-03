import type { FastifyInstance } from "fastify";
import type { Contact, Note } from "@addressbook/dto";
import type { ContactsService } from "./contacts.service";

const contactSchema = {
    type: "object",
    required: ["firstName", "lastName"],
    properties: {
        id: { type: "string" },
        firstName: { type: "string", minLength: 1 },
        lastName: { type: "string", minLength: 1 }
    }
} as const;

const noteSchema = {
    type: "object",
    required: ["content"],
    properties: {
        content: { type: "string" }
    }
} as const;

/**
 * Registers `/contacts/*` routes on the given Fastify instance.
 */
export function registerContactsRoutes(app: FastifyInstance, service: ContactsService) {
    app.get("/contacts", async () => service.readAll());

    app.post<{ Body: Contact }>(
        "/contacts",
        { schema: { body: contactSchema } },
        async (req, reply) => {
            const created = await service.create(req.body);
            reply.code(201).header("Location", `/contacts/${created.id}`);
            return created;
        });

    app.get<{ Params: { id: string } }>(
        "/contacts/:id",
        async (req) => service.read(req.params.id));

    app.put<{ Params: { id: string }; Body: Contact }>(
        "/contacts/:id",
        { schema: { body: contactSchema } },
        async (req, reply) => {
            if (req.body.id !== req.params.id) {
                return reply.code(400).send({
                    message: `ID in URI (${req.params.id}) must match the ID in the body (${req.body.id}).`
                });
            }
            await service.update(req.body);
            reply.code(204).send();
        });

    app.delete<{ Params: { id: string } }>(
        "/contacts/:id",
        async (req, reply) => {
            await service.delete(req.params.id);
            reply.code(204).send();
        });

    app.get<{ Params: { id: string } }>(
        "/contacts/:id/note",
        async (req) => service.readNote(req.params.id));

    app.put<{ Params: { id: string }; Body: Note }>(
        "/contacts/:id/note",
        { schema: { body: noteSchema } },
        async (req, reply) => {
            await service.setNote(req.params.id, req.body);
            reply.code(204).send();
        });

    app.post<{ Params: { id: string } }>(
        "/contacts/:id/poke",
        async (req, reply) => {
            await service.poke(req.params.id);
            reply.code(204).send();
        });
}
