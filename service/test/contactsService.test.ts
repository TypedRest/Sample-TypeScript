import { beforeEach, describe, expect, test } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { SqliteContactsService } from "../src/ContactsService.ts";
import { openDatabase } from "../src/database.ts";
import { NotFoundError } from "../src/errors.ts";

/**
 * Ensures {@link SqliteContactsService} stores contacts correctly, using an in-memory database.
 */
describe("SqliteContactsService", () => {
    let db: DatabaseSync;
    let service: SqliteContactsService;

    beforeEach(() => {
        db = openDatabase(":memory:");
        service = new SqliteContactsService(db);
    });

    test("creates and reads contacts", () => {
        const smith = service.create({ firstName: "John", lastName: "Smith" });
        const doe = service.create({ firstName: "Jane", lastName: "Doe" });

        expect(smith.id).toBeTruthy();
        expect(service.read(smith.id!)).toEqual(smith);
        expect(service.readAll()).toEqual([doe, smith]);
    });

    test("updates contact", () => {
        const { id } = service.create({ firstName: "John", lastName: "Smith" });

        service.update({ id, firstName: "Jane", lastName: "Smith" });

        expect(service.read(id!)).toEqual({ id, firstName: "Jane", lastName: "Smith" });
    });

    test("deletes contact", () => {
        const { id } = service.create({ firstName: "John", lastName: "Smith" });

        service.delete(id!);

        expect(service.readAll()).toEqual([]);
    });

    test("sets and reads note", () => {
        const { id } = service.create({ firstName: "John", lastName: "Smith" });
        expect(service.readNote(id!)).toEqual({ content: "" });

        service.setNote(id!, { content: "my note" });

        expect(service.readNote(id!)).toEqual({ content: "my note" });
    });

    test("records pokes", () => {
        const { id } = service.create({ firstName: "John", lastName: "Smith" });

        service.poke(id!);
        service.poke(id!);

        expect(db.prepare("SELECT COUNT(*) AS count FROM pokes WHERE contact_id = ?").get(id!)).toEqual({ count: 2 });
    });

    test("throws for missing contact", () => {
        expect(() => service.read("missing")).toThrow(NotFoundError);
        expect(() => service.update({ id: "missing", firstName: "John", lastName: "Smith" })).toThrow(NotFoundError);
        expect(() => service.delete("missing")).toThrow(NotFoundError);
        expect(() => service.readNote("missing")).toThrow(NotFoundError);
        expect(() => service.setNote("missing", { content: "my note" })).toThrow(NotFoundError);
        expect(() => service.poke("missing")).toThrow(NotFoundError);
    });
});
