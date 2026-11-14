import { onCleanup } from "solid-js";

/**
 * Returns a signal that aborts when the calling component is disposed.
 * Pass it to TypedRest calls to cancel requests that are still running when the component goes away.
 */
export function useAbortSignal(): AbortSignal {
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    return controller.signal;
}
