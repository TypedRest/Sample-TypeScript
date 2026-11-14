import { describe, expect } from "vitest";
import { BadRequestError as HttpBadRequestError, ConcurrencyError, NotFoundError as HttpNotFoundError } from "typedrest/errors";
import type { Contact, Note } from "@address-book/dto";
import { NotFoundError } from "../src/errors.ts";
import { apiTest as test } from "./apiTest.ts";

/**
 * Ensures {@link AddressBookClient.contacts} and {@link contactsRouter} work together.
 */
describe("contacts API", () => {
    test("reads all from service", async ({ service, client }) => {
        const contacts: Contact[] = [
            { id: "1", firstName: "John", lastName: "Smith" },
            { id: "2", firstName: "Jane", lastName: "Doe" }
        ];
        service.readAll.mockReturnValue(contacts);

        const result = await client.contacts.readAll();

        expect(result).toEqual(contacts);
    });

    test("reads from service", async ({ service, client }) => {
        const contact: Contact = { id: "1", firstName: "John", lastName: "Smith" };
        service.read.mockReturnValue(contact);

        const result = await client.contacts.get("1").read();

        expect(result).toEqual(contact);
        expect(service.read).toHaveBeenCalledWith("1");
    });

    test("reports missing contact as error", async ({ service, client }) => {
        service.read.mockImplementation(id => { throw new NotFoundError(`Contact '${id}' not found.`); });

        await expect(client.contacts.get("1").read()).rejects.toBeInstanceOf(HttpNotFoundError);
    });

    test("creates in service", async ({ service, client, baseUri }) => {
        const contactWithoutId: Contact = { firstName: "John", lastName: "Smith" };
        const contactWithId: Contact = { id: "1", firstName: "John", lastName: "Smith" };
        service.create.mockReturnValue(contactWithId);

        const result = await client.contacts.create(contactWithoutId);

        expect(service.create).toHaveBeenCalledWith(contactWithoutId);
        expect(result?.uri).toEqual(new URL("contacts/1", baseUri));
    });

    test("rejects create with incomplete contact", async ({ service, client }) => {
        await expect(client.contacts.create({ firstName: "John" } as Contact)).rejects.toBeInstanceOf(HttpBadRequestError);

        expect(service.create).not.toHaveBeenCalled();
    });

    test("updates in service", async ({ service, client }) => {
        const contact: Contact = { id: "1", firstName: "John", lastName: "Smith" };

        await client.contacts.get("1").set(contact);

        expect(service.update).toHaveBeenCalledWith(contact);
    });

    test("rejects update with mismatched ID", async ({ service, client }) => {
        const contact: Contact = { id: "1", firstName: "John", lastName: "Smith" };

        await expect(client.contacts.get("2").set(contact)).rejects.toBeInstanceOf(HttpBadRequestError);

        expect(service.update).not.toHaveBeenCalled();
    });

    test("deletes from service", async ({ service, client }) => {
        await client.contacts.get("1").delete();

        expect(service.delete).toHaveBeenCalledWith("1");
    });

    test("reads note from service", async ({ service, client }) => {
        const note: Note = { content: "my note" };
        service.readNote.mockReturnValue(note);

        const result = await client.contacts.get("1").note.read();

        expect(result).toEqual(note);
        expect(service.readNote).toHaveBeenCalledWith("1");
    });

    test("sets note in service", async ({ service, client }) => {
        const note: Note = { content: "my note" };

        await client.contacts.get("1").note.set(note);

        expect(service.setNote).toHaveBeenCalledWith("1", note);
    });

    test("pokes via service", async ({ service, client }) => {
        await client.contacts.get("1").poke.invoke();

        expect(service.poke).toHaveBeenCalledWith("1");
    });

    describe("optimistic concurrency", () => {
        const contact: Contact = { id: "1", firstName: "John", lastName: "Smith" };

        /** Reads a resource with a plain GET request and returns the ETag Express sent. */
        async function getETag(uri: URL): Promise<string> {
            const response = await fetch(uri);
            const eTag = response.headers.get("ETag");
            expect(eTag).toBeTruthy();
            return eTag!;
        }

        test("updates contact with matching If-Match", async ({ service, baseUri }) => {
            service.read.mockReturnValue(contact);
            const uri = new URL("contacts/1", baseUri);
            const eTag = await getETag(uri);

            const response = await fetch(uri, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "If-Match": eTag },
                body: JSON.stringify({ ...contact, lastName: "Doe" })
            });

            expect(response.status).toBe(204);
            expect(service.update).toHaveBeenCalledWith({ ...contact, lastName: "Doe" });
        });

        test("rejects contact update with stale If-Match", async ({ service, baseUri }) => {
            service.read.mockReturnValue(contact);
            const uri = new URL("contacts/1", baseUri);
            const eTag = await getETag(uri);
            service.read.mockReturnValue({ ...contact, firstName: "Johnny" });

            const response = await fetch(uri, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "If-Match": eTag },
                body: JSON.stringify({ ...contact, lastName: "Doe" })
            });

            expect(response.status).toBe(412);
            expect(response.headers.get("Content-Type")).toMatch(/^application\/problem\+json/);
            expect(await response.json()).toMatchObject({ status: 412, title: "PreconditionFailedError" });
            expect(service.update).not.toHaveBeenCalled();
        });

        test("deletes contact with matching If-Match", async ({ service, baseUri }) => {
            service.read.mockReturnValue(contact);
            const uri = new URL("contacts/1", baseUri);
            const eTag = await getETag(uri);

            const response = await fetch(uri, { method: "DELETE", headers: { "If-Match": eTag } });

            expect(response.status).toBe(204);
            expect(service.delete).toHaveBeenCalledWith("1");
        });

        test("rejects contact delete with stale If-Match", async ({ service, baseUri }) => {
            service.read.mockReturnValue(contact);
            const uri = new URL("contacts/1", baseUri);
            const eTag = await getETag(uri);
            service.read.mockReturnValue({ ...contact, firstName: "Johnny" });

            const response = await fetch(uri, { method: "DELETE", headers: { "If-Match": eTag } });

            expect(response.status).toBe(412);
            expect(service.delete).not.toHaveBeenCalled();
        });

        test("accepts If-Match: * for existing contact", async ({ service, baseUri }) => {
            service.read.mockReturnValue(contact);

            const response = await fetch(new URL("contacts/1", baseUri), { method: "DELETE", headers: { "If-Match": "*" } });

            expect(response.status).toBe(204);
        });

        test("reports missing contact on conditional delete", async ({ service, baseUri }) => {
            service.read.mockImplementation(id => { throw new NotFoundError(`Contact '${id}' not found.`); });

            const response = await fetch(new URL("contacts/1", baseUri), { method: "DELETE", headers: { "If-Match": "\"abc\"" } });

            expect(response.status).toBe(404);
            expect(service.delete).not.toHaveBeenCalled();
        });

        test("sets note with matching If-Match", async ({ service, baseUri }) => {
            service.readNote.mockReturnValue({ content: "old" });
            const uri = new URL("contacts/1/note", baseUri);
            const eTag = await getETag(uri);

            const response = await fetch(uri, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "If-Match": eTag },
                body: JSON.stringify({ content: "new" })
            });

            expect(response.status).toBe(204);
            expect(service.setNote).toHaveBeenCalledWith("1", { content: "new" });
        });

        test("rejects note with stale If-Match", async ({ service, baseUri }) => {
            service.readNote.mockReturnValue({ content: "old" });
            const uri = new URL("contacts/1/note", baseUri);
            const eTag = await getETag(uri);
            service.readNote.mockReturnValue({ content: "changed by someone else" });

            const response = await fetch(uri, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "If-Match": eTag },
                body: JSON.stringify({ content: "new" })
            });

            expect(response.status).toBe(412);
            expect(service.setNote).not.toHaveBeenCalled();
        });

        test("client saves note read through same endpoint", async ({ service, client }) => {
            service.readNote.mockReturnValue({ content: "old" });
            const endpoint = client.contacts.get("1").note;

            await endpoint.read();
            await endpoint.set({ content: "new" });

            expect(service.setNote).toHaveBeenCalledWith("1", { content: "new" });
        });

        test("client reports lost update of note as ConcurrencyError", async ({ service, client }) => {
            service.readNote.mockReturnValue({ content: "old" });
            const endpoint = client.contacts.get("1").note;

            await endpoint.read();
            service.readNote.mockReturnValue({ content: "changed by someone else" });

            await expect(endpoint.set({ content: "new" })).rejects.toBeInstanceOf(ConcurrencyError);
            expect(service.setNote).not.toHaveBeenCalled();
        });
    });
});
