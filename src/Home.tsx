import { useRef } from "react";
import "./Home.css";
import Stars from "./Stars";

const roomIdRegex = /^[BCDFGHJKLMNPQRSTVWXYZ][AEIOU][BCDFGHJKLMNPQRSTVWXYZ]$/;

export default function HomePage({onJoin, onOpen}: { onJoin(roomId: string): void, onOpen(): void }) {
  const roomInput = useRef<HTMLInputElement | null>(null);
  const roomIdInputHandler = () => {
    if (!roomInput.current) return;
    const roomId = roomInput.current.value.trim().toUpperCase();
    if (roomIdRegex.test(roomId)) onJoin(roomId);
  };
  return (
    <div className="home-page">
      <Stars count={300} />
      <div className="home-content">
        <h1>Extensão 2.0</h1>
        <p className="home-game-description">
          Este é um jogo onde vários jogadores competem como dois times
        </p>
        <div className="home-choices">
          <div className="home-choice">
            <h3>Se você for um estudante:</h3>
            <h4>Entre na sala pelo código!</h4>
            <br />
            <input type="text" ref={roomInput} onInput={roomIdInputHandler} defaultValue={""} />
          </div>
          <div className="home-choice">
            <h3>Se você for um professor:</h3>
            <h4>Clique aqui para criar a sala!</h4>
            <br />
            <button onClick={onOpen}>Criar sala</button>
          </div>
        </div>
      </div>
    </div>
  );
}
