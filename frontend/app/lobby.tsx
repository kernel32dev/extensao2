import * as socket from "./socket";
import { state } from "./game";

export function LobbyPage(): Elems {
    const game = state.value!;
    return <>
        <div>TODO! LobbyPage</div>
        {
            game.player &&
            <label>
                Mudar seu nome:
                <input type="text" onKeyDown={detect_enter} value={game.player!.name} />
            </label>
        }
        <ul>
            {game.players.thenMap(x => <li>{x.name}</li>)}
        </ul>
    </>
    function detect_enter(this: HTMLInputElement, e: KeyboardEvent) {
        if (e.key === "Enter") {
            socket.send({ cmd: "SetName", name: this.value });
        }
    }
}
