import type { Contact, ContactElementEndpoint } from "@address-book/client";
import { ContactNote } from "./ContactNote.tsx";
import { useStatus } from "./Status.tsx";

/**
 * Shows a single contact, with its note and actions.
 */
export function ContactItem(props: { endpoint: ContactElementEndpoint; contact: Contact; onDeleted: () => Promise<void> }) {
    const endpoint = props.endpoint;
    const note = endpoint.note;
    const { run } = useStatus();

    const name = () => `${props.contact.firstName} ${props.contact.lastName}`;

    return (
        <li>
            <span class="name">{name()}</span>
            <ContactNote endpoint={note} name={name()} />
            <button type="button" onClick={() => run(() => endpoint.poke.invoke(), `Poked ${name()}.`)}>
                Poke
            </button>
            <button type="button" class="danger" onClick={() => run(async () => {
                await endpoint.delete();
                await props.onDeleted();
            }, `Deleted ${name()}.`)}>
                Delete
            </button>
        </li>
    );
}
