import { endpoints } from "typedrest";
import type { Contact, Note } from "@addressbook/dto";

const { ElementEndpoint } = endpoints.generic;
const { ActionEndpoint } = endpoints.rpc;

/**
 * Represents a REST endpoint for a single {@link Contact}.
 */
export class ContactElementEndpoint extends ElementEndpoint<Contact> {
    constructor(referrer: endpoints.Endpoint, relativeUri: URL | string) {
        super(referrer, relativeUri);
    }

    /** An optional note on the contact. */
    get note() {
        return new ElementEndpoint<Note>(this, "./note");
    }

    /** An action for poking the contact. */
    get poke() {
        return new ActionEndpoint(this, "./poke");
    }
}
