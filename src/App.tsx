import { useEffect, useState } from 'react';
import { GameSocket } from './socket';
import Home from './Home';
import Lobby from './Lobby';
import Challenge from './Challenge';

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
  /** o desafio que está atualmente rodando */
  challenge: Shared.Challenge | null,
};

export type GameChallenge = GameConnected & { challenge: {} };
//export type GameChallenge = {[P in keyof GameConnected]: P extends "challenge" ? GameConnected[P] & {} : GameConnected[P]};

export default function App() {
  const [game, setGame] = useState<Game>({ connected: false });
  const [ws] = useState(() => new GameSocket());
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const minimumToSend = 0.05;
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
          challenge: msg.challenge,
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
        //alert("BadRoomId");
        break;
      }
      case "Error": {
        console.error(msg.error);
        break;
      }
      case "PlayerUpdated": {
        if (!game.connected) break;
        setGame(game => {
          if (!game.connected) return game;
          if (msg.player.member_id === game.player?.member_id) {
            msg.player.pos = game.player.pos;
          }
          const players = Array.from(game.players);
          const index = players.findIndex(x => x.member_id === msg.player.member_id);
          if (index === -1) {
            players.push(msg.player);
          } else {
            players[index] = msg.player;
          }
          if (msg.player.member_id === game.player?.member_id) {
            return { ...game, players, player: msg.player };
          } else {
            return { ...game, players };
          }
        });
        break;
      }
      case "PlayerRemoved": {
        setGame(game => {
          if (!game.connected) return game;
          const players = Array.from(game.players);
          const index = players.findIndex(x => x.member_id === msg.member_id);
          if (index !== -1) {
            players.splice(index, 1);
          }
          return { ...game, players };
        });
        break;
      }
      case "Challenge": {
        setGame(game => {
          if (!game.connected) return game;
          return { ...game, challenge: msg.challenge };
        });
        break;
      }
      case "ChallengeQuizAnswered": {
        setGame(game => {
          if (!game.connected || !game.challenge || game.challenge.id !== "Quiz") return game;
          const answers = Array.from(game.challenge.answers);
          answers[msg.index] = msg.value;
          return { ...game, challenge: { ...game.challenge, answers, miss_count: msg.miss_count } };
        });
        break;
      }
      case "ChallengeWordHuntAnswered": {
        setGame(game => {
          if (!game.connected || !game.challenge || game.challenge.id !== "WordHunt") return game;
          return { ...game, challenge: { ...game.challenge, answers: [...game.challenge.answers, {index: msg.index, team: msg.team}] } };
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
    return () => {
      console.log("useEffect: disconnect");
      ws.disconnect();
    };
  }, [ws]);
  return !game.connected
    ? <Home
      onJoin={roomId => {
        console.log("onJoin");
        ws.connect({ mode: "join", room: roomId });
      }}
      onOpen={() => {
        console.log("onOpen");
        ws.connect({ mode: "open" });
      }}
    />
    : !game.challenge
      ? <Lobby
        game={game}
        onMove={(pos: { x: number, y: number }) => {
          if (game.player?.pos.x === pos.x && game.player?.pos.y === pos.y) return;
          if ((lastX - pos.x) * (lastX - pos.x) + (lastY - pos.y) * (lastY - pos.y) > minimumToSend * minimumToSend) {
            setLastX(pos.x);
            setLastY(pos.y);
            ws.send({ cmd: "SetPos", pos });
            console.log(pos);
          }
          setGame(game => {
            if (!game.connected || !game.player) return game;
            const players = Array.from(game.players);
            const index = players.findIndex(x => x.member_id === game.player!.member_id);
            players[index] = {
              ...game.player,
              pos,
            };
            return {
              ...game,
              player: {
                ...game.player,
                pos,
              },
              players,
            };
          });
        }}
        onTeamChange={(team: boolean) => ws.send({ cmd: "SetTeam", team })}
        onQuit={() => {
          if (window.confirm(
            game.player
              ? "Certeza que quer sair?\nNão é possível voltar!"
              : "Certeza que quer fechar a sala?\nNão é possível abrir novamente!"
          )) ws.send({ cmd: "Quit" });
        }}
        onNameChange={(name: string) => ws.send({ cmd: "SetName", name })}
        onGameStart={() => ws.send({ cmd: "Start" })}
      />
      : <Challenge
        game={game as GameChallenge}
        onQuizAnswer={(index, value) => {
          ws.send({ cmd: "ChallengeQuizAnswer", index, value });
        }}
        onWordHuntAnswer={(index: number) => {
          ws.send({ cmd: "ChallengeWordHuntAnswer", index });
        }}
      />
}
