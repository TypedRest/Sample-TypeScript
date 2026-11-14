import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createApp } from "./app.ts";
import { SqliteContactsService } from "./ContactsService.ts";
import { openDatabase } from "./database.ts";

const port = Number(process.env.PORT ?? 3000);
const db = openDatabase(process.env.DATABASE ?? "AddressBook.db");

// Serve the web page too, if it has been built with "npm run build"
const webRoot = resolve(import.meta.dirname, "../../web/dist");

createApp(new SqliteContactsService(db), existsSync(webRoot) ? webRoot : undefined)
    .listen(port, () => {
        console.log(`Address Book API listening on http://localhost:${port}/`);
        console.log(`API reference: http://localhost:${port}/scalar`);
    });
