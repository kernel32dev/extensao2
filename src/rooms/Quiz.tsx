import { State, Derived, Effect } from "rubedo";
import { Elems } from "rubedo-dom";
import "./Quiz.css";
import QuizQuestions from "./QuizQuestions.json";
import { client } from "../client";
import Timer from "./Timer";

type QuizContentType = { text: string };
type QuizQuestionsType = {
    [question_set_id: string]: {
        title: string;
        questions: {
            prompt: QuizContentType;
            answer: number;
            alternatives: QuizContentType[];
        }[];
    };
};

export default function Quiz({ }: {}): Elems {
    const max_miss_count = 5;
    const misses = State.track(new Set<number>());
    const miss_count = Derived.prop(misses, "size");
    const selectedIndex = new State<number | null>(null);
    const pack = (QuizQuestions as QuizQuestionsType)["default"];

    const misses_text = localStorage.getItem("misses") || "";
    for (const miss_text of misses_text.split(",")) {
        const miss = Number(miss_text || NaN);
        if (Number.isSafeInteger(miss)) misses.add(miss);
    }
    setTimeout(() => {
        if (misses.size > client.answers.length) misses.clear();
    }, 1000);

    new Effect.Persistent(() => {
        State.Set.use(misses);
        Derived.now(() => {
            localStorage.setItem("misses", Array.from(misses).join(","));
        });
    });

    const quiz = (
        <div class="quiz-screen">
            <Timer position="bottom-center" />
            <h1>Quiz</h1>
            <br />
            {!client.isHost && <p>
                Responda as questões abaixo o mais rápido possível para ajudar o seu time a ganhar!
                <br />
                <br />
                Se você errar uma pergunta, outra pessoa pode tentar responder de novo!
                <br />
                Erros até agora: {miss_count} / {max_miss_count}
                {miss_count.derive(miss_count => miss_count >= max_miss_count).and(
                    <>
                        <br />
                        Espere o seu time terminar
                    </>
                )}
            </p>}
            {client.isHost && <p>
                Responda as questões o mais rápido possível para ajudar o seu time a ganhar!
            </p>}
            <br />
            <hr />
            <br />
            <div class="quiz-board">
                {!client.isHost && pack.questions.map((_q, i) => {
                    const div = (
                        <div
                            class="quiz-board-question"
                            onClick={function() {
                                if (client.isHost) return;
                                if (this.classList.contains("available")) {
                                    selectedIndex.set(i);
                                    history.pushState("quiz", "");
                                    const handler = (ev: PopStateEvent) => {
                                        if (ev.state === "quiz") {
                                            effect.clear();
                                            window.removeEventListener("popstate", handler);
                                            selectedIndex.set(null);
                                        }
                                    };
                                    window.addEventListener("popstate", handler);
                                    const effect = new Effect.Persistent(effect => {
                                        if (selectedIndex() === null) {
                                            effect.clear();
                                            window.removeEventListener("popstate", handler);
                                            history.back();
                                        }
                                    });
                                }
                            }}
                        >
                            {i + 1}
                        </div>
                    ) as HTMLDivElement;
                    const answered_correctly = new Derived(() => client.answers.find(x => x.index === i)?.team === client.me().team);
                    new Effect(div, () => {
                        div.classList.remove("right","atention","wrong","blocked","available");
                        if (answered_correctly()) {
                            div.classList.add("right", "atention");
                            setTimeout(() => {
                                div.classList.remove("atention");
                            }, 1000);
                        } else if (misses.has(i)) {
                            div.classList.add("wrong");
                        } else if (miss_count() >= max_miss_count) {
                            div.classList.add("blocked");
                        } else {
                            div.classList.add("available");
                        }
                    });
                    return div;
                })}
            </div>
        </div>
    );

    return Elems(selectedIndex.derive(index => (
        index === null ? quiz : QuizQuestion({
            question_set_title: pack.title,
            question_number: index + 1,
            question: pack.questions[index],
            onReturn: () => selectedIndex.set(null),
            onAnswer: (right) => {
                if (right) {
                    client.send({
                        cmd: "Answer",
                        index,
                        team: client.me().team,
                    });
                } else {
                    misses.add(index);
                }
            },
        })
    )));
}

function QuizQuestion({
    question_set_title,
    question_number,
    question,
    onReturn,
    onAnswer,
}: {
    question_set_title: string;
    question_number: number;
    question: {
        prompt: QuizContentType;
        answer: number;
        alternatives: QuizContentType[];
    };
    onReturn(): void;
    onAnswer(right: boolean, index: number): void;
}): Elems {
    return (
        <div class="quiz-screen">
            <p>
                <small>{question_set_title}</small>
            </p>
            <div class="quiz-header">
                <button onClick={onReturn}>Voltar</button>
                <h1>Questão #{question_number}</h1>
                <button onClick={onReturn} style={{ visibility: "hidden" }}>
                    Voltar
                </button>
            </div>
            <div class="quiz-question">
                <p>{QuizContent({ content: question.prompt })}</p>
                <div class="quiz-alternatives">
                    {question.alternatives.map((alt, i) => {
                        return (
                            <button
                                class="quiz-alternative"
                                onClick={() => {
                                    onReturn();
                                    onAnswer(i === question.answer, i);
                                }}
                            >
                                {QuizContent({ content: alt })}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function QuizContent({ content }: { content: QuizContentType }): Elems {
    return Elems(content.text);
}
