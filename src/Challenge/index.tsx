import { GameChallenge } from "../App";
import Quiz from "./Quiz";

export default function Challenge({game, onQuizAnswer}: {game: GameChallenge, onQuizAnswer(index: number, value: number): void}) {
    switch (game.challenge.id) {
        case "Quiz":
            return <Quiz game={game} onAnswer={onQuizAnswer} />
        default:
            // a linha abaixo vai dar erro se tiver um challenge que ainda não foi tratado
            // TODO! descomentar a linha abaixo quando um segundo tipo de challenge aparecer
            //console.error("tipo de challenge do servidor desconhecida : " + ((game satisfies never) as GameChallenge).challenge.id);
            return <></>;
            
    }
}