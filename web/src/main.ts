import { AddressBookClient, type Contact } from "@address-book/client";

// The page is served from the same origin as the API
const client = new AddressBookClient(new URL("/", location.href));

const list = document.querySelector<HTMLUListElement>("#contacts")!;
const form = document.querySelector<HTMLFormElement>("#add-contact")!;
const status = document.querySelector<HTMLOutputElement>("#status")!;

async function refresh() {
    const contacts = await client.contacts.readAll();
    list.replaceChildren(...await Promise.all(contacts.map(renderContact)));
}

async function renderContact(contact: Contact) {
    const endpoint = client.contacts.get(contact);
    const name = `${contact.firstName} ${contact.lastName}`;

    const label = document.createElement("span");
    label.className = "name";
    label.textContent = name;

    const note = document.createElement("input");
    note.placeholder = "Add a note";
    note.ariaLabel = `Note for ${name}`;
    note.value = (await endpoint.note.read()).content;
    note.addEventListener("change", () =>
        run(() => endpoint.note.set({ content: note.value }), `Saved note for ${name}.`));

    const item = document.createElement("li");
    item.append(
        label,
        note,
        button("Poke", () =>
            run(() => endpoint.poke.invoke(), `Poked ${name}.`)),
        button("Delete", () =>
            run(async () => { await endpoint.delete(); await refresh(); }, `Deleted ${name}.`), "danger"));
    return item;
}

function button(text: string, onClick: () => void, className = "") {
    const result = document.createElement("button");
    result.type = "button";
    result.textContent = text;
    result.className = className;
    result.addEventListener("click", onClick);
    return result;
}

form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);
    const contact: Contact = { firstName: String(data.get("firstName")), lastName: String(data.get("lastName")) };
    run(async () => {
        await client.contacts.create(contact);
        form.reset();
        await refresh();
    }, `Added ${contact.firstName} ${contact.lastName}.`);
});

/**
 * Runs an API call and reports the outcome in the status line.
 */
async function run(action: () => Promise<unknown>, successMessage = "") {
    try {
        await action();
        status.textContent = successMessage;
        status.classList.remove("error");
    } catch (error) {
        status.textContent = error instanceof Error ? error.message : String(error);
        status.classList.add("error");
    }
}

run(refresh);
