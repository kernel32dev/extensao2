////////////////////////////////
// biblioteca LEVI 2024-03-25 //
// kernel32dev@gmail.com      //
// github.com/kernel32dev     //
// por favor não remova, :D   //
////////////////////////////////

// SYMBOLS //

/** an array that stores the owners of this object and the handlers for when this object changes
 *
 * in a sense its the array of all the things to trigger when this object changes */
const sym_triggers = Symbol("State.triggers");
/** the value of this stateful object
 *
 * for `State` objects this stores the current value, wrapped in a proxy if possible
 *
 * for `StateProxy` objects this stores the value's proxy, useful for not creating redundant proxies */
const sym_value = Symbol("State.value");
/** the orginal unwrapped value of this state proxy, only present on proxies */
const sym_target = Symbol("State.target");

// STATE //

/** meta information for state management, used by StateProxy objects with proxies and instances of the State class */
type StateMeta<T> = {
    [sym_triggers]: Trigger<T>[],
};

/** an object that is wrapped in a proxy */
type StateProxy<T extends object> = T & StateMeta<T> & {
    [sym_value]: StateProxy<T>,
    [sym_target]: T,
};

export type OrState<T> = T | State<T>;

export class State<T> {
    [sym_triggers]!: Trigger<T>[];
    [sym_value]!: WrapState<T>;
    constructor(object: T | State<T>) {
        if (object instanceof State) return object;
        this[sym_triggers] = [];
        this[sym_value] = wrap(object, { owner: this, key: "value" });
    }
    get value(): T {
        return this[sym_value];
    }
    set value(v: T) {
        mutate_obj(this, v);
    }
    /** adds a handler to be called when this state changes */
    on(handler: Handler<T>) {
        let handlers = this[sym_triggers];
        if (handlers.indexOf(handler) == -1) handlers.push(handler);
    }
    /** adds a handler to be called when this state changes, and calls it immedialty */
    do(handler: Handler<T>) {
        let handlers = this[sym_triggers];
        if (handlers.indexOf(handler) == -1) handlers.push(handler);
        handler(this[sym_value], new ObjectMutation(this, ["value"]));
    }
    then<U>(handler: Handler<T, U>): State<U> {
        // TODO!
        let derived = new State(handler(this[sym_value], new Mutation()));
        this[sym_triggers].push((x, mut) => {
            mutate_obj(derived, handler(this[sym_value], mut));
        });
        return derived;
    }
    thenMap<U>(callbackfn: (value: T extends any[] ? T[number] : never, index: number, array: T) => U, thisArg?: any): State<U[]> {
        let mapped_state = new State((this[sym_value] as T & any[]).map(callbackfn as any, thisArg)) as State<U[]>;
        this[sym_triggers].push((source, mut) => {
            let mapped = mapped_state[sym_value];
            if (!Array.isArray(source)) {
                mapped.splice(0, mapped.length);
            } else if (mut instanceof ArrayMutation && mut.path.length === 0) {
                let insert = Array(mut.insert.length);
                for (let i = 0; i < insert.length; i++) {
                    insert[i] = callbackfn.call(thisArg, source[i + mut.index], i + mut.index, source);
                }
                mapped.splice(mut.index, mut.remove.length, ...insert as U[]);
            } else if (typeof mut.path[0] === "number") {
                let index = mut.path[0];
                let insert = callbackfn.call(thisArg, source[index], index, source);
                mapped.splice(index, 1, insert);
            } else {
                let insert = Array(source.length);
                for (let i = 0; i < source.length; i++) {
                    insert[i] = callbackfn.call(thisArg, source[i], i, source);
                }
                mapped.splice(0, mapped.length, ...insert as U[]);
            }
        });
        return mapped_state;
    }
    /** removes a handler that was added with `on` or `do` */
    dont(handler: Handler<T>) {
        let handlers = this[sym_triggers];
        let index = handlers.indexOf(handler);
        if (index == -1) handlers.splice(index, 1);
    }
    /** if empty is true, triggers with an empty mutation
     *
     * if empty is false, triggers with an object mutation, with identical old and new properties */
    trigger(empty = true) {
        let mut;
        if (empty) {
            mut = new Mutation(["value"]);
        } else {
            mut = new ObjectMutation(this, ["value"]);
            mut.old = this[sym_value];
            mut.new = this[sym_value];
        }
        trigger(this, mut);
    }
    valueOf() {
        return this[sym_value];
    }
    toString() {
        let value = this[sym_value];
        if (value === null) return "null";
        if (value === undefined) return "undefined";
        return value.toString();
    }
    toJSON() {
        return {value: this[sym_value]};
    }

