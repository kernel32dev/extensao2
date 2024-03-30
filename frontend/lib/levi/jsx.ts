////////////////////////////////
// biblioteca LEVI 2024-03-25 //
// kernel32dev@gmail.com      //
// github.com/kernel32dev     //
// por favor não remova, :D   //
////////////////////////////////

import "./react-types";
import { State, StateArray, ArrayMutation } from "./state";


/** the view interface, any object that implements this interface can be used in jsx expressions
 *
 * this interface consists only of a single method named view that returns elements
 * 
 * there is an edge case with node, nodes normally are simply added directly to the dom, but if a node implements this interface, the view function is called instead, allowing for future shenanigans, this may change in the future */
export interface View {
    /** returns elements which visualize this view */
    view(): Elems;
}

/** a special type of object which can be referenced first and initialized later, created by the global function `ref` */
export type Ref<T> = T & { current: T | null };

/** all the properties of HTMLElement */
export type PropsElem = React.HTMLAttributes<HTMLElement>;
/** all the properties of SVGElement, not the `<svg>` element itself, but the base of all svg related elements */
export type PropsSVG = React.SVGProps<SVGElement>;
/** all the properties of HTMLElement but with the specifed type in the place of this, useful for defining custom elements */
export type PropsAs<T> = React.HTMLAttributes<T>;
/** all the properties of an element */
export type PropsOf<T extends keyof React.JSX.IntrinsicElements> = React.JSX.IntrinsicElements[T];
/** all the properties of a class element */
export type PropsOfClass<T extends abstract new (props: any) => any> = T extends abstract new (props: infer P) => any ? P : never;
/** the output of a jsx element */
export type Elems = React.JSX.Element;
/** the valid inputs to a jsx element */
export type Nodes = React.ReactNode;
/** the types that can be used as a css class */
export type Classes = React.ClassList;
/** the properties that can be used as an inline style */
export type Style = React.CSSProperties;

// CustomHTMLElement //

export class CustomHTMLElement extends HTMLElement {
    constructor(props: PropsElem) {
        if (!props) {
            throw new Error("CustomHTMLElement constructor called without props,\the constructor may have been called incorrectly from outside of jsx\nor indirectly called outside of user code\nor jsx attempted to deep clone this node to prevent it from being removed from the dom");
        }
        try {
            super();
        } catch (e: any) {
            if (e.message === "Illegal constructor") {
                e.message = "Unregistered custom element: " + new.target.name;
            }
            throw e;
        }
        jsx_apply_props(this, props);
    }
    /** `receiveChild` is the function called from within jsx to append children to this element, it is called multiple times
     *
     * it can also be called from outside of jsx to politely ask that you receive another child, without forcing it to go in any specific place of the element
     *
     * aka while `appendChild` means put the element exactly here, `receiveChild` is place it where you want to place it
     *
     * defaults to a call to `appendChild`, but you can override it to customize where children are placed, or to handle child elements in a special way
     *
     * this method is called by jsx as many times as are needed, immediatly after constructor is called
     *
     * overridable method of `CustomHTMLElement` */
    receiveChild(node: Node) {
        this.appendChild(node);
    }
}

// JSX //

const svg_tag_names = ["animate", "animateMotion", "animateTransform", "circle", "clipPath", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "foreignObject", "g", "image", "line", "linearGradient", "marker", "mask", "metadata", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "stop", "svg", "switch", "symbol", "text", "textPath", "tspan", "use", "view"];

const sym_fences = Symbol("StateArray fence");

export function jsx(
    tag: string | null | ((props: Record<string, any>) => Elems) | { new(props: Record<string, any>): CustomHTMLElement, prototype: CustomHTMLElement },
    props: Record<string, any> | null,
    ...children: Nodes[]
): Elems {
    let elem;
    if (typeof tag === "function") {
        let ref = undefined;
        if (props !== null && props["ref"]) {
            ref = props["ref"];
            delete props["ref"];
        }
        if (tag.prototype instanceof CustomHTMLElement) {
            elem = new (tag as new (props: Record<string, any>) => CustomHTMLElement)(props || {});
        } else {
            elem = (tag as ((props: Record<string, any>) => Elems))(props || {});
        }
        if (ref !== undefined) {
            if (typeof ref === "object") {
                ref.current = elem;
            } else if (typeof ref === "function") {
                ref.call(elem, elem);
            } else {
                throw new Error("jsx: unsupported ref attribute type: " + typeof ref);
            }
        }
    } else if (tag === "" || tag === null) {
        elem = document.createDocumentFragment();
    } else if (tag === "style") {
        for (let i = 0; i < children.length; i++) {
            if (typeof children[i] !== "string") {
                throw new Error("jsx: the content of a style tag must be a string");
            }
        }
        let style = document.createElement("style");
        style.innerHTML = (children as string[]).join("");
        return style;
    } else {
        let is_svg = svg_tag_names.indexOf(tag) !== -1;
        elem = !is_svg ? document.createElement(tag) : document.createElementNS("http://www.w3.org/2000/svg", tag);
        jsx_apply_props(elem, props as PropsElem);
    }
    for (let child of children) {
        jsx_apply_children(elem, child);
    }
    return elem;
}

