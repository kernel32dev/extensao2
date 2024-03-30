import "./app.css";
import { HomePage } from "./home";
import { LobbyPage } from "./lobby";

const pages = {
    "home": HomePage,
    "lobby": LobbyPage,
};

const first_page: keyof typeof pages = "home";

export const active_page = new State<keyof typeof pages>(first_page);

export function App(): Elems {
    return <>{active_page.then(x => pages[x]())}</>;
}
