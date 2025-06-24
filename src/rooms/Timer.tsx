import { Derived, Effect, State } from "rubedo";
import "./Timer.css";
import { Scope } from "rubedo-dom";
import { client } from "../client";

export const timerEnd = new State(function(){
    const x = Number(localStorage.getItem("timer_end") || NaN);
    return Number.isNaN(x) ? undefined : x;
}());

new Effect.Persistent(() => {
    const value = timerEnd();
    if (value === undefined) {
        localStorage.removeItem("timer_end");
    } else {
        localStorage.setItem("timer_end", String(value));
    }
})

export default function Timer({ position }: { position: "top-left" | "bottom-center"}) {
    if (!client.isHost) return <></>;
    const triggered = new State(false);
    const scope = new Scope().affect(() => {
        const end = timerEnd();
        if (!triggered() && (end !== undefined && Derived.Date.isPast(end))) Derived.now(() => {
            triggered.set(true);
            timerEnd.set(undefined);
            nextRoom();
        });
    });
    return (
        <div class={"timer " + position} scope={scope}>
            Tempo:
            <br />
            {new Derived(() => msToTimer((timerEnd() || NaN) - Derived.Date.clock().getTime()))}
            <br />
            <button onClick={() => timerEnd.mut(x => x && Math.max(Date.now(), x) - 10_000)}>
                -10s
            </button>
            &nbsp;
            <button onClick={() => timerEnd.mut(x => x && Math.max(Date.now(), x) + 10_000)}>
                +10s
            </button>
            <br />
            <button onClick={() => {
                if (timerEnd() === undefined) {
                    nextRoom();
                } else {
                    timerEnd.set(Date.now());
                }
            }}>
                Próximo
            </button>
            <br />
            <br />
            Pontos:
            <br />
            Time vermelho: {Derived.prop(client.points, "0")}
            <br />
            Time azul: {Derived.prop(client.points, "1")}
        </div>
    );
}

function msToTimer(ms: number) {
    if (ms <= 0 || Number.isNaN(ms)) return "0:00";
    return Math.floor(ms / 60_000) + ':' + `0${Math.floor(ms * 0.001) % 60}`.slice(-2);
}

function nextRoom() {
    if (client.room.now() == "quiz") {
        client.send({ cmd: "Room", room: "words_intro" });
    }
    if (client.room.now() == "words") {
        client.send({ cmd: "Room", room: "podium" });
    }
}