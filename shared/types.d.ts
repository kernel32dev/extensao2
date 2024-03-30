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

declare namespace CliMsg {
    type SetName = {
        cmd: "SetName",
        name: string,
    }
}

declare namespace Shared {
    interface Member {
        owner: boolean,
        member_id: string,
    }
    interface Player extends Member {
        name: string,
    }
    interface Owner extends Member {}
}
