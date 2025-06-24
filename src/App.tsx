import { Elems } from "rubedo-dom";
import Loading from "./rooms/Loading";
import Lobby from "./rooms/Lobby";
import Quiz from "./rooms/Quiz";
import Words from "./rooms/Words";
import Podium from "./rooms/Podium";
import { client } from "./client";
import QuizIntro from "./rooms/QuizIntro";
import WordsIntro from "./rooms/WordsIntro";

export default function App() {
    const rooms = {
        loading: <Loading />,
        lobby: <Lobby />,
        quiz_intro: <QuizIntro />,
        quiz: <Quiz />,
        words_intro: <WordsIntro />,
        words: <Words />,
        podium: <Podium />,
    };

    return Elems(client.room.derive(room => rooms[room]));
}
