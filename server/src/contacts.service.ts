import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { Contact, Note } from "@addressbook/dto";

/**
 * Thrown by the service when an operation references a non-existent contact.
 * The route layer maps this to HTTP 404.
 */
export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NotFoundError";
    }
}

/**
 * Manages contacts in an address book.
 */
export interface ContactsService {
    readAll(): Promise<Contact[]>;
    read(id: string): Promise<Contact>;
    create(contact: Contact): Promise<Contact>;
    update(contact: Contact): Promise<void>;
    delete(id: string): Promise<void>;
    readNote(id: string): Promise<Note>;
    setNote(id: string, note: Note): Promise<void>;
    poke(id: string): Promise<void>;
}

/**
 * SQLite-backed {@link ContactsService}.
 */
export class SqliteContactsService implements ContactsService {
    constructor(private readonly db: Database.Database) {
        db.exec(`
            CREATE TABLE IF NOT EXISTS contacts (
                id TEXT PRIMARY KEY,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL,
                note TEXT NOT NULL DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS pokes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contactId TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
                timestamp TEXT NOT NULL
            );
        `);
    }

    async readAll(): Promise<Contact[]> {
        return this.db
            .prepare("SELECT id, firstName, lastName FROM contacts")
            .all() as Contact[];
    }

    async read(id: string): Promise<Contact> {
        const row = this.db
            .prepare("SELECT id, firstName, lastName FROM contacts WHERE id = ?")
            .get(id) as Contact | undefined;
        if (!row) throw new NotFoundError(`Contact '${id}' not found.`);
        return row;
    }

    async create(contact: Contact): Promise<Contact> {
        const created: Contact = {
            id: randomUUID(),
            firstName: contact.firstName,
            lastName: contact.lastName
        };
        this.db
            .prepare("INSERT INTO contacts (id, firstName, lastName) VALUES (?, ?, ?)")
            .run(created.id, created.firstName, created.lastName);
        return created;
    }

    async update(contact: Contact): Promise<void> {
        const result = this.db
            .prepare("UPDATE contacts SET firstName = ?, lastName = ? WHERE id = ?")
            .run(contact.firstName, contact.lastName, contact.id);
        if (result.changes === 0) throw new NotFoundError(`Contact '${contact.id}' not found.`);
    }

    async delete(id: string): Promise<void> {
        const result = this.db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
        if (result.changes === 0) throw new NotFoundError(`Contact '${id}' not found.`);
    }

    async readNote(id: string): Promise<Note> {
        const row = this.db
            .prepare("SELECT note AS content FROM contacts WHERE id = ?")
            .get(id) as Note | undefined;
        if (!row) throw new NotFoundError(`Contact '${id}' not found.`);
        return row;
    }

    async setNote(id: string, note: Note): Promise<void> {
        const result = this.db
            .prepare("UPDATE contacts SET note = ? WHERE id = ?")
            .run(note.content, id);
        if (result.changes === 0) throw new NotFoundError(`Contact '${id}' not found.`);
    }

    async poke(id: string): Promise<void> {
        const exists = this.db
            .prepare("SELECT 1 FROM contacts WHERE id = ?")
            .get(id);
        if (!exists) throw new NotFoundError(`Contact '${id}' not found.`);
        this.db
            .prepare("INSERT INTO pokes (contactId, timestamp) VALUES (?, ?)")
            .run(id, new Date().toISOString());
    }
}
