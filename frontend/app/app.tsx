import "./app.css";
import { game } from "./game";
import { HomePage } from "./home_page";
import { LobbyPage } from "./lobby_page";

export function App(): Elems {
    return <>{
        game.then(x =>
            !x.connected
            // enquanto não tiver conectado, mostra a página principal
            ? HomePage()
            // quando tiver conectado, mostra a página com os jogadores
            : LobbyPage()
        )
    }</>;
}
