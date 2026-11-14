/**
 * A contact in an address book.
 */
export interface Contact {
    /**
     * The ID of the contact. Assigned by the service when the contact is created.
     */
    id?: string;

    /**
     * The first name of the contact.
     */
    firstName: string;

    /**
     * The last name of the contact.
     */
    lastName: string;
}
