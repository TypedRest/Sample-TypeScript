import { For, onMount } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import type { AddressBookClient, Contact } from "@address-book/client";
import { ContactItem } from "./ContactItem.tsx";
import { useAbortSignal } from "./useAbortSignal.ts";
import { useStatus } from "./Status.tsx";

/**
 * Lists all contacts and lets the user add new ones.
 */
export function ContactList(props: { endpoint: AddressBookClient["contacts"] }) {
    const endpoint = props.endpoint;
    const signal = useAbortSignal();
    const { run } = useStatus();

    // Reconciling by ID keeps the components (and their endpoints) of contacts that are still there
    const [contacts, setContacts] = createStore<Contact[]>([]);
    async function refresh() {
        setContacts(reconcile(await endpoint.readAll(signal), { key: "id" }));
    }
    onMount(() => run(refresh));

    function add(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const contact: Contact = { firstName: String(data.get("firstName")), lastName: String(data.get("lastName")) };
        run(async () => {
            await endpoint.create(contact);
            form.reset();
            await refresh();
        }, `Added ${contact.firstName} ${contact.lastName}.`);
    }

    return (
        <>
            <form onSubmit={add}>
                <input name="firstName" placeholder="First name" aria-label="First name" required />
                <input name="lastName" placeholder="Last name" aria-label="Last name" required />
                <button type="submit">Add contact</button>
            </form>

            <ul id="contacts">
                <For each={contacts}>{contact => {
                    const element = endpoint.get(contact);
                    return <ContactItem endpoint={element} contact={contact} onDeleted={refresh} />;
                }}</For>
            </ul>
        </>
    );
}
