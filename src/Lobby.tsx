import { GameConnected } from "./App";

export default function Lobby({ game, onQuit }: { game: GameConnected, onQuit(): void }) {
  return (
    <div>
      <button onClick={onQuit}>
        desconectar
      </button>
      <br />
      <code style={{ whiteSpace: "pre" }}>
        {JSON.stringify(game, undefined, 2)}
      </code>
    </div>
  );
}