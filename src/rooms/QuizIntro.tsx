import { client } from "../client";
import "./QuizIntro.css";
import QuizQuestions from "./QuizQuestions.json";
import { timerEnd } from "./Timer";
export default function QuizIntro() {
    return (
        <div class="quiz-intro-screen">
            <h1>Quiz</h1>
            Há {QuizQuestions.default.questions.length} questões sobre vários assuntos para você e seu time responder,
            <br />
            <br />
            Cada acerto contribui pontos para o seu time
            <br />
            <br />
            Só uma pessoa no seu time precisa acertar a questão para ganhar ponto
            <br />
            <br />
            Você pode tentar cada questão uma vez, e depois de 5 erros você não pode mais responder
            <br />
            <br />
            Se você errar, um amigo no seu time ainda pode respoder
            <br />
            <br />
            As questões são fáceis, tente responder o maximo de questões antes do tempo acabar
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
        client.send({ cmd: "Room", room: "quiz" });
        timerEnd.set(Date.now() + 40 * 60 * 1000); // 40 minutos
    }
}