import { Derived } from "rubedo";
import { client } from "../client";

export default function Podium({}: {}) {
    return (
        <div>
            Podium
            <div style={{ fontSize: "xx-large" }}>
                Pontos:
                <br />
                Time vermelho: {Derived.prop(client.points, "0")}
                <br />
                Time azul: {Derived.prop(client.points, "1")}
            </div>
            {client.isHost && (
                <>
                    <br />
                    <br />
                    <button onClick={lobby}>Ir para o ínicio</button>
                </>
            )}
        </div>
    );
    function lobby() {
        client.send({ cmd: "Room", room: "lobby" });
    }
}