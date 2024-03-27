////////////////////////////////
// biblioteca LEVI 2024-03-25 //
// kernel32dev@gmail.com      //
// github.com/kernel32dev     //
// por favor não remova, :D   //
////////////////////////////////

import "./extension";
import * as JSX from "./jsx";
import * as SIGNAL from "./signal";
import * as STATE from "./state";

declare global {
    var jsx: typeof JSX.jsx;
    var css: typeof JSX.css;
    var ref: typeof JSX.ref;

    interface View extends JSX.View {}
    type Ref<T> = JSX.Ref<T>;
    type PropsElem = JSX.PropsElem;
    type PropsSVG = JSX.PropsSVG;
    type PropsAs<T> = JSX.PropsAs<T>;
    type PropsOf<T extends keyof React.JSX.IntrinsicElements> = JSX.PropsOf<T>;
    type PropsOfClass<T extends abstract new (props: any) => any> = JSX.PropsOfClass<T>;
    type Elems = JSX.Elems;
    type Nodes = JSX.Nodes;
    type Classes = JSX.Classes;
    type Style = JSX.Style;
    type OrState<T> = STATE.OrState<T>;

    var CustomHTMLElement: typeof JSX.CustomHTMLElement;
    var Signal: typeof SIGNAL.Signal;
    var State: typeof STATE.State;
    var Mutation: typeof STATE.Mutation;
    var StateObject: typeof STATE.StateObject;
    var ObjectMutation: typeof STATE.ObjectMutation;
    var StateArray: typeof STATE.StateArray;
    var ArrayMutation: typeof STATE.ArrayMutation;

    interface CustomHTMLElement extends JSX.CustomHTMLElement {}
    type Signal = SIGNAL.Signal;
    interface State<T> extends STATE.State<T> {}
    interface Mutation extends STATE.Mutation {}
    interface StateObject extends STATE.StateObject {}
    interface ObjectMutation extends STATE.ObjectMutation {}
    interface StateArray<T> extends STATE.StateArray<T> {}
    interface ArrayMutation extends STATE.ArrayMutation {}

    var __line: number; //babel-plugin-transform-line
}

globalThis.jsx = JSX.jsx;
globalThis.css = JSX.css;
globalThis.ref = JSX.ref;
globalThis.CustomHTMLElement = JSX.CustomHTMLElement;
globalThis.Signal = SIGNAL.Signal;
globalThis.State = STATE.State;
globalThis.Mutation = STATE.Mutation;
globalThis.StateObject = STATE.StateObject;
globalThis.ObjectMutation = STATE.ObjectMutation;
globalThis.StateArray = STATE.StateArray;
globalThis.ArrayMutation = STATE.ArrayMutation;