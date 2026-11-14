import express, { type Express } from "express";
import { apiReference } from "@scalar/express-api-reference";
import type { ContactsService } from "./ContactsService.ts";
import { contactsRouter } from "./contactsRouter.ts";
import { problemDetails } from "./errors.ts";

/**
 * Sets up the Express application for the Address Book REST API.
 * @param service The service used to manage contacts.
 * @param webRoot A directory with static files to serve next to the API (e.g. the built web page).
 */
export function createApp(service: ContactsService, webRoot?: string): Express {
    const app = express()
        .use(express.json({ type: ["application/json", "application/*+json"] }))
        .use("/contacts", contactsRouter(service))
        .get("/openapi.yaml", (_req, res) => {
            res.type("application/yaml").sendFile("openapi.yaml", { root: `${import.meta.dirname}/..` });
        })
        .get("/scalar", apiReference({ url: "/openapi.yaml", pageTitle: "Address Book API" }));

    if (webRoot) app.use(express.static(webRoot));

    return app.use(problemDetails);
}
