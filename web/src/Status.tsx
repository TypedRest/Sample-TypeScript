import { createContext, createSignal, useContext, type JSX } from "solid-js";

interface Status {
    /**
     * Runs an API call and reports the outcome in the status line.
     * @param successMessage Shown when the call succeeds. Leave unset for background reads that should not replace the current status.
     */
    run(action: () => Promise<unknown>, successMessage?: string): Promise<void>;
}

const StatusContext = createContext<Status>();

/**
 * Shows a status line below its children, which they can report to with {@link useStatus}.
 */
export function StatusProvider(props: { children: JSX.Element }) {
    const [message, setMessage] = createSignal("");
    const [isError, setIsError] = createSignal(false);

    async function run(action: () => Promise<unknown>, successMessage?: string) {
        try {
            await action();
            if (successMessage) {
                setMessage(successMessage);
                setIsError(false);
            }
        } catch (error) {
            // Requests cancelled because their component was disposed are not errors
            if (error instanceof DOMException && error.name === "AbortError") return;

            setMessage(error instanceof Error ? error.message : String(error));
            setIsError(true);
        }
    }

    return (
        <StatusContext.Provider value={{ run }}>
            {props.children}
            <output id="status" role="status" classList={{ error: isError() }}>{message()}</output>
        </StatusContext.Provider>
    );
}

/**
 * Gets the status line of the enclosing {@link StatusProvider}.
 */
export function useStatus(): Status {
    const status = useContext(StatusContext);
    if (!status) throw new Error("useStatus() must be called inside a <StatusProvider>.");
    return status;
}
