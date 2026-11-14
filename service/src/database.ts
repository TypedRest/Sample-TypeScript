import { DatabaseSync } from "node:sqlite";

/**
 * Opens an SQLite database and creates the tables if they do not exist yet.
 * @param path The path of the database file, or `:memory:` for a temporary in-memory database.
 */
export function openDatabase(path: string): DatabaseSync {
    const db = new DatabaseSync(path);
    db.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            note TEXT
        );
        CREATE TABLE IF NOT EXISTS pokes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id TEXT NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
            timestamp TEXT NOT NULL
        );
    `);
    return db;
}
