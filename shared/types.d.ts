// esse arquivo é usado para compartilhar os tipos entre o front end e o back end

type SvrMsg =
| SvrMsg.Connected
| SvrMsg.Disconnected
| SvrMsg.BadRoomId
| SvrMsg.Error
| SvrMsg.PlayerUpdated
| SvrMsg.PlayerRemoved
| SvrMsg.Challenge
| SvrMsg.ChallengeQuizAnswered

declare namespace SvrMsg {
    type Connected = {
        event: "Connected",
        room_id: string,
        member_id: string,
        secret: string,
        owner: Shared.Owner,
        players: Shared.Player[],
        challenge: Shared.Challenge | null
    };
    type Disconnected = {
        event: "Disconnected",
    };
    type BadRoomId = {
        event: "BadRoomId",
    }
    type Error = {
        event: "Error",
        error: string,
    };
    type PlayerUpdated = {
        event: "PlayerUpdated",
        player: Shared.Player,
    };
    type PlayerRemoved = {
        event: "PlayerRemoved",
        member_id: string,
    };
    type Challenge = {
        event: "Challenge",
        challenge: Shared.Challenge | null,
    };
    type ChallengeQuizAnswered = {
        event: "ChallengeQuizAnswered",
        index: number,
        /** um valor válido para Challenge.Quiz.answers[*] */
        value: number,
        /** o número atualizado de quantas questões você errou até agora */
        miss_count: number,
    };
}

type CliMsg =
| CliMsg.SetName
| CliMsg.SetPos
| CliMsg.Quit
| CliMsg.Start
| CliMsg.ChallengeQuizAnswer

declare namespace CliMsg {
    type SetName = {
        cmd: "SetName",
        name: string,
    }
    type SetPos = {
        cmd: "SetPos",
        pos: Shared.Point,
    }
    type Quit = {
        cmd: "Quit",
    }
    type Start = {
        cmd: "Start",
    }
    type ChallengeQuizAnswer = {
        cmd: "ChallengeQuizAnswer",
        index: number,
        /** o index da alternativa errada que você quer marcar, ou -1 se você quiser acertar a resposta */
        value: number,
    }
}

declare namespace Shared {
    interface Point {
        x: number,
        y: number,
    }
    interface Member {
        owner: boolean,
        member_id: string,
    }
    interface Player extends Member {
        name: string,
        pos: Point,
    }
    interface Owner extends Member {}

    type Challenge =
    | Challenge.Quiz

    type QuizMaxMissCount = 4;

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
        }
    }
}
