import { endpoints } from "typedrest";
import type { Contact } from "@addressbook/dto";
import { ContactElementEndpoint } from "./ContactElementEndpoint";

const { EntryEndpoint } = endpoints;
const { GenericCollectionEndpoint } = endpoints.generic;

/**
 * Provides a type-safe client for the Address Book REST API.
 */
export class AddressBookClient extends EntryEndpoint {
    /**
     * Creates a new Address Book Client.
     * @param uri The base URI of the Address Book API.
     */
    constructor(uri: URL | string) {
        super(uri);
    }

    /** A collection of contacts in the address book. */
    get contacts() {
        return new GenericCollectionEndpoint<Contact, ContactElementEndpoint>(
            this,
            "contacts",
            ContactElementEndpoint);
    }
}
