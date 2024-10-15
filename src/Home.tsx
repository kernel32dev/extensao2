import { useEffect, useRef } from "react";
import "./Home.css";

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
            <input type="text" ref={roomInput} onInput={roomIdInputHandler} />
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

function Stars({ count }: { count: number }) {
  const starsRef = useRef<HTMLDivElement>(null);
  const time = 60;

  useEffect(() => {
    if (starsRef.current) {
      starsRef.current.innerHTML = ''; // Limpa o container ao recarregar

      for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'home-star';
        const angle = Math.random() * Math.PI * 2;
        const delay = Math.random() * time;

        star.style.setProperty('--rot', angle + 'rad');
        star.style.setProperty('--from-x', '50%');
        star.style.setProperty('--from-y', '50%');
        star.style.setProperty('--to-x', Math.cos(angle) * 150 + '%');
        star.style.setProperty('--to-y', Math.sin(angle) * 150 + '%');
        star.style.setProperty('--delay', '-' + delay + 's');
        star.style.setProperty('--time', time + 's');

        starsRef.current.appendChild(star);
      }
    }
  }, [count, time]);

  return <div className="home-stars" ref={starsRef}></div>;
};
