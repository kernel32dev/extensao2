////////////////////////////////
// biblioteca LEVI 2024-03-25 //
// kernel32dev@gmail.com      //
// github.com/kernel32dev     //
// por favor não remova, :D   //
////////////////////////////////

export {};

declare global {
    interface Array<T> {
        /** searches for item T in the array with the semantics of indexOf (strict equality)
         *
         * removes that item and returns its former index, if it is not found, returns -1
         *
         * method added by the jsx runtime */
        remove(item: T, fromIndex?: number): number;
        /**
         * does the same as the map function of the array but handles stateful arrays in a special way
         *
         * if this is a stateful array, returns a stateful array that updates automatically with the values of the original
         *
         * when the values of the original array change, the map function is called on the added values
         *
         * method added by the jsx runtime */
        thenMap<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
    }
    interface Element {
        /** finds the first ancestor of an element that passes a filter
         *
         * this element is included in the search
         *
         * method added by the jsx runtime */
        findParent(filter: (x: Element) => boolean): Element | null;
        /** traverses the tree forward and returns the first element that passes a filter
         *
         * this element is not included in the search
         *
         * if root is not undefined, the search will only occour inside the children of root, defaults to this element
         *
         * method added by the jsx runtime */
        findForward(filter: (x: Element) => boolean, root?: Element | null): Element | null;
        /** traverses the tree forward and focuses on the first element that can get focus
         *
         * this element is not included in the search
         *
         * if root is not undefined, the search will only occour inside the children of root, defaults to this element
         *
         * @param includeNonTabbable - when set to true elements that cannot be reached via the tab key will also be elligible to be focused, defaults to false
         *
         * method added by the jsx runtime */
        focusForward(includeNonTabbable?: boolean, root?: Element | null): HTMLElement | null;
    }
    interface CustomElementRegistry {
        /** registers custom element constructors as autonomous custom elements
         *
         * the name for the element is derived from key on the object, this way of registering allows minification of the name of the class without affecting the name that will be registered
         *
         * names are expected to be in `CamelCase` which will be converted to `kebab-case`
         *
         * if the resulting kebab case name has no hyphen, the prefix `"custom-"` will be added, this is done because it is required that custom elements have at least one hyphen in their name
         *
         * method added by the jsx runtime */
        register(classes: Record<string, CustomElementConstructor>): void;
    }
}

Array.prototype.remove = remove;
Array.prototype.thenMap = Array.prototype.map;
Element.prototype.findParent = findParent;
Element.prototype.findForward = findForward;
Element.prototype.focusForward = focusForward;
CustomElementRegistry.prototype.register = register;

function remove<T>(this: T[], item: T, fromIndex?: number): number {
    let index = this.indexOf(item, fromIndex);
    if (index != -1) this.splice(index, 1);
    return index;
}

function findParent(this: Element, filter: (elem: Element) => boolean): Element | null {
    let target: Element | null = this;
    while (target !== null) {
        if (filter(target)) return target;
        target = target.parentElement;
    }
    return null;
}

function findForward(this: Element, filter: (elem: Element) => boolean, root?: Element | null): Element | null {
    let i: Element | null = this;
    if (root === undefined) root = this;
    do {
        if (i.firstElementChild) {
            i = i.firstElementChild;
        } else {
            while (i.nextElementSibling == null) {
                i = i.parentElement;
                if (i == root || i == null) return null;
            }
            i = i.nextElementSibling;
        }
    } while (!filter(i));
    return i;
}

function focusForward(this: Element, includeNonTabbable?: boolean, root?: Element | null): HTMLElement | null {
    return this.findForward(x => {
        if (x instanceof HTMLElement) {
            if (!includeNonTabbable) {
                let tabindex = x.getAttribute("tabindex");
                if (tabindex !== null && tabindex.startsWith("-")) {
                    return false;
                }
            }
            x.focus();
            return document.activeElement == x;
        }
        return false;
    }, root) as HTMLElement | null;
}

function register(classes: Record<string, CustomElementConstructor>) {
    for (let key of Object.keys(classes)) {
        let name = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        if (name.indexOf("-") == -1) {
            name = "custom-" + name;
        }
        customElements.define(name, classes[key]);
    }
}
