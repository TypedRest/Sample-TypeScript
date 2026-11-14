import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { test as base, vi, type Mocked } from "vitest";
import { AddressBookClient } from "@address-book/client";
import { createApp } from "../src/app.ts";
import type { ContactsService } from "../src/ContactsService.ts";

/**
 * Starts the Express app on a random port with a mocked {@link ContactsService} for decoupled testing of routes and the client library.
 */
export const apiTest = base.extend<{ service: Mocked<ContactsService>; baseUri: URL; client: AddressBookClient }>({
    service: async ({}, use) => {
        await use({
            readAll: vi.fn(),
            read: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            readNote: vi.fn(),
            setNote: vi.fn(),
            poke: vi.fn()
        });
    },

    baseUri: async ({ service }, use) => {
        const server = createApp(service).listen(0, "localhost");
        await once(server, "listening");
        const { port } = server.address() as AddressInfo;

        await use(new URL(`http://localhost:${port}/`));

        server.closeAllConnections();
        server.close();
    },

    client: async ({ baseUri }, use) => {
        await use(new AddressBookClient(baseUri));
    }
});
