import { client } from "../client";
import "./WordsIntro.css";
// import Words from "./Words.json";
import { timerEnd } from "./Timer";
import { Derived } from "rubedo";
export default function WordsIntro() {
    return (
        <div class="words-intro-screen">
            <h1>Caça Palavras</h1>
            Tente encontrar as palavras antes do time inimigo
            <br />
            <br />
            Cada palavra dá três pontos, o time que encontrar a palavra primeiro fica com ela
            <br />
            <br />
            Apenas uma pessoa precisa pegar a palavra
            <br />
            <br />
            Todo mundo está olhando para o mesmo jogo
            <br />
            <br />
            Para pegar uma palavra, selecione a primeira letra e então toque na a última
            <br />
            {client.isHost && (
                <>
                    <br />
                    <br />
                    <button onClick={start}>Começar</button>
                </>
            )}
            <br />
            <div style={{ fontSize: "xx-large" }}>
                Pontos:
                <br />
                Time verde: {Derived.prop(client.points, "0")}
                <br />
                Time amarelo: {Derived.prop(client.points, "1")}
            </div>
        </div>
    );
    function start() {
        client.send({ cmd: "Room", room: "words" });
        timerEnd.set(Date.now() + 40 * 60 * 1000); // 40 minutos
    }
}