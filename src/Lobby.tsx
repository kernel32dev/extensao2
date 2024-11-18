import { useEffect, useRef, useState } from "react";
import { GameConnected } from "./App";
import "./Lobby.css";

export default function Lobby({ game, onMove, onQuit, onNameChange, onTeamChange, onGameStart }: {
  game: GameConnected,
  onMove(pos: { x: number, y: number }): void,
  onQuit(): void,
  onNameChange(name: string): void,
  onTeamChange(team: boolean): void,
  onGameStart(): void,
}) {
  const lobbyPlayground = useRef<HTMLDivElement>(null!);
  const nameInput = useRef<HTMLInputElement>(null!);
  const [qrcodeSrc] = useState(() => {
    const url = new URL("/qrcode/", window.location.href);
    url.port = "8080";
    return url.href;
  });
  const [showQrCode, setShowQrCode] = useState(false);
  useEffect(() => {
    const url = new URL("/qrcode", window.location.href);
    url.port = "8080";
    fetch(url).then(x => x.json()).then(x => {
      if (x.enabled) {
        setShowQrCode(true);
      } else {
        console.error(x.reason);
      }
    })
  }, []);
  function moveHandler(ev: React.MouseEvent<HTMLDivElement, MouseEvent> | React.TouchEvent<HTMLDivElement>) {
    const e = ev.nativeEvent;
    ev.nativeEvent.preventDefault();
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
        <div className="lobby-header-row">
          <div className="lobby-room-id-area">
            <span className="lobby-room-id-label">Código da sala:</span>
            <br />
            <span className="lobby-room-id-text">{game.connected && game.room_id}</span>
          </div>
        </div>
        <div className="lobby-header-row">
          <div className="lobby-header-column">
            <button onClick={onQuit}>{game.player != null ? "Sair da sala" : "Fechar a sala"}</button>
          </div>
        </div>
        {
          game.player != null
            ? // quando for jogador
            <>
              <div className="lobby-header-row">
                <div className="player-config">
                  <span>O jogo começará em breve...</span>
                  <label>
                    Seu nome: &nbsp;
                    <input ref={nameInput} type="text" maxLength={16} onInput={() => onNameChange(nameInput.current.value)} defaultValue={game.player.name} />
                  </label>
                </div>
              </div>
              <div className="lobby-header-row">
                <div className="lobby-header-column">
                  {
                    game.player.team
                      ? <>
                        <p>Você está no time <span style={{ color: "blue" }}>Azul</span></p>
                        <button onClick={() => onTeamChange(false)}>Ir para o time vermelho</button>
                      </>
                      : <>
                        <p>Você está no time <span style={{ color: "red" }}>Vermelho</span></p>
                        <button onClick={() => onTeamChange(true)}>Ir para o time azul</button>
                      </>
                  }
                </div>
              </div>
            </>
            : // quando for o dono
            <div className="lobby-header-row">
              <div className="owner-control">
                <button onClick={onGameStart}>Começar o jogo</button>
              </div>
            </div>
        }
        <div className="lobby-header-row">
          <div className="lobby-header-column">
            <p>Times:</p>
            <p>
              <span style={{ color: "red" }}>{game.players.filter(x => !x.team).length}</span>
              <span>/</span>
              <span style={{ color: "blue" }}>{game.players.filter(x => x.team).length}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="player-arena-row">
        {showQrCode && game.player == null && (
          <div className="qrcode-area" style={{backgroundImage: `url("${qrcodeSrc + game.room_id}")`}} />
        )}
        <div className="player-arena" ref={lobbyPlayground} onMouseMove={moveHandler} onTouchStart={moveHandler} onTouchMove={moveHandler}>
          {game.players.map(player => <Player key={player.member_id} player={player} />)}
        </div>
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

  const cor = "#" + player.member_id.substring(0, 6);
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
      <div className={"player-name " + (player.team ? "blue" : "red")}>{player.name}</div>
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
