import { instead } from "@revenge-mod/patcher";

/**
 * Revenge Next's `after` hook only receives the *result* of the original function (no arguments),
 * so every patch here that needs the original arguments goes through this helper instead.
 *
 * The callback receives `(args, result)`:
 *  - return a value to replace the result
 *  - return nothing to keep the original result (editing `result` in place is fine too)
 *
 * Errors are caught on purpose: a broken tag must never be able to crash Discord's UI.
 */
export function hookWithArgs(
    parent: any,
    key: string,
    callback: (args: any[], result: any) => any,
): () => void {
    return (instead as any)(parent, key, function (this: any, args: any[], original: any) {
        const result = original.apply(this, args);

        try {
            const out = callback(args, result);
            return out === undefined ? result : out;
        } catch (error) {
            console.error("[CustomTags] patch failed:", error);
            return result;
        }
    }) as () => void;
}
