/**
 * Declarative UI helpers inspired by Jetpack Compose.
 *
 * Instead of:
 *   const btn = document.createElement("button");
 *   btn.classList.add("bar");
 *   btn.textContent = "Click me";
 *   btn.addEventListener("click", handler);
 *   parent.appendChild(btn);
 *
 * You write:
 *   parent.appendChild(
 *     Button({ classes: "bar", text: "Click me", onClick: handler })
 *   );
 *
 * Or compose layouts:
 *   Row({ align: "flex-start" },
 *     Button({ text: "+", classes: "dup-button", onClick: onDup }),
 *     Button({ text: "✔", classes: "fin-button", onClick: onFin }),
 *   )
 *
 * Every element gets an auto-generated ID (`_ui-N`). You can read `element.id`
 * (e.g. for tests) but IDs are never set by callers.
 */

type Child = HTMLElement | SVGElement | null | undefined | false;

let _idCounter = 0;
const _nextId = () => `_ui-${++_idCounter}`;

/** Event map restricted to the listener signature el() accepts. */
type EventHandlers = {
    [K in keyof HTMLElementEventMap]?: (e: HTMLElementEventMap[K]) => void;
};

export interface ElProps {
    /** One class, a space-separated string, or an array of class names. */
    classes?: string | string[];
    /** CSS object (partial CSSStyleDeclaration) OR a raw cssText string. */
    style?: Partial<CSSStyleDeclaration> | string;
    /** Sets textContent. */
    text?: string;
    /** Sets innerHTML – use sparingly (trusted strings only). */
    html?: string;
    title?: string;
    /** Shallow attribute map: { placeholder: "...", rows: "3", ... } */
    attrs?: Record<string, string>;
    /** Convenience for a single "click" handler. */
    onClick?: (e: MouseEvent) => void;
    /** Any event handlers (merged with onClick if both provided). */
    on?: EventHandlers;
}

// Layout-only extras
export interface LayoutProps extends ElProps {
    /** CSS gap, e.g. "8px" */
    gap?: string;
    /** align-items */
    align?: string;
    /** justify-content */
    justify?: string;
}

/**
 * Create a typed HTMLElement, apply all props, and append children.
 *
 * @example
 *   el("button", { text: "OK", classes: "primary", onClick: submit })
 *   // result.id is auto-generated, e.g. "_ui-3" — read-only by convention
 */
export function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props: ElProps = {},
    ...children: Child[]
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    node.id = _nextId();

    if (props.classes) {
        const list = Array.isArray(props.classes)
            ? props.classes
            : props.classes.trim().split(/\s+/);
        node.classList.add(...list.filter(Boolean));
    }

    if (props.style) {
        if (typeof props.style === "string") {
            node.style.cssText = props.style;
        } else {
            Object.assign(node.style, props.style);
        }
    }

    if (props.text !== undefined) node.textContent = props.text;
    if (props.html !== undefined) node.innerHTML = props.html;
    if (props.title) node.title = props.title;

    if (props.attrs) {
        for (const [k, v] of Object.entries(props.attrs)) {
            node.setAttribute(k, v);
        }
    }

    if (props.onClick) {
        node.addEventListener("click", props.onClick as EventListener);
    }
    if (props.on) {
        for (const [event, handler] of Object.entries(props.on)) {
            if (handler) node.addEventListener(event, handler as EventListener);
        }
    }

    for (const child of children) {
        if (child) node.appendChild(child);
    }

    return node;
}


export const Div = (props: ElProps = {}, ...children: Child[]) =>
    el("div", props, ...children);

export const Span = (props: ElProps = {}, ...children: Child[]) =>
    el("span", props, ...children);

export const Button = (props: ElProps = {}, ...children: Child[]): HTMLButtonElement =>
    el("button", props, ...children) as HTMLButtonElement;

export const TextArea = (
    props: ElProps & { placeholder?: string; rows?: number } = {},
): HTMLTextAreaElement => {
    const { placeholder, rows, ...rest } = props;
    const node = el("textarea", rest) as HTMLTextAreaElement;
    if (placeholder !== undefined) node.placeholder = placeholder;
    if (rows !== undefined) node.rows = rows;
    return node;
};

export const Input = (
    props: ElProps & { type?: string; placeholder?: string; value?: string } = {},
): HTMLInputElement => {
    const { type = "text", placeholder, value, ...rest } = props;
    const node = el("input", rest) as HTMLInputElement;
    node.type = type;
    if (placeholder !== undefined) node.placeholder = placeholder;
    if (value !== undefined) node.value = value;
    return node;
};

function _layoutStyle(
    direction: "column" | "row",
    props: LayoutProps,
): Partial<CSSStyleDeclaration> {
    const base: Partial<CSSStyleDeclaration> = {
        display: "flex",
        flexDirection: direction,
    };
    if (props.gap) base.gap = props.gap;
    if (props.align) base.alignItems = props.align;
    if (props.justify) base.justifyContent = props.justify;

    // Merge caller's own style object (cssText strings are applied afterwards)
    if (props.style && typeof props.style === "object") {
        Object.assign(base, props.style);
    }
    return base;
}

/**
 * A vertically stacked flex container (flex-direction: column).
 *
 * @example
 *   Column({ gap: "8px" },
 *     Button({ text: "A" }),
 *     Button({ text: "B" }),
 *   )
 */
export function Column(props: LayoutProps = {}, ...children: Child[]): HTMLDivElement {
    const { gap: _g, align: _a, justify: _j, ...rest } = props;
    const node = el("div", { ...rest, style: _layoutStyle("column", props) }, ...children);
    // Apply any cssText override on top
    if (typeof props.style === "string") node.style.cssText += props.style;
    return node;
}

/**
 * A horizontal flex container (flex-direction: row).
 *
 * @example
 *   Row({ align: "flex-start", style: { width: "100%" } },
 *     TextArea(),
 *     Button({ text: "+", onClick: onDup }),
 *   )
 */
export function Row(props: LayoutProps = {}, ...children: Child[]): HTMLDivElement {
    const { gap: _g, align: _a, justify: _j, ...rest } = props;
    const node = el("div", { ...rest, style: _layoutStyle("row", props) }, ...children);
    if (typeof props.style === "string") node.style.cssText += props.style;
    return node;
}
