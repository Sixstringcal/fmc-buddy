const VALID_MOVE_RE = /^(R|L|F|B|U|D|x|y|z|Rw|Lw|Fw|Bw|Uw|Dw)(2|'|w2|w')?$/;
const COUNTABLE_MOVE_RE = /^(R|L|F|B|U|D|Rw|Lw|Fw|Bw|Uw|Dw)(2|'|w2|w')?$/;

/** Some devices like to default to the wrong apostrophe. */
export function normalizeApostrophes(moves: string): string {
    return moves.replaceAll("\u2019", "'");
}

/** Removes comments from the input box */
export function stripComments(moves: string): string {
    return moves
        .split("\n")
        .map((line) => line.split("//")[0].trim())
        .filter((line) => line.length > 0)
        .join(" ");
}

/** Return the inverse of an alg string (e.g. "R U R'" → "R U' R'"). */
export function invertMoves(moves: string): string {
    return moves
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((m) => {
            if (m.endsWith("'")) return m.slice(0, -1);
            if (m.endsWith("2")) return m;
            return m + "'";
        })
        .reverse()
        .join(" ");
}

export interface SeparatedMoves {
    normalMoves: string;
    inverseMoves: string;
}

/**
 * Split the raw text-area content into normal moves and parenthesised
 * (inverse-group) moves.  Parentheses in the input denote moves that should be
 * applied on the inverse side of the skeleton.
 */
export function separateMoves(raw: string): SeparatedMoves {
    let normalMoves = "";
    let inverseMoves = "";

    let isInGroup = false;
    let groupBuffer = "";

    for (const token of raw.split(/\s+/)) {
        if (!token) continue;

        const expanded =
            token.endsWith("2") && validMove(token.slice(0, -1))
                ? `${token.slice(0, -1)} ${token.slice(0, -1)}`
                : token;

        for (const move of expanded.split(/\s+/)) {
            if (!move) continue;

            if (move.startsWith("(") && move.endsWith(")")) {
                const inner = move.slice(1, -1);
                inverseMoves += (inverseMoves ? " " : "") + inner;
            } else if (move.startsWith("(")) {
                isInGroup = true;
                groupBuffer = move.slice(1);
            } else if (move.endsWith(")") && isInGroup) {
                groupBuffer += " " + move.slice(0, -1);
                inverseMoves += (inverseMoves ? " " : "") + groupBuffer.trim();
                groupBuffer = "";
                isInGroup = false;
            } else if (isInGroup) {
                groupBuffer += " " + move;
            } else if (VALID_MOVE_RE.test(move)) {
                normalMoves += (normalMoves ? " " : "") + move;
            }
        }
    }

    if (isInGroup && groupBuffer) {
        inverseMoves += (inverseMoves ? " " : "") + groupBuffer.trim();
    }

    return { normalMoves, inverseMoves };
}

export function validMove(move: string): boolean {
    return VALID_MOVE_RE.test(move);
}

export function countMoves(movesText: string): number {
    if (!movesText.trim()) return 0;

    const text = normalizeApostrophes(movesText);
    let total = 0;
    let inParens = false;

    const tokens = text.split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        if (!token) continue;

        if (token.includes("(") && !token.includes(")")) {
            inParens = true;
            token = token.replace("(", "");
        }
        if (token.includes(")") && !token.includes("(")) {
            inParens = false;
            token = token.replace(")", "");
        }
        if (token.startsWith("(") && token.endsWith(")")) {
            token = token.slice(1, -1);
        }

        if (COUNTABLE_MOVE_RE.test(token)) {
            total++;
        } else if (token.endsWith("2") && COUNTABLE_MOVE_RE.test(token.slice(0, -1))) {
            total++;
        } else if (
            i + 1 < tokens.length &&
            token === tokens[i + 1] &&
            COUNTABLE_MOVE_RE.test(token)
        ) {
            total++;
            i++;
        }
        void inParens;
    }

    return total;
}

/**
 * Merge consecutive identical moves (e.g. R R → R2, R' R' → R2).
 * Used by the "Finish" action to clean up a solution.
 */
export function simplifyConsecutive(moves: string): string {
    const tokens = moves.split(/\s+/).filter(Boolean);
    const result: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
        const cur = tokens[i];
        const next = tokens[i + 1];

        if (cur === next) {
            if (cur.endsWith("2")) {
                i++;
            } else if (cur.endsWith("'")) {
                result.push(cur.replace("'", "2"));
                i++;
            } else {
                result.push(`${cur}2`);
                i++;
            }
        } else {
            result.push(cur);
        }
    }

    return result.join(" ");
}