function jsx_apply_props(elem: HTMLElement | SVGElement, props: PropsElem) {
    if (props === null) return;
    for (let key of Object.keys(props)) {
        if (key === "class") {
            State.do(props["class"], classes => {
                for (let i = elem.classList.length - 1; i >= 0; i--) {
                    elem.classList.remove(elem.classList[i]);
                }
                add_classes(elem.classList, classes);
            });
            function add_classes(list: DOMTokenList, classes: Classes) {
                if (typeof classes === "string") {
                    for (let i of classes.split(" ")) {
                        if (i) list.add(i);
                    }
                } else if (classes instanceof Array) {
                    for (let i of classes) {
                        add_classes(list, i);
                    }
                } else if (classes instanceof State) {
                    classes;
                } else if (classes) {
                    classes;
                }
            }
            continue;
        }
        let value = (props as Record<string, any>)[key];
        if (key == "value" && value instanceof State && (elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement)) {
            elem.addEventListener("input", function (this: HTMLInputElement | HTMLTextAreaElement) {
                let state = value as State<unknown>;
                let new_value = this.value;
                if (state.value !== new_value) {
                    state.value = new_value;
                }
            });
            value.do(x => elem.value = String(x));
        } else if (key == "checked" && value instanceof State && elem instanceof HTMLInputElement) {
            elem.addEventListener("input", function (this: HTMLInputElement) {
                if (this.type !== "checkbox" && this.type !== "radio") return;
                let state = value as State<unknown>;
                let new_value = this.checked;
                if (state.value !== new_value) {
                    state.value = new_value;
                }
            });
            value.do(x => elem.checked = !!x);
        } else if (key == "value" && value instanceof State && elem instanceof HTMLSelectElement) {
            elem.addEventListener("input", function (this: HTMLSelectElement) {
                let state = value as State<unknown>;
                if (this.multiple) {
                    let items = state.value as unknown[];
                    if (!Array.isArray(items)) {
                        items = State.obj<unknown[]>([]);
                        state.value = items;
                    }
                    let cursor = 0;
                    let options = elem.options;
                    for (let i = 0; i < options.length; i++) {
                        let option = options[i];
                        if (!option.selected) return;
                        let value = option.value;
                        while (true) {
                            if (cursor < items.length) {
                                items.push(value);
                                break;
                            }
                            if (items[cursor] === value) break;
                            items.shift();
                        }
                        cursor++;
                    }
                    if (cursor < items.length) {
                        items.splice(cursor, items.length - cursor);
                    }
                } else {
                    state.value = this.value;
                }
            });
            value.do(x => {
                if (elem.multiple) {
                    let options = elem.options;
                    if (Array.isArray(x)) {
                        for (let i = 0; i < options.length; i++) {
                            let option = options[i];
                            option.selected = x.indexOf(option.value) != -1;
                        }
                    } else if (typeof x === "string" || typeof x === "number") {
                        x = String(x);
                        for (let i = 0; i < options.length; i++) {
                            let option = options[i];
                            option.selected = x === option.value;
                        }
                    } else {
                        for (let i = 0; i < options.length; i++) {
                            options[i].selected = false;
                        }
                    }
                } else {
                    if (Array.isArray(x)) x = x[0];
                    if (typeof x === "string" || typeof x === "number") {
                        elem.value = String(x);
                    } else {
                        elem.value = "";
                    }
                }
            });
        } else if (key == "ref") {
            if (typeof value === "function") {
                value.call(elem, elem);
            } else if (typeof value === "object") {
                if (value instanceof State) {
                    if (typeof value.value.current === "object") {
                        value.value.current = elem;
                        value.trigger();
                    } else {
                        value.value = elem;
                    }
                } else if (typeof value.current === "object") {
                    value.current = elem;
                } else {
                    throw new Error("jsx: ref passed was an object that is not a State nor a Ref");
                }
            } else {
                throw new Error("jsx: ref passed was a value of type " + typeof value);
            }
        } else if (key.startsWith("on")) {
            elem.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            State.do(value, value => {
                if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
                    if (elem instanceof SVGElement) {
                        elem.setAttribute(key, String(value));
                    } else {
                        elem.setAttribute(key.toLowerCase(), String(value));
                    }
                } else if (typeof value === "function") {
                    throw new Error("jsx: unsupported function attribute " + key);
                } else if (typeof value === "boolean") {
                    if (value) {
                        elem.setAttribute(key.toLowerCase(), "");
                    } else {
                        elem.removeAttribute(key.toLowerCase());
                    }
                } else if (typeof value === "undefined") {
                    elem.removeAttribute(key.toLowerCase());
                } else if (typeof value === "object") {
                    if (value === null) {
                        elem.removeAttribute(key.toLowerCase());
                    } else if (key === "style") {
                        elem.style.cssText = "";
                        for (let key of Object.keys(value)) {
                            let kebab = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
                            elem.style.setProperty(kebab, String(value[key]));
                        }
                    } else {
                        throw new Error("jsx: unsupported object attribute " + key);
                    }
                }
            });
        }
    }
}

