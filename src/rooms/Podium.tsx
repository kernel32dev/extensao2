import "./Podium.css";
import { Derived } from "rubedo";
import { client } from "../client";
import Confetti from "./Confetti";
import Points from "./Points";

export default function Podium({ }: {}) {
    const scope = () => {
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        return () => {
            document.documentElement.style.overflow = "";
            document.body.style.overflow = ""
        };
    };
    const leaderboard_players = new Derived(() => {
        return Array.from(client.players).sort((a, b) => b.points - a.points || b.cid - a.cid).filter(x => x.points != 0);
    });
    const leaderboard = new Derived(() => {
        const players = leaderboard_players();
        console.log(players);
        const frag = document.createDocumentFragment();
        for (const player of players) {
            if (!player.points) break;
            frag.append(
                <br />,
                <span class={player.team ? "yellow" : "green"}>&#9679;</span>,
                player.points === 1
                    ? `(${player.points} pontos) - ${player.name}`
                    : `(1 ponto) - ${player.name}`
            );
        }
        return frag;
    });
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
            &nbsp;
            &nbsp;
            &nbsp;
            <div style={{ whiteSpace: "nowrap", fontSize: "large" }}>
                {new Derived(() => leaderboard_players().length ? "Maiores contribuidores:" : "")}
                {leaderboard}
            </div>
        </div>
    );
    function lobby() {
        client.send({ cmd: "Room", room: "lobby" });
    }
}