import { describe, expect } from "vitest";
import { BadRequestError as HttpBadRequestError, NotFoundError as HttpNotFoundError } from "typedrest/errors";
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
});
