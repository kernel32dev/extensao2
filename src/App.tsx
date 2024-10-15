import { useEffect, useState } from 'react';
import { GameSocket } from './socket';
import Home from './Home';
import Lobby from './Lobby';

/** o estado do jogo, esse estado é usado para atualizar praticamente tudo do jogo
 *
 * as mensagens atualizam esse objeto, e as views se atualizam para refletir o novo estado do jogo */
export const game: Game = { connected: false } satisfies GameDisconnected;

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
  player: Shared.Player | null,
  /** o segredo necessário para reconectar caso a internet caia */
  secret: string,
  /** o membro que é o dono da sala */
  owner: Shared.Owner,
  /** os membro que são jogadores dentro da sala */
  players: Shared.Player[],
};

function App() {
  const [game, setGame] = useState<Game>({ connected: false });
  const [ws] = useState(() => new GameSocket());
  ws.handler = msg => {
    switch (msg.event) {
      case "Connected": {
        setGame({
          connected: true,
          owner: msg.owner,
          players: msg.players,
          room_id: msg.room_id,
          secret: msg.secret,
          player: msg.players.find(player => player.member_id === msg.member_id) ?? null,
        });
        break;
      }
      case "Disconnected": {
        setGame({
          connected: false
        });
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
        setGame(game => {
          if (!game.connected) return game;
          const players = Array.from(game.players);
          const index = players.findIndex(x => x.member_id == msg.player.member_id);
          if (index == -1) {
            players.push(msg.player);
          } else {
            players[index] = msg.player;
          }
          return { ...game, players };
        });
        break;
      }
      case "PlayerRemoved": {
        setGame(game => {
          if (!game.connected) return game;
          const players = Array.from(game.players);
          const index = players.findIndex(x => x.member_id == msg.member_id);
          if (index != -1) {
            players.splice(index, 1);
          }
          return { ...game, players };
        });
        break;
      }
      default:
        // se a linha abaixo der um erro de tipagem no satisfies
        // é porque algum tipo de evento não foi tratado
        console.error("tipo de mensagem do servidor desconhecida : " + ((msg satisfies never) as any).event);
    }
  }
  useEffect(() => {
    ws.connect();
    return () => ws.disconnect();
  }, []);
  return game.connected
    ? <Lobby
      game={game}
      onQuit={() => ws.send({ cmd: "Quit" })}
    />
    : <Home
      onJoin={roomId => ws.connect({ mode: "join", room: roomId })}
      onOpen={() => ws.connect({ mode: "open" })}
    />
}

export default App;
