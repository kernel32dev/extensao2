import { active_page } from "./app";

export const state = new State<Game | null>(null);

// bota o state no window, para podermos acessar o state do console
(window as any).state = state;

export type Game = {
    room_id: string,
    player: Shared.Player | null,
    secret: string,
    owner: Shared.Owner,
    players: State<Shared.Player[]>,
};

export function handle_server_message(msg: SvrMsg) {
    switch (msg.event) {
        case "Connected": {
            const players = new State(msg.players);
            state.value = {
                room_id: msg.room_id,
                player: players.value.find(x => x.member_id == msg.member_id) ?? null,
                secret: msg.secret,
                owner: msg.owner,
                players,
            };
            active_page.value = "lobby";
            break;
        }
        case "Disconnected": {
            break;
        }
        case "BadRoomId": {
            alert("BadRoomId");
            break;
        }
        case "Error": {
            console.error(msg.error);
            break;
        }
        case "PlayerUpdated": {
            const players = state.value!.players.value;
            const index = players.findIndex(x => x.member_id == msg.player.member_id);
            if (index == -1) {
                players.push(msg.player);
            } else {
                players[index] = msg.player;
            }
            break;
        }
        case "PlayerRemoved": {
            const players = state.value!.players.value;
            const index = players.findIndex(x => x.member_id == msg.member_id);
            if (index != -1) {
                players.splice(index, 1);
            }
            break;
        }
        default:
            // a linha abaixo vai dar erro se tiver um event que ainda não foi tratado
            msg satisfies never;
    }
}
