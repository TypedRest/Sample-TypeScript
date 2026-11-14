import { beforeEach, describe, expect, test } from "vitest";
import { NotFoundError } from "typedrest/errors";
import type { Contact, Note } from "@address-book/dto";
import { AddressBookClient } from "../src/index.ts";

/**
 * Ensures the endpoints of {@link AddressBookClient} send the expected HTTP requests, using a mocked `fetch()`.
 * The client and service together are tested in service/test/contactsApi.test.ts.
 */
describe("AddressBookClient", () => {
    let client: AddressBookClient;

    beforeEach(() => {
        client = new AddressBookClient(new URL("http://localhost/"));
    });

    test("reads all contacts", async () => {
        const contacts: Contact[] = [{ id: "1", firstName: "John", lastName: "Smith" }];
        fetchMock.mockOnceIf(
            "http://localhost/contacts",
            JSON.stringify(contacts),
            { headers: { "Content-Type": "application/json" } }
        );

        const result = await client.contacts.readAll();

        expect(result).toEqual(contacts);
    });

    test("reads contact", async () => {
        const contact: Contact = { id: "1", firstName: "John", lastName: "Smith" };
        fetchMock.mockOnceIf(
            "http://localhost/contacts/1",
            JSON.stringify(contact),
            { headers: { "Content-Type": "application/json" } }
        );

        const result = await client.contacts.get("1").read();

        expect(result).toEqual(contact);
    });

    test("reports missing contact as error", async () => {
        fetchMock.mockOnceIf("http://localhost/contacts/1", { status: 404 });

        await expect(client.contacts.get("1").read()).rejects.toBeInstanceOf(NotFoundError);
    });

    test("sets note", async () => {
        const note: Note = { content: "my note" };
        fetchMock.mockOnceIf(
            req => req.method === "PUT" && req.url === "http://localhost/contacts/1/note",
            async req => {
                expect(await req.json()).toEqual(note);
                return { status: 204 };
            }
        );

        await client.contacts.get("1").note.set(note);

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test("pokes contact", async () => {
        fetchMock.mockResponseOnce({ status: 204 });

        await client.contacts.get("1").poke.invoke();

        const [request] = fetchMock.requests();
        expect(request.url).toBe("http://localhost/contacts/1/poke");
        expect(request.method).toBe("POST");
    });
});
