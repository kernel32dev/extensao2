// esse arquivo é usado para compartilhar os tipos entre o front end e o back end

type SvrMsg =
| SvrMsg.Connected
| SvrMsg.Disconnected
| SvrMsg.BadRoomId
| SvrMsg.Error
| SvrMsg.PlayerUpdated
| SvrMsg.PlayerRemoved

declare namespace SvrMsg {
    type Connected = {
        event: "Connected",
        room_id: string,
        member_id: string,
        secret: string,
        owner: Shared.Owner,
        players: Shared.Player[],
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
}

type CliMsg =
| CliMsg.SetName
| CliMsg.SetPos
| CliMsg.Quit
| CliMsg.Start

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
}