    /** adds a handler to a number of stateful objects
     *
     * also accepts plain values in place of stateful objects and forwards them to the handler */
    static on<T extends unknown[]>(...states_and_handler: [...T, (...states: UnwrapStateObjects<T>) => void]) {
        if (states_and_handler.length <= 1) return;
        let handler = states_and_handler.pop();
        let states = states_and_handler as unknown as T;
        let joined_handler = () => {
            let values = states.map(unwrap_obj) as UnwrapStateObjects<T>;
            (handler as (...states: UnwrapStateObjects<T>) => void).apply(globalThis, values);
        };
        for (let i = 0; i < states.length; i++) {
            let state = states[i];
            if (typeof state === "object" && state !== null && sym_triggers in state) {
                let triggers = state[sym_triggers] as Trigger<T>[];
                triggers.push(joined_handler);
            }
        }
    }

    /** adds a handler to a number of stateful objects, and immediatly calls the handler
     *
     * also accepts plain values in place of stateful objects and forwards them to the handler */
    static do<T extends unknown[]>(...states_and_handler: [...T, (...states: UnwrapStateObjects<T>) => void]) {
        if (states_and_handler.length <= 1) {
            return states_and_handler.length == 1 ? (states_and_handler[0] as () => void)() : undefined;
        }
        let handler = states_and_handler.pop() as ((...states: UnwrapStateObjects<T>) => void);
        let states = states_and_handler as unknown as T;
        let joined_handler = () => {
            let values = states.map(unwrap_obj) as UnwrapStateObjects<T>;
            handler.apply(globalThis, values);
        };
        for (let i = 0; i < states.length; i++) {
            let state = states[i];
            if (typeof state === "object" && state !== null && sym_triggers in state) {
                let triggers = state[sym_triggers] as Trigger<T>[];
                triggers.push(joined_handler);
            }
        }
        joined_handler();
    }

    /** derives a new state a number of stateful object, which automatically updates when the states used changes,
     *
     * also accepts plain values in place of stateful objects and forwards them to the handler */
    static then<T extends unknown[], U>(...states_and_handler: [...T, (...states: UnwrapStateObjects<T>) => U]): State<U> {
        if (states_and_handler.length === 0) return new State(undefined as U);
        let handler = states_and_handler.pop() as ((...states: UnwrapStateObjects<T>) => void);
        // TODO!
        let then = new State(undefined as U);
        let states = states_and_handler as unknown as T;
        let joined_handler = () => {
            let values = states.map(unwrap_obj) as UnwrapStateObjects<T>;
            mutate_obj(then, (handler as (...states: UnwrapStateObjects<T>) => U).apply(globalThis, values));
        };
        for (let i = 0; i < states.length; i++) {
            let state = states[i];
            if (typeof state === "object" && state !== null && sym_triggers in state) {
                let triggers = state[sym_triggers] as Trigger<T>[];
                triggers.push(joined_handler);
            }
        }
        joined_handler();
        return then;
    }

    /** removes a handler from a state added with `on` or `do`, if it is a state and has the handler */
    static dont<T>(state: T | State<T>, handler: Handler<T>) {
        if (typeof state !== "object" || state === null || !(sym_triggers in state)) return;
        let triggers = state[sym_triggers];
        let index = triggers.indexOf(handler);
        if (index == -1) triggers.splice(index, 1);
    }

