////////////////////////////////
// biblioteca LEVI 2024-03-25 //
// kernel32dev@gmail.com      //
// github.com/kernel32dev     //
// por favor não remova, :D   //
////////////////////////////////

export type SignalHandler<T> = { bivariance(param: T): void }["bivariance"];

/** signals are functions that accept one value and have many handlers called, which are invoked when the function is called */
export type Signal<T = unknown> = {
    (param: T): void;
    /** adds a handler to be called when the signal is triggered */
    on(handler: (value: T) => void): void;
    /** removes a handler from the signal */
    rm(handler: (value: T) => void): void;
    /** the array that stores all the handlers, of this signal */
    handlers: SignalHandler<T>[];
};

export function Signal<T = unknown>(...handlers: SignalHandler<T>[]): Signal<T> {
    return Object.assign(signal, { handlers, on, rm });
    function signal(param: T) {
        let handlers = Array.from((signal as any).handlers) as { (param: T): void }[];
        for (let handler of handlers) {
            handler(param);
        }
    }
}

function on<T>(this: {
    handlers: { (value: T): void }[]
}, handler: (value: T) => void) {
    if (this.handlers.indexOf(handler) == -1) {
        this.handlers.push(handler);
    }
}

function rm<T>(this: {
    handlers: { (value: T): void }[]
}, handler: (value: T) => void) {
    let index = this.handlers.indexOf(handler);
    if (index != -1) this.handlers.splice(index, 1);
}
