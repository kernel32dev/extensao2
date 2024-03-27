/// <reference types="../shared/types.d.ts" />
import "./lib/levi/global";
import { App } from "./app/app";

document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(App());
});