    /** wraps an object in state management, returns a proxy to the original object
     *
     * when you put a plain object in a stateful object, the plain object is automatically wrapped in a proxy before entering the stateful object
     *
     * this means that if you try to read the object again, it wont be the same the object anymore
     *
     * ```js
     * let plain = {};
     * let state = new State<object[]>([]);
     * state.value.push(plain);
     * console.log(state.value[0] == plain); // false
     * ```
     *
     * to solve this, call State.obj when creating the plain object,
     * this will return newly created object wrapped in a proxy, and then the state wont wrap it again when entering a stateful object, making comparisons work as you would expect
     *
     * ```js
     * let plain = State.obj({}); // added call to State.obj here
     * let state = new State<object[]>([]);
     * state.value.push(plain);
     * console.log(state.value[0] == plain); // true
     * ```
     */
    static obj<T extends object>(value: T): T {
        return wrap(value, null);
    }

    /** if value is a state returns that state's value, otherwise returns value */
    static read<T>(value: T): UnwrapStateObject<T> {
        return unwrap_obj(value);
    }

    /** if object is a proxy wrapped stateful object, bypasses the proxy sets the property of an object without activating triggers, will still call setters
     *
     * if object is a state and key is "value", will change the value of a state without activating triggers
     *
     * otherwise sets the value normally */
    static silent_set<T, U extends keyof T>(object: T, key: U, value: T[U]) {
        if (object instanceof State) {
            if (key === "value") {
                object[sym_value] = value;
                return;
            }
        } else if (typeof object === "object" && object !== null && sym_target in object) {
            (object[sym_target] as T)[key] = value;
            return;
        }
        object[key] = value;
    }
    /** if object is a proxy wrapped stateful object, bypasses the proxy deletes the property of an object without activating triggers
     *
     * otherwise sets the value normally */
    static silent_delete<T>(object: T, key: keyof T) {
        if (typeof object === "object" && object !== null && sym_target in object) {
            delete (object[sym_target] as T)[key];
        } else {
            delete object[key];
        }
    }
}

// WRAPPING //

// implementation note:  this incorrectly wraps all objects with a `StateProxy` as only plain objects and arrays are wrapped
// however this is irrelevant to outside the state module, as no state apis are supposed to expect proxies explicitly
/** the output of wrapping a value with state information,
 *
 * does nothing if already has state information
 *
 * makes into a stateful if it is an object */
type WrapState<T> = T extends StateMeta<any> ? T : T extends object ? StateProxy<T> : T;

// implementation note: altough StateMeta only defines the sym_triggers property and cannot store a value,
// we assume individual state implementations are able to be unwrapped to a usable value
/** the output of unwrapping a state to get its value */
type UnwrapStateProxy<T> = T extends StateMeta<infer U> ? U : T;

/** gets the value of T, only if T is a State object, if T is a State proxy does nothing, unlike UnwrapStateProxy */
type UnwrapStateObject<T> = T extends State<infer U> ? U : T;

/** same as UnwrapStateObject but with an array of values */
type UnwrapStateObjects<T extends any[]> = { [P in keyof T]: UnwrapStateObject<T[P]> };