function jsx_apply_node<T extends Node>(elem: Elems, child: T): T {
    if (elem instanceof CustomHTMLElement) {
        elem.receiveChild(child);
    } else {
        elem.appendChild(child);
    }
    return child;
}

function jsx_apply_children(elem: Elems, child: Nodes): void {
    if (child === null || typeof child === "undefined" || typeof child === "boolean") {
        // ignore boolean, undefined and null
        // this exists to allow things like `<div>{is_checked && <span>checked!</span>}</div>` to exist
        return;
    } else if (typeof child !== "object") {
        child = document.createTextNode(String(child));
        jsx_apply_node(elem, child);
        return;
    } else if (child instanceof State) {
        jsx_apply_stateful_children(elem, child);
        return; // TODO!
    } else if ("view" in child) {
        child = child["view"]();
        jsx_apply_node(elem, child);
        return;
    } else if (child instanceof Node) {
        if (child.parentNode !== null && child.getRootNode() == document) {
            // TODO! if any custom elements are found in child, this will throw an exception
            let clone = child.cloneNode(true);
            child.parentNode.replaceChild(clone, child);
        }
        jsx_apply_node(elem, child);
        return;
    } else if (Symbol.iterator in child) {
        if (child instanceof StateArray) {
            if (child.length == 0) {
                let fence = jsx_apply_node(elem, document.createComment(""));
                State.silent_set(child as any, sym_fences, [fence]);
            } else {
                let fences: Comment[] = Array(child.length + 1);
                fences[0] = document.createComment("");
                fences[fences.length - 1] = document.createComment("");
                jsx_apply_node(elem, fences[0]);
                for (let i = 0; i < child.length; i++) {
                    if (i != 0) {
                        fences[i] = jsx_apply_node(elem, document.createComment(""));
                    }
                    jsx_apply_children(elem, child[i]);
                }
                jsx_apply_node(elem, fences[fences.length - 1]);
                State.silent_set(child as any, sym_fences, fences);
            }
        } else if (Array.isArray(child)) {
            for (let i = 0; i < child.length; i++) {
                jsx_apply_children(elem, child[i]);
            }
        } else {
            for (let i of child) {
                jsx_apply_children(elem, i);
            }
        }
        return;
    } else {
        child = document.createTextNode(String(child));
        jsx_apply_node(elem, child);
        return;
    }
}

