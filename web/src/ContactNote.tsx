import { createSignal, onMount } from "solid-js";
import type { ContactElementEndpoint } from "@address-book/client";
import { useAbortSignal } from "./useAbortSignal.ts";
import { useStatus } from "./Status.tsx";

/**
 * Edits the note on a contact.
 */
export function ContactNote(props: { endpoint: ContactElementEndpoint["note"]; name: string }) {
    // Read and save through the same endpoint object, so TypedRest can send the ETag it got from the read:
    // If-None-Match when reading again, If-Match when saving to detect lost updates.
    const endpoint = props.endpoint;
    const signal = useAbortSignal();
    const { run } = useStatus();

    const [content, setContent] = createSignal("");
    onMount(() => run(async () => setContent((await endpoint.read(signal)).content)));

    function save(value: string) {
        run(() => endpoint.set({ content: value }), `Saved note for ${props.name}.`);
    }

    return (
        <input
            placeholder="Add a note"
            aria-label={`Note for ${props.name}`}
            value={content()}
            onChange={event => save(event.currentTarget.value)} />
    );
}
