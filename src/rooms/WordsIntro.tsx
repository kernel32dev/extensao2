import { client } from "../client";
import "./QuizIntro.css";
// import Words from "./Words.json";
import { timerEnd } from "./Timer";
export default function WordsIntro() {
    return (
        <div class="words-intro-screen">
            <h1>Caça Palavaras</h1>
            Tente encontrar as palavras antes do time inimigo
            <br />
            <br />
            Cada palavra dá um ponto, o time que encontrar a palavra primeiro fica com ela
            <br />
            <br />
            Apenas uma pessoa precisa pegar a palavra
            <br />
            <br />
            Todo mundo está olhando para o mesmo jogo
            <br />
            <br />
            Para pegar uma palavra, selecione a primeira letra e então toque na a última
            {client.isHost && (
                <>
                    <br />
                    <br />
                    <button onClick={start}>Começar</button>
                </>
            )}
        </div>
    );
    function start() {
        client.send({ cmd: "Room", room: "words" });
        timerEnd.set(Date.now() + 300_000);
    }
}