/** if not already wrapped, wraps an object in a state observing proxy, and adds a new ownership entry if not already present */
function wrap<T>(value: T, ownership: Ownership | null): WrapState<T> {
    if (typeof value !== "object" || value === null) {
        return value as WrapState<T>;
    }
    if (value instanceof State) {
        if (ownership !== null) adopt(value, ownership);
        return value as WrapState<T>;
    }
    if (sym_triggers in value) {
        let state = value as StateProxy<T & object>;
        if (ownership !== null) adopt(state, ownership);
        return state[sym_value] as WrapState<T>;
    }
    let proxy_handler: ProxyHandler<any>;
    if (Array.isArray(value)) {
        Object.setPrototypeOf(value, StateArray.prototype);
        proxy_handler = StateArrayProxyHandler;
    } else if (value instanceof StateObject || Object.getPrototypeOf(value) === Object.prototype) {
        proxy_handler = StateObjectProxyHandler;
    } else {
        return value as WrapState<T>;
    }
    let proxy = new Proxy(value, proxy_handler) as StateProxy<T & object>;

    let descriptors = Object.getOwnPropertyDescriptors(value) as object & { [x: string | symbol]: PropertyDescriptor };
    let keys_string = Object.getOwnPropertyNames(descriptors);
    let keys_symbol = Object.getOwnPropertySymbols(descriptors);

    Object.defineProperty(value, sym_triggers, { value: ownership === null ? [] : [ownership] });
    Object.defineProperty(value, sym_value, { value: proxy, writable: true });
    Object.defineProperty(value, sym_target, { value: value });

    for (let i = 0; i < keys_string.length; i++) {
        let key_string = keys_string[i];
        let descriptor = descriptors[key_string];
        if ("value" in descriptor) {
            (value as any)[key_string] = wrap(descriptor.value, { owner: value as StateProxy<T & object>, key: key_string });
        }
    }
    for (let i = 0; i < keys_symbol.length; i++) {
        let key_symbol = keys_symbol[i];
        let descriptor = descriptors[key_symbol];
        if ("value" in descriptor) {
            (value as any)[key_symbol] = wrap(descriptor.value, { owner: value as StateProxy<T & object>, key: key_symbol });
        }
    }
    return proxy as WrapState<T>;
}

/** reads the value property of state if it is a state, and gets the target of the proxy if it is a proxy */
function unwrap_proxy<T>(state: T): UnwrapStateProxy<T> {
    return (typeof state === "object" && state !== null && sym_target in state ? state[sym_target] : state) as UnwrapStateProxy<T>;
}

/** reads the value property of state if it is a state */
function unwrap_obj<T>(state: T): UnwrapStateObject<T> {
    return state instanceof State ? state[sym_value] : state as UnwrapStateObject<T>;
}

// TRIGGERING //

/** a function which handles state mutations */
type Handler<T, U = void> = { bivariance(value: T, mut: Mutation): U }["bivariance"];

/** something that needs to be activated whenever state changes, which means calling handlers and cascading calls to owners */
type Trigger<T> = Handler<T> | Ownership;

/** calls all handlers of stateful object, and recursively calls trigger on all owners */
function trigger<T>(state: StateMeta<T>, mut: Mutation) {
    let triggers = state[sym_triggers];
    if (triggers.length === 0) return;

    /** triggers on StateObjs do not expect the path to start with "value", as it is already unwrapped with `unwrap_obj` */
    let is_state_obj_value_mutation = state instanceof State && mut.path[0] === "value";
    if (is_state_obj_value_mutation) (mut.path as unknown[]).shift();

    let copy = Array.from(triggers);
    let length = copy.length;
    let handled = false;
    for (let i = 0; i < length; i++) {
        let handler = copy[i];
        if (typeof handler === "function") {
            mut.handled = true;
            handler(unwrap_obj(state) as T, mut);
            if (mut.handled) handled = true;
        }
    }

    if (is_state_obj_value_mutation) (mut.path as unknown[]).unshift("value");

    if (handled) return;

    let path: unknown[] | null = null;
    for (let i = 0; i < copy.length; i++) {
        let ownership = copy[i];
        if (typeof ownership === "function") continue;
        if (path === null) {
            path = mut.path as unknown[];
            path.unshift(ownership.key);
        } else {
            path[0] = ownership.key;
        }
        trigger(ownership.owner, mut);
    }
    if (path !== null) path.shift();
}

// TODO! use this to allow internal mutations to sym_value without allowing user mutations to a derived state
/** changes an objects value, and activates its triggers */
function mutate_obj<T>(state: State<T>, value: T) {
    let mut = new ObjectMutation(state, ["value"]);
    mut.old = state[sym_value];
    mut.new = value;
    disown(state[sym_value], state, "value");
    state[sym_value] = wrap(value, { owner: state, key: "value" });
    trigger(state, mut);
}

