import { Elems } from "rubedo-dom";
import Loading from "./rooms/Loading";
import Lobby from "./rooms/Lobby";
import Quiz from "./rooms/Quiz";
import Words from "./rooms/Words";
import Podium from "./rooms/Podium";
import { client } from "./client";

export default function App() {
    const rooms = {
        loading: <Loading />,
        lobby: <Lobby />,
        quiz: <Quiz />,
        words: <Words />,
        podium: <Podium />,
    };

    return Elems(client.room.derive(room => rooms[room]));
}
