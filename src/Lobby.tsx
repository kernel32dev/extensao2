import { useRef, useState } from "react";
import { GameConnected } from "./App";
import "./Lobby.css";

export default function Lobby({ game, onMove, onQuit }: {
  game: GameConnected,
  onMove(pos: { x: number, y: number }): void,
  onQuit(): void,
}) {
  const lobbyPlayground = useRef<HTMLDivElement>(null!);
  function moveHandler(ev: React.MouseEvent<HTMLDivElement, MouseEvent> | React.TouchEvent<HTMLDivElement>) {
    const e = ev.nativeEvent;
    let x = 0, y = 0;
    if (e instanceof MouseEvent) {
      if ((e.buttons & 1) === 0) return;
      x = e.clientX;
      y = e.clientY;
    } else if (e instanceof TouchEvent) {
      if (e.type === "touchstart") e.preventDefault();
      let touch_count = 0;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches.item(i);
        if (!touch) continue;
        touch_count++;
        x += touch.clientX;
        y += touch.clientY;
      }
      if (touch_count === 0) return;
      x /= touch_count;
      y /= touch_count;
    } else {
      return;
    }
    const rect = lobbyPlayground.current.getBoundingClientRect();
    x = (x - rect.left) / rect.width;
    y = (y - rect.top) / rect.height;
    if (x < 0) x = 0; else if (x > 1) x = 1;
    if (y < 0) y = 0; else if (y > 1) y = 1;
    onMove({ x, y });
  }
  if (false) return (
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
  return (
    <div className="lobby-page">
      <div className="lobby-header">

      </div>
      <div className="player-arena" ref={lobbyPlayground} onMouseMove={moveHandler} onTouchStart={moveHandler} onTouchMove={moveHandler}>
        {game.players.map(player => <Player key={player.member_id} player={player} />)}
      </div>
    </div>
  );
}

function Player({ player }: { player: Shared.Player }) {
  const div_ref = useRef<HTMLDivElement | null>(null);
  const [walking, setWalking] = useState(false);
  const [flip, setFlip] = useState(() => Math.random() > 0.5);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const moved = lastX !== player.pos.x || lastY !== player.pos.y;
  if (Math.abs(lastX - player.pos.x) > 0.005) {
    setFlip(player.pos.x > lastX);
  }
  if (moved) {
    setLastX(player.pos.x);
    setLastY(player.pos.y);

    if (!walking) setWalking(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setWalking(false);
    }, 100);
  }

  const cor = "#FF0000";
  return (
    <div
      className={"player-character"}
      key={player.member_id}
      style={{
        "--flip": flip ? "100%" : "-100%",
        "--x": player.pos.x * 100 + "%",
        "--y": player.pos.y * 100 + "%",
        "--z": String(Math.floor(player.pos.y * 1000)),
      } as React.CSSProperties}
    >
      <div className="player-name">{player.name}</div>
      <div ref={div_ref} className={"player-img" + (walking ? " walking" : "")}>
        <div className="player-img2" style={{
          backgroundImage: `url("/player.png")`,
          WebkitMaskImage: `url("/player.png")`,
          backgroundColor: cor,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          backgroundPosition: "center"
        }}>
          <div className="player-img3" style={{
            backgroundImage: `url("/player.png")`,
            WebkitMaskImage: `url("/player-mask.png")`,
            backgroundColor: cor,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            backgroundBlendMode: "multiply"
          }} />
        </div>
      </div>
    </div>
  );
}