// OWNERSHIP //

/** an object that is stored on the owned object keeping track of an object which has a reference to this */
type Ownership = { owner: StateMeta<unknown>, key: PropertyKey };

function adopt(state: StateMeta<unknown>, ownership: Ownership) {
    let triggers = state[sym_triggers];
    for (let i = 0; i < triggers.length; i++) {
        let trigger = triggers[i];
        if (typeof trigger === "object" && trigger.owner === ownership.owner && key_cmp(trigger.key, ownership.key)) {
            return;
        }
    }
    triggers.push(ownership);
}
function disown(state: unknown, owner: StateMeta<unknown>, key: PropertyKey) {
    if (typeof state === "object" && state !== null && sym_triggers in state) {
        let triggers = state[sym_triggers] as (Handler<unknown> | Ownership)[];
        for (let i = 0; i < triggers.length; i++) {
            let trigger = triggers[i];
            if (typeof trigger === "object" && trigger.owner === owner && key_cmp(trigger.key, key)) {
                triggers.splice(i, 1);
                return;
            }
        }
    }
}

// MUTATION //

export class Mutation {
    /** defaults to true */
    handled: boolean;
    readonly path: readonly unknown[];
    constructor(path: readonly unknown[] = []) {
        this.path = path;
        this.handled = true;
    }
    /** returns true if this a a plain Mutation object with no extra information
     *
     * `new Mutation().empty == true`, `new ArrayMutation(...).empty == false` */
    get empty() {
        return Object.getPrototypeOf(this) == Mutation.prototype;
    }
    /** checks if a mutation is actually a more specific mutation type, returns false  */
    is<T>(contructor: Constructor<T>): this is T {
        return this instanceof contructor;
    }
    /** checks if a mutation is actually a more specific mutation type, returns null if it isnt */
    cast<T>(contructor: Constructor<T>): T | null {
        return this instanceof contructor ? this : null;
    }
    /** asserts that a mutation is actually a more specific mutation type, throws if mutation is not of this type */
    expect<T>(contructor: Constructor<T>): T {
        if (this instanceof contructor) return this;
        throw new Error("mutation expect failed, exepcted " + contructor.name);
    }
}

// OBJECT HANDLING //

export class ObjectMutation extends Mutation {
    object: object;
    old?: unknown;
    new?: unknown;
    constructor(object: object, path: readonly unknown[] = []) {
        super(path);
        this.object = object;
        delete this.old;
        delete this.new;
    }
}

export class StateObject {
    constructor() {
        let state = Object.create(new.target.prototype) as StateProxy<StateObject>;
        let proxy = new Proxy(state, StateObjectProxyHandler);
        state[sym_triggers] = [];
        state[sym_target] = state;
        state[sym_value] = proxy;
        return proxy;
    }
}