function jsx_apply_stateful_children(elem: Elems, state: State<Nodes>) {
    let frag = document.createDocumentFragment();
    let fence_left = document.createComment("");
    let fence_right = document.createComment("");
    frag.appendChild(fence_left);
    jsx_apply_children(frag, state.value);
    frag.appendChild(fence_right);
    state.on((child, mut) => {
        if (mut.empty) {
            console.log("DEBUG! jsx stateful empty mutation found");
        }

        // TODO! if mutation was ArrayMutation, perform a localized update
        assert_fence_continuity(fence_left, fence_right);
        let parent = fence_left.parentNode!;

        if (mut instanceof ArrayMutation && sym_fences in mut.target) {
            let fences = mut.target[sym_fences] as [Comment, ...Comment[]];
            // TODO! handle possible bound issues
            let update_len = Math.min(mut.remove.length, mut.insert.length);
            // UPDATE: overwrite slots that were updated
            for (let i = mut.index; i < mut.index + update_len; i++) {
                let update_fence_left = fences[i];
                let update_fence_right = fences[i + 1];
                assert_fence_continuity(update_fence_left, update_fence_right);
                // remove everything in this slot
                while (update_fence_left.nextSibling != update_fence_right) {
                    update_fence_left.nextSibling!.remove();
                }
                // add new value to slot
                let frag = document.createDocumentFragment();
                jsx_apply_children(frag, mut.insert[i - mut.index] as Nodes);
                update_fence_right.parentNode!.insertBefore(frag, update_fence_right);
            }
            if (mut.remove.length > mut.insert.length) {
                // REMOVE: remove slots that were not updated
                let remove_fence_left = fences[mut.index + mut.insert.length];
                let remove_fence_right = fences[mut.index + mut.remove.length];
                assert_fence_continuity(remove_fence_left, remove_fence_right);
                // remove everything in this slot
                while (remove_fence_left.nextSibling != remove_fence_right) {
                    remove_fence_left.nextSibling!.remove();
                }
                remove_fence_right.remove();
                // remove fences from fence array
                fences.splice(mut.index + mut.insert.length + 1, mut.remove.length - mut.insert.length);
            } else if (mut.remove.length < mut.insert.length) {
                // INSERT: add slots that were not updated
                // create the frag with the items and the array of newly created fences
                let frag = document.createDocumentFragment();
                let new_fences = [];
                for (let i = mut.remove.length; i < mut.insert.length; i++) {
                    jsx_apply_children(frag, mut.insert[i] as Nodes);
                    new_fences.push(jsx_apply_node(frag, document.createComment("")));
                }
                // insert the frag into the dom
                let insert_fence_left = fences[mut.index + mut.remove.length];
                insert_fence_left.parentNode!.insertBefore(frag, insert_fence_left.nextSibling)
                // insert fences into fence array
                fences.splice(mut.index + mut.remove.length + 1, 0, ...new_fences);
            }
            return;
            /*
            } else if (child instanceof StateArray && mut.path.length != 0 && typeof mut.path[0] === "number" && FENCES in child) {
                // TODO! handle possible bound issues
                // the mutation happened in one slot of this element
                // i can forward the mutation to be only happen inside the mutated slot
                let fences = child[FENCES] as [Comment, ...Comment[]];
                let index = mut.path[0];
                let update_fence_left = fences[index];
                let update_fence_right = fences[index + 1];
                assert_fence_continuity(update_fence_left, update_fence_right);
                // remove everything in this slot
                while (update_fence_left.nextSibling != update_fence_right) {
                    update_fence_left.nextSibling!.remove();
                }
                let frag = document.createDocumentFragment();
                jsx_apply_children(frag, mut.insert[i - mut.index] as Nodes);
                update_fence_right.parentNode!.insertBefore(frag, update_fence_right);
                throw new Error("TODO! continue here");
            */
        }

        // remove all elements are replace with a complete new render
        while (fence_left.nextSibling != fence_right) {
            fence_left.nextSibling!.remove();
        }
        let frag = document.createDocumentFragment();
        jsx_apply_children(frag, child);
        parent.insertBefore(frag, fence_right);
    });
    jsx_apply_node(elem, frag);
}

function assert_fence_continuity(left: Node, right: Node) {
    if (left.parentNode === null) throw new Error("Stateful jsx mutation handler assertion failed: begin fence was removed");
    if (right.parentNode === null) throw new Error("Stateful jsx mutation handler assertion failed: end fence was removed");
    if (left.parentNode != right.parentNode) throw new Error("Stateful jsx mutation handler assertion failed: fence comments not children of the same parent");
    for (let i: Node = left; i != right; i = i.nextSibling) {
        if (!i.nextSibling) throw new Error("Stateful jsx mutation handler assertion failed: fence comments in incorrect order");
    }
}

// CSS //

export function css(strings: { raw: readonly string[] | ArrayLike<string> }, ...substitutions: any[]) {
    let style = document.createElement("style");
    let first = substitutions[0];
    if (typeof first === "object" && first !== null && "__filename" in first && typeof first["__filename"] === "string" && "__line" in first && typeof first["__line"] === "number") {
        substitutions[0] = "";

        let filename = first["__filename"];
        let line = first["__line"];

        let name = filename.substring(Math.max(filename.lastIndexOf("/"), filename.lastIndexOf("\\")) + 1);

        style.dataset["from"] = name + ":" + line;

        style.innerHTML = add_line_numbers(String.raw(strings, ...substitutions), line, ":" + name + ":" + filename + " ");
    } else {
        style.innerHTML = String.raw.apply(String, arguments as any);
    }
    document.head.appendChild(style);
}

