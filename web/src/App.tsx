import type { AddressBookClient } from "@address-book/client";
import { ContactList } from "./ContactList.tsx";
import { StatusProvider } from "./Status.tsx";

/**
 * The Address Book page.
 *
 * The component tree mirrors the endpoint tree:
 * each component gets the endpoint it works with as a prop and keeps that endpoint for its whole lifetime.
 * Solid runs component functions only once, so a plain `const endpoint = props.endpoint` is enough to do that.
 */
export function App(props: { client: AddressBookClient }) {
    const contacts = props.client.contacts;

    return (
        <main>
            <header>
                <h1>Address Book</h1>
                <p>A TypedRest client running in the browser. <a href="/scalar">API reference</a></p>
            </header>

            <StatusProvider>
                <ContactList endpoint={contacts} />
            </StatusProvider>
        </main>
    );
}
