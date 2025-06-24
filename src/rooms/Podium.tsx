import "./Podium.css";
import { Derived } from "rubedo";
import { client } from "../client";
import Confetti from "./Confetti";
import Points from "./Points";

export default function Podium({ }: {}) {
    const scope = () => {
        document.body.style.overflow = "hidden";
        return () => document.body.style.overflow = ""
    };
    return (
        <div class="podium-screen" scope={scope}>
            <Confetti count={90} team={new Derived(() => {
                if (client.points[0] == client.points[1]) return undefined;
                const winning_team = client.points[0] < client.points[1];
                if (!client.isHost && winning_team === !client.me().team) return undefined;
                return winning_team;
            })} />
            <div style={{ fontSize: "xx-large" }}>
                <Points />
                {client.isHost && (
                    <>
                        <br />
                        <button onClick={lobby}>Ir para o ínicio</button>
                    </>
                )}
            </div>
        </div>
    );
    function lobby() {
        client.send({ cmd: "Room", room: "lobby" });
    }
}