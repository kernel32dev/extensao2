import { useEffect, useState } from "react";
import { GameChallenge } from "../App";
import "./Quiz.css";
import QuizQuestions from "./QuizQuestions.json";

type QuizContentType = {
    text: string
};

type QuizQuestionsType = {
    [question_set_id: string]: {
        title: string,
        questions: {
            prompt: QuizContentType,
            answer: number,
            alternatives: QuizContentType[],
        }[]
    }
};

type GameChallengeQuiz = GameChallenge & { challenge: { id: "Quiz" } };

export default function Quiz({ game, onAnswer }: { game: GameChallengeQuiz, onAnswer(index: number, value: number): void }) {
    const max_miss_count: Shared.QuizMaxMissCount = 4;
    let [index, setIndex] = useState<number | null>(null);
    const pack = (QuizQuestions as QuizQuestionsType)[game.challenge.question_set_id];
    if (index !== null && (game.challenge.answers[index] < 0 || game.challenge.miss_count >= max_miss_count)) {
        index = null;
        setIndex(null);
    }
    if (index !== null) {
        const i = index;
        return <QuizQuestion
            question_set_title={pack.title}
            question_number={i + 1}
            question={pack.questions[i]}
            value={game.challenge.answers[i]}
            onReturn={() => setIndex(null)}
            onAnswer={value => onAnswer(i, value)}
        />
    }
    return (
        <div className="quiz-screen">
            <h1>Quiz</h1>
            <br />
            <p>
                Responda as questões abaixo para ajudar o seu time a ganhar!
                <br />
                Se você errar uma pergunta outra pessoa pode tentar responder de novo!
                <br />
                Se você cometer erros demais você não poderá mais responder questões!
                <br />
                Erros até agora: {game.challenge.miss_count} / {max_miss_count}
                {
                    game.challenge.miss_count >= max_miss_count && <><br />Espere o seu time terminar</>
                }
            </p>
            <br />
            <hr />
            <br />
            <div className="quiz-board">
                {pack.questions.map((_question, index) => {
                    let className;
                    switch (game.challenge.answers[index]) {
                        case -2: className = "wrong"; break;
                        case -1: className = "right"; break;
                        default: if (game.challenge.miss_count >= max_miss_count) {
                            className = "wrong";
                        } else {
                            className = "available";
                        }
                    }
                    return (
                        <div
                            key={index}
                            className={"quiz-board-question " + className}
                            onClick={className === "available" ? () => setIndex(index) : undefined}
                        >
                            {index + 1}
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

function QuizQuestion({ question_set_title, question_number, question, value, onReturn, onAnswer }: {
    question_set_title: string,
    question_number: number,
    question: {
        prompt: QuizContentType,
        answer: number,
        alternatives: QuizContentType[],
    },
    value: number,
    onReturn(): void,
    onAnswer(index: number): void,
}) {
    useEffect(() => {
        const state = "QuizQuestionState";
        window.history.pushState(state, "");
        const popstateHandler = (ev: PopStateEvent) => ev.state === state && onReturn();
        window.addEventListener("popstate", popstateHandler);
        return () => window.removeEventListener("popstate", popstateHandler);
    }, [onReturn]);
    return (
        <div className="quiz-screen">
            <p><small>{question_set_title}</small></p>
            <div className="quiz-header">
                <button onClick={onReturn}>Voltar</button>
                <h1>Questão #{question_number}</h1>
                <button onClick={onReturn} style={{ visibility: "hidden" }}>Voltar</button>
            </div>
            <div className="quiz-question">
                <p><QuizContent content={question.prompt} /></p>
                <div className="quiz-alternatives">
                    {question.alternatives.map((alternative, index) => {
                        const errada = !!((1 << index) & value);
                        return (
                            <button
                                key={index}
                                className={"quiz-alternative " + (errada ? "wrong" : "")}
                                onClick={!errada ? () => onAnswer(index === question.answer ? -1 : index) : undefined}
                            >
                                <QuizContent content={alternative} />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function QuizContent({ content: { text } }: { content: QuizContentType }) {
    // TODO! um dia suportar imagens
    return <>{text}</>
}
