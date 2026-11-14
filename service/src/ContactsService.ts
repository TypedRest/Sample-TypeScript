import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { Contact, Note } from "@address-book/dto";
import { NotFoundError } from "./errors.ts";

/**
 * Manages contacts in an address book.
 */
export interface ContactsService {
    readAll(): Contact[];
    read(id: string): Contact;
    create(contact: Contact): Contact;
    update(contact: Contact): void;
    delete(id: string): void;
    readNote(id: string): Note;
    setNote(id: string, note: Note): void;
    poke(id: string): void;
}

interface ContactRow {
    id: string;
    first_name: string;
    last_name: string;
    note: string | null;
}

/**
 * Stores contacts in an SQLite database.
 */
export class SqliteContactsService implements ContactsService {
    readonly #db: DatabaseSync;

    constructor(db: DatabaseSync) {
        this.#db = db;
    }

    readAll(): Contact[] {
        const rows = this.#db.prepare("SELECT * FROM contacts ORDER BY last_name, first_name").all() as unknown as ContactRow[];
        return rows.map(toDto);
    }

    read(id: string): Contact {
        return toDto(this.#find(id));
    }

    create(contact: Contact): Contact {
        const id = randomUUID();
        this.#db.prepare("INSERT INTO contacts (id, first_name, last_name) VALUES (?, ?, ?)")
            .run(id, contact.firstName, contact.lastName);
        return { id, firstName: contact.firstName, lastName: contact.lastName };
    }

    update(contact: Contact): void {
        if (!contact.id) throw new Error("Contact ID must be set.");
        const result = this.#db.prepare("UPDATE contacts SET first_name = ?, last_name = ? WHERE id = ?")
            .run(contact.firstName, contact.lastName, contact.id);
        if (result.changes === 0) throw notFound(contact.id);
    }

    delete(id: string): void {
        const result = this.#db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
        if (result.changes === 0) throw notFound(id);
    }

    readNote(id: string): Note {
        return { content: this.#find(id).note ?? "" };
    }

    setNote(id: string, note: Note): void {
        const result = this.#db.prepare("UPDATE contacts SET note = ? WHERE id = ?").run(note.content, id);
        if (result.changes === 0) throw notFound(id);
    }

    poke(id: string): void {
        this.#find(id);
        this.#db.prepare("INSERT INTO pokes (contact_id, timestamp) VALUES (?, ?)").run(id, new Date().toISOString());
    }

    #find(id: string): ContactRow {
        const row = this.#db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as ContactRow | undefined;
        if (!row) throw notFound(id);
        return row;
    }
}

const toDto = (row: ContactRow): Contact => ({ id: row.id, firstName: row.first_name, lastName: row.last_name });

const notFound = (id: string) => new NotFoundError(`Contact '${id}' not found.`);