const StateObjectProxyHandler: ProxyHandler<StateProxy<object>> = {
    deleteProperty(target, property) {
        // obtain descriptor to check for property type (data or acessor or none)
        let descriptor = Object.getOwnPropertyDescriptor(target, property);
        // if not a data descriptor or a non configurable data descriptor, do nothing
        if (descriptor === undefined || !("value" in descriptor) || descriptor.configurable === false) {
            return Reflect.deleteProperty(target, property);
        }

        // remove the ownership i have over this value
        disown(descriptor.value, target, property);

        // get the proxy to correctly create the mutation object
        let proxy = target[sym_value];
        // prepare mutation object
        let mut = new ObjectMutation(proxy, [property]);
        // descriptor.value is always set, since the descriptor catch above handles non existant values
        // so no need to not set old on absence
        mut.old = descriptor.value;

        let result = Reflect.deleteProperty(target, property);
        trigger(target, mut);
        return result;
    },
    set(target, property, value, _receiver) {
        // do not interfere with sym_value
        if (property === sym_value) {
            return Reflect.set(target, property, value, target);
        }

        // obtain descriptor to check for property type (data or acessor or none)
        // note that get_descriptor gets the first property in the prototype chain,
        // even if the first property is a getter or an unwritable value even if a setter is avaliable down the line,
        // this is the correct behavour as tested with nodejs
        let descriptor = get_descriptor(target, property);
        // if not a setter descriptor, call it
        if (descriptor !== undefined && (!("value" in descriptor) || descriptor.writable === false)) {
            return Reflect.set(target, property, value, target);
        }

        // remove the ownership i have over the old value
        if (descriptor !== undefined) disown(descriptor.value, target, property);

        // wrap the value with state management and set my ownership
        value = wrap(value, { owner: target, key: property });

        // get the proxy to correctly create the mutation object
        let proxy = target[sym_value];
        // prepare mutation object
        let mut = new ObjectMutation(proxy, [property]);
        // the descriptor may not be a data descriptor
        // so only set the old property if actually present
        if (descriptor !== undefined) mut.old = descriptor.value;
        mut.new = value;

        let result = Reflect.set(target, property, value, target);
        trigger(target, mut);
        return result;
    },
    setPrototypeOf(target, v) {
        throw new Error("it is not possible to set the prototype of a stateful object");
    },
};

// ARRAY HANDLING //

export class ArrayMutation extends Mutation {
    target;
    index;
    insert;
    remove;
    constructor(target: StateArray<unknown>, index: number, insert: unknown[], remove: unknown[], path: readonly unknown[] = []) {
        super();
        this.target = target;
        this.index = index;
        this.insert = insert;
        this.remove = remove;
    }
}

