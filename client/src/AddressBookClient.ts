import { EntryEndpoint } from "typedrest/endpoints";
import { GenericCollectionEndpoint } from "typedrest/endpoints/generic";
import type { Contact } from "@address-book/dto";
import { ContactElementEndpoint } from "./ContactElementEndpoint.ts";

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

    /**
     * A collection of contacts in an address book.
     */
    get contacts() {
        return new GenericCollectionEndpoint<Contact, ContactElementEndpoint>(this, "./contacts", ContactElementEndpoint);
    }
}
