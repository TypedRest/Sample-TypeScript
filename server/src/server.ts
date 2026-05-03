import Database from "better-sqlite3";
import { buildApp } from "./app";
import { SqliteContactsService } from "./contacts.service";

async function main() {
    const db = new Database(process.env.DATABASE_PATH ?? "addressbook.db");
    const service = new SqliteContactsService(db);
    const app = buildApp({ service, logger: true });

    const port = Number(process.env.PORT ?? 5000);
    await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
