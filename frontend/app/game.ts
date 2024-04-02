

/** o estado do jogo, esse estado é usado para atualizar praticamente tudo do jogo
 *
 * as mensagens atualizam esse objeto, e as views se atualizam para refletir o novo estado do jogo */
export const game = new State<Game>({ connected: false } satisfies GameDisconnected);

/** o jogo pode estar desconectado ou conectado, note que mesmo caso haja uma queda de internet o estado do jogo continua conectado para não perdemos tudo */
export type Game = GameDisconnected | GameConnected;

/** quanto o jogo está desconectado, o objeto game só contem uma propiedade connected false */
export type GameDisconnected = {
    connected: false,
};

/** quando o jogo está conectador, o objeto contém todas as informações dos jogadores */
export type GameConnected = {
    connected: true,
    /** o id da sala, necessário para reconectar caso a internet caia */
    room_id: string,
    /** o jogador que está jogando o jogo neste navegador, ou null se esse for o dono do jogo */
    player: State<Shared.Player> | null,
    /** o segredo necessário para reconectar caso a internet caia */
    secret: string,
    /** o membro que é o dono da sala */
    owner: Shared.Owner,
    /** os membro que são jogadores dentro da sala */
    players: State<State<Shared.Player>[]>,
};

export function handle_server_message(msg: SvrMsg) {
    switch (msg.event) {
        case "Connected": {
            const players = new State(msg.players.map(x => new State(x)));
            game.value = {
                connected: true,
                room_id: msg.room_id,
                player: players.value.find(x => x.value.member_id == msg.member_id) ?? null,
                secret: msg.secret,
                owner: msg.owner,
                players,
            };
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
            if (!game.value.connected) break;
            const players = game.value.players.value;
            const index = players.findIndex(x => x.value.member_id == msg.player.member_id);
            if (index == -1) {
                players.push(new State(msg.player));
            } else {
                players[index].value = msg.player;
            }
            break;
        }
        case "PlayerRemoved": {
            if (!game.value.connected) break;
            const players = game.value.players.value;
            const index = players.findIndex(x => x.value.member_id == msg.member_id);
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

// bota o game no window, para podermos acessar o state do console
(window as any).game = game;
