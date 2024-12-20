import { GameChallenge } from "../App";
import Quiz, { GameChallengeQuiz } from "./Quiz";
import WordHunt, { GameChallengeWordHunt } from "./WordHunt";
import Clock from "../Clock";

export default function Challenge({game, onQuizAnswer, onWordHuntAnswer}: {game: GameChallenge, onQuizAnswer(index: number, value: number): void, onWordHuntAnswer(index: number): void}) {
    switch (game.challenge.id) {
        case "Quiz":
            return <>
                <Clock remaining_ms={game.challenge.remaining_ms}/>
                <Quiz game={game as GameChallengeQuiz} onAnswer={onQuizAnswer} />
            </>;
        case "WordHunt":
            return <>
                <Clock remaining_ms={game.challenge.remaining_ms}/>
                <WordHunt game={game as GameChallengeWordHunt} onAnswer={onWordHuntAnswer}/>
            </>;
            break;
        default:
            // a linha abaixo vai dar erro se tiver um challenge que ainda não foi tratado
            console.error("tipo de challenge do servidor desconhecida : " + ((game.challenge satisfies never) as GameChallenge["challenge"]).id);
            return <></>;
    }
}