export class StateArray<T> extends Array<T> implements StateMeta<StateArray<T>> {
    constructor() {
        let state = Object.setPrototypeOf([], new.target.prototype) as StateProxy<StateArray<T>>;
        let proxy = new Proxy(state, StateArrayProxyHandler) as StateProxy<StateArray<T>>;
        state[sym_triggers] = [];
        state[sym_target] = state;
        state[sym_value] = proxy;
        return proxy;
        super();
    }
    [sym_triggers]!: Trigger<StateArray<T>>[];
    [sym_target]!: StateArray<T>;
    [sym_value]!: StateArray<T>;
    override set length(value: number) {
        if (this.length < value) {
            let old_length = this.length;
            super.length = value;
            trigger(this, new ArrayMutation(this, old_length, Array(value - old_length), []));
        } else if (this.length > value) {
            let removed = this.slice(value);
            super.length = value;
            trigger(this, new ArrayMutation(this, value, [], removed));
        }
    }
    override push(...items: T[]): number {
        let old_length = this.length;
        for (let i = 0; i < items.length; i++) {
            items[i] = wrap(items[i], { owner: this, key: old_length + i });
        }
        let result = super.push.apply(unwrap_proxy(this), items);
        trigger(this, new ArrayMutation(this, old_length, items, []));
        return result;
    }
    override pop(): T | undefined {
        if (this.length == 0) return undefined;
        let popped = super.pop.call(unwrap_proxy(this)) as T;
        trigger(this, new ArrayMutation(this, this.length, [], [popped]));
        return popped;
    }
    override reverse(): T[] & this {
        let removed = this.slice();
        super.reverse.call(unwrap_proxy(this));
        let inserted = this.slice();
        trigger(this, new ArrayMutation(this, 0, inserted, removed));
        return this;
    }
    override copyWithin(target: number, start: number, end?: number | undefined): this {
        let length = this.length;
        if (target < -length) {
            target = 0;
        } else if (target < 0) {
            target = Math.floor(target + length);
        } else if (target > length) {
            target = length;
        } else {
            target = Math.floor(target);
        }
        if (start < -length) {
            start = 0;
        } else if (start < 0) {
            start = Math.floor(start + length);
        } else if (start > length) {
            start = length;
        } else {
            start = Math.floor(start);
        }
        if (end === undefined) {
            end = length;
        } else if (end < -length) {
            end = 0;
        } else if (end < 0) {
            end = Math.floor(end + length);
        } else if (end > length) {
            end = length;
        } else {
            end = Math.floor(end);
        }
        if (end > length - target + start) {
            end = length - target + start;
        }
        let removed = this.slice(target, target - start + end);
        super.copyWithin.call(unwrap_proxy(this), target, start, end);
        let inserted = this.slice(target, target - start + end);
        trigger(this, new ArrayMutation(this, 0, inserted, removed));
        return this;
    }
    override fill(value: any, start?: number | undefined, end?: number | undefined): this {
        let removed = this.slice();
        super.fill.call(unwrap_proxy(this), value, start, end);
        let inserted = this.slice();
        trigger(this, new ArrayMutation(this, 0, inserted, removed));
        return this;
    }
    override shift(): T | undefined {
        if (this.length == 0) return undefined;
        let shifted = super.shift.call(unwrap_proxy(this)) as T;
        trigger(this, new ArrayMutation(this, 0, [], [shifted]));
        return shifted;
    }
    override unshift(...items: any[]): number {
        let old_length = this.length;
        for (let i = 0; i < items.length; i++) {
            items[i] = wrap(items[i], { owner: this, key: old_length + i });
        }
        let result = super.unshift.apply(unwrap_proxy(this), items);
        trigger(this, new ArrayMutation(this, 0, items, []));
        return result;
    }
    override sort(compareFn?: ((a: any, b: any) => number) | undefined): this {
        if (this.length > 1) {
            let removed = this.slice();
            super.sort.call(unwrap_proxy(this), compareFn);
            let inserted = this.slice();
            trigger(this, new ArrayMutation(this, 0, removed, inserted));
        }
        return this;
    }
    override splice(start: number, deleteCount?: number | undefined): T[];
    override splice(start: number, deleteCount: number, ...items: T[]): T[];
    override splice(start: number, deleteCount?: number, ...items: T[]): T[] {
        let length = this.length;
        if (start < -length) {
            start = 0;
        } else if (start < 0) {
            start = Math.floor(start + length);
        } else if (start > length) {
            start = length;
        } else {
            start = Math.floor(start);
        }
        for (let i = 0; i < items.length; i++) {
            items[i] = wrap(items[i], { owner: this, key: length + i });
        }
        let removed = super.splice.call(unwrap_proxy(this), start, deleteCount || 0, ...items);
        trigger(this, new ArrayMutation(this, start, items, removed));
        return removed;
    }

    override thenMap<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[] {
        let mapped = wrap(super.map.call(unwrap_proxy(this), callbackfn, thisArg), null) as StateArray<U>;
        this[sym_triggers].push((state, mut) => {
            if (mut instanceof ArrayMutation && mut.target === state) {
                for (let i = mut.index; i < mut.index + mut.insert.length; i++) {
                    mut.insert[i] = callbackfn.call(thisArg, state[i], i, state);
                }
                mapped.splice(mut.index, mut.remove.length, ...mut.insert as U[]);
            }
        });
        return mapped;
    }
}

