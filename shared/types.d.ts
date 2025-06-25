// esse arquivo é usado para compartilhar os tipos entre o front end e o back end

type SvrMsg =
    | SvrMsg.Points
    | SvrMsg.Player
    | SvrMsg.Answer
    | SvrMsg.Room
    | SvrMsg.Error
    | SvrMsg.Disconnected

declare namespace SvrMsg {
    type Points = {
        event: "Points",
        points: [number, number],
    };
    type Player = {
        event: "Player",
        team: boolean,
        cid: number,
        x: number,
        y: number,
        name: string,
        points: number,
    };
    type Answer = {
        event: "Answer",
        team: boolean,
        index: number,
    };
    type Room = {
        event: "Room",
        room: Shared.Room,
    };

    type Error = {
        event: "Error",
        error: string,
    };
    type Disconnected = {
        event: "Disconnected",
    };
}

type CliMsg =
    | CliMsg.ResetPoints
    | CliMsg.Player
    | CliMsg.Answer
    | CliMsg.Room

declare namespace CliMsg {
    type ResetPoints = {
        cmd: "ResetPoints",
    };
    type Player = {
        cmd: "Player",
        team?: boolean,
        cid: number,
        x?: number,
        y?: number,
        name?: string,
    };
    type Answer = {
        cmd: "Answer",
        team: boolean,
        index: number,
    };
    type Room = {
        cmd: "Room",
        room: Shared.Room,
    };
}

declare namespace Shared {
    type Room = "lobby" | "quiz_intro" | "quiz" | "words" | "words_intro" | "podium";
    namespace Challenge {
        type Quiz = {
            id: "Quiz",
            question_set_id: string,
            /**
             * -1 = resposta correta marcada
             * -2 = você já tentou
             *
             * 0b00000 (0) ~ 0b11111 (31) = alternativas que já foram tentadas (assumindo 5 alternativas)
             *
             * se uma pergunta não estiver nesse array, então o valor dela é 0 (sem tentativas) */
            answers: number[],
            /** quantas vezes você errou */
            miss_count: number,
            /** quantos segundos faltam */
            remaining_ms: number,
        }
        type WordHunt = {
            id: "WordHunt",
            words_set_id: string,
            seed: string,
            answers: { index: number, team: boolean }[],
            /** quantos segundos faltam */
            remaining_ms: number,
        }
    }
}
