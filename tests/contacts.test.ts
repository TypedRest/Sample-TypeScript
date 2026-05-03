import type { AddressInfo } from "node:net";
import type { FastifyInstance } from "fastify";
import { AddressBookClient } from "@addressbook/client";
import { buildApp, NotFoundError, type ContactsService } from "@addressbook/server";
import type { Contact, Note } from "@addressbook/dto";

describe("Contacts API", () => {
    let app: FastifyInstance;
    let client: AddressBookClient;
    let service: jest.Mocked<ContactsService>;

    beforeEach(async () => {
        service = {
            readAll: jest.fn(),
            read: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            readNote: jest.fn(),
            setNote: jest.fn(),
            poke: jest.fn()
        };

        app = buildApp({ service });
        await app.listen({ port: 0, host: "127.0.0.1" });

        const { port } = app.server.address() as AddressInfo;
        client = new AddressBookClient(`http://127.0.0.1:${port}`);
    });

    afterEach(async () => {
        await app.close();
    });

    it("reads all from service", async () => {
        const contacts: Contact[] = [
            { id: "1", firstName: "John", lastName: "Smith" },
            { id: "2", firstName: "Jane", lastName: "Doe" }
        ];
        service.readAll.mockResolvedValue(contacts);

        const result = await client.contacts.readAll();

        expect(result).toEqual(contacts);
    });

    it("reads from service", async () => {
        const contact: Contact = { id: "1", firstName: "John", lastName: "Smith" };
        service.read.mockResolvedValue(contact);

        const result = await client.contacts.get("1").read();

        expect(result).toEqual(contact);
        expect(service.read).toHaveBeenCalledWith("1");
    });

    it("creates in service", async () => {
        const contactWithoutId: Contact = { firstName: "John", lastName: "Smith" };
        const contactWithId: Contact = { id: "1", firstName: "John", lastName: "Smith" };
        service.create.mockResolvedValue(contactWithId);

        const result = await client.contacts.create(contactWithoutId);

        expect(result).toBeDefined();
        expect(result!.uri.toString()).toMatch(/\/contacts\/1$/);
        expect(service.create).toHaveBeenCalledWith(contactWithoutId);
    });

    it("rejects create on incomplete body", async () => {
        await expect(
            client.contacts.create({ firstName: "John" } as Contact)
        ).rejects.toThrow();
        expect(service.create).not.toHaveBeenCalled();
    });

    it("updates in service", async () => {
        const contact: Contact = { id: "1", firstName: "John", lastName: "Smith" };

        await client.contacts.set(contact);

        expect(service.update).toHaveBeenCalledWith(contact);
    });

    it("rejects update on id mismatch", async () => {
        const contact: Contact = { id: "1", firstName: "John", lastName: "Smith" };

        await expect(client.contacts.get("2").set(contact)).rejects.toThrow();
        expect(service.update).not.toHaveBeenCalled();
    });

    it("deletes from service", async () => {
        await client.contacts.get("1").delete();

        expect(service.delete).toHaveBeenCalledWith("1");
    });

    it("returns 404 when service reports not found", async () => {
        service.read.mockRejectedValue(new NotFoundError("not here"));

        await expect(client.contacts.get("missing").read()).rejects.toThrow();
    });

    it("reads note from service", async () => {
        const note: Note = { content: "my note" };
        service.readNote.mockResolvedValue(note);

        const result = await client.contacts.get("1").note.read();

        expect(result).toEqual(note);
        expect(service.readNote).toHaveBeenCalledWith("1");
    });

    it("sets note in service", async () => {
        const note: Note = { content: "my note" };

        await client.contacts.get("1").note.set(note);

        expect(service.setNote).toHaveBeenCalledWith("1", note);
    });

    it("pokes via service", async () => {
        await client.contacts.get("1").poke.invoke();

        expect(service.poke).toHaveBeenCalledWith("1");
    });
});
