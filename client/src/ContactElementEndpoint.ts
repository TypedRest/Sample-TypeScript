import { ElementEndpoint } from "typedrest/endpoints/generic";
import { ActionEndpoint } from "typedrest/endpoints/rpc";
import type { Contact, Note } from "@address-book/dto";

/**
 * Represents a REST endpoint for a single {@link Contact}.
 */
export class ContactElementEndpoint extends ElementEndpoint<Contact> {
    /**
     * An optional note on the contact.
     */
    get note() {
        return new ElementEndpoint<Note>(this, "./note");
    }

    /**
     * An action for poking the contact.
     */
    get poke() {
        return new ActionEndpoint(this, "./poke");
    }
}