const StateArrayProxyHandler: ProxyHandler<StateArray<unknown>> = {
    deleteProperty(target, property) {
        // obtain descriptor to check for property type (data or acessor or none)
        let descriptor = Object.getOwnPropertyDescriptor(target, property);
        // if not a data descriptor or a non configurable data descriptor, do nothing
        if (descriptor === undefined || !("value" in descriptor) || descriptor.configurable === false) {
            return Reflect.deleteProperty(target, property);
        }

        // get the proxy to correctly create the mutation objects
        let proxy = target[sym_value];

        // remove the ownership i have over this value
        disown(descriptor.value, target, property);

        // prepare mutation object
        let mut;
        let index = as_index(property);
        if (index === undefined) {
            // property being deleted is not an index, emit a generic object mutation
            mut = new ObjectMutation(proxy, [property]);
            // descriptor.value is always set, since the descriptor catch above handles non existant values
            // so no need to not set old on absence
            mut.old = descriptor.value;
        } else {
            // property is an index, emit an array mutation
            // note the careful handling of array emptys below
            // on the inserted parameter we pass an array with one empty, representing the value that was removed
            // on the removed parameter we pass a the item removed,
            //     since here cannot be reached, if target[index] is empty, we simply get the target[index] without handling empty cases
            mut = new ArrayMutation(proxy, index, Array(1), [target[index]]);
        }

        let result = Reflect.deleteProperty(target, property);
        trigger(target, mut);
        return result;
    },
    set(target, property, value, _receiver) {
        // obtain descriptor to check for property type (data or acessor or none)
        // note that get_descriptor gets the first property in the prototype chain,
        // even if the first property is a getter or an unwritable value even if a setter is avaliable down the line,
        // this is the correct behavour as tested with nodejs
        let descriptor = get_descriptor(target, property);
        // if not a setter descriptor, call it
        if (descriptor !== undefined && (!("value" in descriptor) || descriptor.writable === false)) {
            return Reflect.set(target, property, value, target);
        }

        // get the proxy to correctly create the mutation objects
        let proxy = target[sym_value];

        // remove the ownership i have over the old value
        if (descriptor !== undefined) disown(descriptor.value, target, property);

        // wrap the value with state management and set my ownership
        value = wrap(value, { owner: target, key: property });

        // prepare mutation object
        let mut;
        let index = as_index(property);
        // note the careful handling of the empty slots of arrays below
        if (index === undefined) {
            // property being deleted is not an index, emit a generic object mutation
            mut = new ObjectMutation(proxy, [property]);
            // the descriptor may not be a data descriptor
            // so only set the old property if actually present
            if (descriptor !== undefined) mut.old = descriptor.value;
            mut.new = value;
        } else if (descriptor !== undefined) {
            // property is an index, and we are not overwriting an empty, emit an array mutation
            // on the removed parameter we pass a the item removed,
            //     since here cannot be reached, if target[index] is empty, we simply get the target[index] without handling empty cases
            mut = new ArrayMutation(proxy, index, [value], [descriptor.value]);
        } else if (index < target.length) {
            // property is an index, and we are overwriting an empty, emit an array mutation
            mut = new ArrayMutation(proxy, index, [value], Array(1));
        } else if (index === target.length) {
            // property is an index, and we are extending lenght by exactly one, equivalent to a push
            mut = new ArrayMutation(proxy, index, [value], []);
        } else {
            // property is an index, and we are extending lenght, emit an array mutation
            // here inserted is the array of the value that was written and all the slots that were created as a result of this operation
            // note how no slots were removed, unlike in the case above
            let inserted = Array(index - target.length + 1);
            inserted[inserted.length - 1] = value;
            mut = new ArrayMutation(proxy, index, inserted, []);
        }

        let result = Reflect.set(target, property, value, target);
        trigger(target, mut);
        return result;
    },
    setPrototypeOf(target, v) {
        throw new Error("it is not possible to set the prototype of a stateful object");
    },
};

// UTILITIES //

/** a constructor function that creates instances of T */
type Constructor<T> = { new(...args: unknown[]): T, prototype: T };

function key_cmp(a: PropertyKey, b: PropertyKey): boolean {
    return a === b || (typeof a !== typeof b && typeof a !== "symbol" && typeof b !== "symbol" && String(a) === String(b));
}
function as_index(key: PropertyKey): number | undefined {
    if (typeof key !== "string" && typeof key !== "number") return undefined;
    key = Number(key);
    return key >= 0 && Number.isSafeInteger(key) ? key : undefined;
}
function get_descriptor(object: object, key: PropertyKey): PropertyDescriptor | undefined {
    while (true) {
        let descriptor = Object.getOwnPropertyDescriptor(object, key);
        if (descriptor !== undefined) return descriptor;
        let prototype = Object.getPrototypeOf(object) as object | null;
        if (prototype === null) return undefined;
        object = prototype;
    }
}

