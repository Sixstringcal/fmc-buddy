export interface TextTransformResult {
    newValue: string;
    newStart: number;
    newEnd: number;
}

/**
 * Toggle `//` comments on each selected line (Ctrl+/).
 * If every line in the selection already starts with `//`, they are all
 * uncommented; otherwise every line is commented.
 *
 * @param value   Full textarea content.
 * @param start   Selection start (cursor if no selection).
 * @param end     Selection end (same as start if no selection).
 * @returns       The updated content and adjusted selection range.
 */
export function toggleLineComment(
    value: string,
    start: number,
    end: number,
): TextTransformResult {
    const lines = value.split("\n");
    const startLine = value.substring(0, start).split("\n").length - 1;
    const endLine = value.substring(0, end).split("\n").length - 1;

    const allCommented = lines
        .slice(startLine, endLine + 1)
        .every((l) => l.trimStart().startsWith("//"));

    for (let i = startLine; i <= endLine; i++) {
        if (allCommented) {
            if (lines[i]!.trimStart().startsWith("//")) {
                const indent = lines[i]!.length - lines[i]!.trimStart().length;
                lines[i] = lines[i]!.substring(0, indent) + lines[i]!.substring(indent + 2);
            }
        } else {
            lines[i] = "//" + lines[i];
        }
    }

    const newValue = lines.join("\n");
    const delta = (allCommented ? -2 : 2) * (endLine - startLine + 1);
    return { newValue, newStart: start, newEnd: end + delta };
}

/**
 * Auto-close or auto-skip a parenthesis as the user types.
 *
 * - If an opening `(` was just typed, insert a matching `)` after the cursor.
 * - If a `)` was just typed but one already exists right after the cursor,
 *   consume the existing `)` instead of inserting a duplicate.
 *
 * @param value         Current textarea value (after the keystroke).
 * @param cursor        Current cursor position (selectionStart).
 * @param previousValue Textarea value before the keystroke.
 * @returns             `{ newValue, newCursor }` if a transformation was
 *                      applied, or `null` if nothing should change.
 */
export function applyAutoCloseParen(
    value: string,
    cursor: number,
    previousValue: string,
): { newValue: string; newCursor: number } | null {
    const inserted = value.length > previousValue.length;

    // Auto-close: user typed "("
    if (inserted && cursor > 0 && value[cursor - 1] === "(") {
        return {
            newValue: value.slice(0, cursor) + ")" + value.slice(cursor),
            newCursor: cursor,
        };
    }

    // Skip: user typed ")" and one already exists at the cursor position
    if (
        inserted &&
        cursor > 0 &&
        value[cursor - 1] === ")" &&
        cursor < value.length &&
        value[cursor] === ")"
    ) {
        return {
            newValue: value.slice(0, cursor) + value.slice(cursor + 1),
            newCursor: cursor,
        };
    }

    return null;
}