function add_line_numbers(styles: string, lineno: number, header: string): string {
    if (lineno < 0 || !Number.isSafeInteger(lineno)) return styles;
    let width = String(count_lines(styles) + lineno).length;
    let i = -1;
    let lined = "";
    while (true) {
        let n = styles.indexOf("\n", i + 1);
        if (n === -1) {
            lined += "/*" + String(lineno).padStart(width) + header + "*/ " + styles.substring(i + 1);
            break;
        }
        lined += "/*" + String(lineno).padStart(width) + header + "*/ " + styles.substring(i + 1, n + 1);
        i = n;
        header = "";
        lineno++;
    }
    return lined;
}

function count_lines(styles: string): number {
    let count = 0;
    let i = -1;
    while (true) {
        i = styles.indexOf("\n", i + 1);
        if (i === -1) break;
        count++;
    }
    return count;
}

// REF //

export function ref<T extends keyof HTMLElementTagNameMap>(): Ref<HTMLElementTagNameMap[T]>;
export function ref<T>(): Ref<T>;
export function ref<T>(): Ref<T> {
    return new Proxy(Object.create(null), ref_proxy) as Ref<T>;
}

const ref_symbol = Symbol("current");
const ref_proxy: ProxyHandler<{ [ref_symbol]?: any }> = {
    apply(target, thisArg, argArray) {
        if (!(ref_symbol in target)) throw new Error("Ref is not yet initialized");
        return Reflect.apply(target[ref_symbol], thisArg, argArray);
    },
    construct(target, argArray, newTarget) {
        if (!(ref_symbol in target)) throw new Error("Ref is not yet initialized");
        return Reflect.construct(target[ref_symbol], argArray, newTarget);
    },
    defineProperty(target, property, attributes) {
        if (property === "current") return false;
        if (!(ref_symbol in target)) throw new Error("Ref is not yet initialized");
        return Reflect.defineProperty(target[ref_symbol], property, attributes);
    },
    deleteProperty(target, p) {
        if (p === "current") return delete target[ref_symbol];
        if (!(ref_symbol in target)) throw new Error("Ref is not yet initialized");
        return Reflect.deleteProperty(target[ref_symbol], p);
    },
    get(target, p, _receiver) {
        if (p === "current") return ref_symbol in target ? target[ref_symbol] : null;
        if (!(ref_symbol in target)) throw new Error("Ref is not yet initialized");
        let value = Reflect.get(target[ref_symbol], p, target[ref_symbol]);
        return typeof value === "function" ? value.bind(target[ref_symbol]) : value;
    },
    getOwnPropertyDescriptor(target, p) {
        if (!(ref_symbol in target)) throw new Error("Ref is not yet initialized");
        return Reflect.getOwnPropertyDescriptor(target[ref_symbol], p);
    },
    getPrototypeOf(target) {
        if (!(ref_symbol in target)) return null;
        return Reflect.getPrototypeOf(target[ref_symbol]);
    },
    has(target, p) {
        if (!(ref_symbol in target)) throw new Error("Ref is not yet initialized");
        return Reflect.has(target[ref_symbol], p);
    },
    isExtensible(target) {
        if (!(ref_symbol in target)) throw new Error("Ref is not yet initialized");
        return Reflect.isExtensible(target[ref_symbol]);
    },
    ownKeys(target) {
        if (!(ref_symbol in target)) throw new Error("Ref is not yet initialized");
        return Reflect.ownKeys(target[ref_symbol]);
    },
    preventExtensions(target) {
        if (!(ref_symbol in target)) throw new Error("Ref is not yet initialized");
        return Reflect.preventExtensions(target[ref_symbol]);
    },
    set(target, p, newValue, _receiver) {
        if (p === "current") {
            if (typeof newValue == "object") {
                target[ref_symbol] = newValue;
                return true;
            } else {
                throw new Error("Ref can only be initialized to an object or null");
            }
        }
        if (!(ref_symbol in target)) throw new Error("Ref is not yet initialized");
        return Reflect.set(target[ref_symbol], p, newValue, target[ref_symbol]);
    },
    setPrototypeOf(target, v) {
        if (!(ref_symbol in target)) throw new Error("Ref is not yet initialized");
        return Reflect.setPrototypeOf(target[ref_symbol], v);
    },
};
