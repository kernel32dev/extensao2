import * as socket from "./socket";
import { game as global_game } from "./game";

export function LobbyPage(): Elems {
    const game = global_game.value!;
    return (
        <div class="lobby-page">
            {
                game.connected && game.player &&
                <div class="player-config">
                    <span>Esperando o professor começar o jogo...</span>
                    <label>
                        Mudar seu nome:
                        <input type="text" maxLength={16} onInput={set_name} value={game.player.value.name} />
                    </label>
                </div>
            }
            <div class="player-arena" onMouseMove={move_to} onTouchStart={move_to} onTouchMove={move_to}>
                {game.connected && game.players.thenMap(render_player)}
            </div>
        </div>
    )
    function set_name(this: HTMLInputElement) {
        if (this.value != "") {
            socket.send({ cmd: "SetName", name: this.value });
        }
    }
    function move_to(this: HTMLDivElement, e: MouseEvent | TouchEvent) {
        let x = 0, y = 0;
        if (e instanceof MouseEvent) {
            if ((e.buttons & 1) == 0) return;
            x = e.clientX;
            y = e.clientY;
        } else {
            if (e.type === "touchstart") e.preventDefault();
            let touch_count = 0;
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches.item(i);
                if (!touch) continue;
                touch_count++;
                x += touch.clientX;
                y += touch.clientY;
            }
            if (touch_count == 0) return;
            x /= touch_count;
            y /= touch_count;
        }
        const rect = this.getBoundingClientRect();
        x = (x - rect.left) / rect.width;
        y = (y - rect.top) / rect.height;
        if (x < 0) x = 0; else if (x > 1) x = 1;
        if (y < 0) y = 0; else if (y > 1) y = 1;

        update_position({ x, y });
    }
    function render_player(p: State<Shared.Player>): Elems {
        
        const player_images = [
            "/static/among-us-cyan-768x934.webp",
            "/static/among-us-green-768x934.webp",
            "/static/among-us-red-768x934.webp",
            "/static/among-us-yellow-768x934.webp",
        ];

        const player_images_index = p.value.member_id.charCodeAt(0) % player_images.length;

        const name = ref<"div">();
        const img = ref<"div">();

        const character = (
            <div class="player-character">
                <div ref={name} class="player-name">{p.value.name}</div>
                <div ref={img} class="player-img">
                    <div class="player-img2" style={{backgroundImage: `url("${player_images[player_images_index]}")`}} />
                </div>
            </div>
        ) as HTMLDivElement;

        const is_self = game.connected && p == game.player;
        let self_walking = 0;

        // se estivermos renderizando o nosso jogador, adiciona a classe player-character-self
        if (is_self) character.classList.add("player-character-self");

        // inicializa a posição e o a direção que o personagem está olhando
        character.style.setProperty("--flip", Math.random() < 0.5 ? "100%" : "-100%");
        character.style.setProperty("--x", p.value.pos.x * 100 + "%");
        character.style.setProperty("--y", p.value.pos.y * 100 + "%");
        character.style.setProperty("--z", String(Math.floor(p.value.pos.y * 1000)));

        // faça o seguinte quando os dados do jogador mudarem
        p.on(p => {
            // atualiza nome
            if (name.innerText !== p.name) {
                name.innerText = p.name;
            }

            if (is_self) {
                // roda a animação e bota para ela sumir depois de 0.1s
                img.classList.add("walking");
                clearTimeout(self_walking);
                self_walking = window.setTimeout(() => img.classList.remove("walking"), 100);
            } else {
                // reseta animação
                img.classList.remove("walking");
                requestAnimationFrame(() => img.classList.add("walking"));
            }

            // atualiza direção que o personagem está olhando
            const old_x_text = character.style.getPropertyValue("--x");
            const old_x = Number(old_x_text.slice(0, -1)) * 0.01;
            if (Math.abs(p.pos.x - old_x) > 0.005) {
                character.style.setProperty("--flip", p.pos.x > old_x ? "100%" : "-100%");
            }

            // atualiza posição
            character.style.setProperty("--x", p.pos.x * 100 + "%");
            character.style.setProperty("--y", p.pos.y * 100 + "%");
            character.style.setProperty("--z", String(Math.floor(p.pos.y * 1000)));
        });
        return character;
    }
}

let pos_update_timeout = 0;
let last_sent_position: Shared.Point | null = null;

function update_position(pos: Shared.Point) {
    const game = global_game.value!;
    const pos_update_ms = 500;

    if (!game.connected || !game.player) return;

    if (last_sent_position) {
        const old = last_sent_position;
        const distance = (old.x - pos.x) * (old.x - pos.x) + (old.y - pos.y) * (old.y - pos.y);
        const max_distance = 0.1;

        game.player.value.pos = pos;

        if (distance > max_distance * max_distance) {
            // se a mudança for maior que max_distance% do tamanho da sala, atualiza logo
            // isso serve para mandar menos mensagems ao servidor
            last_sent_position = game.player.value.pos;
            socket.send({ cmd: "SetPos", pos: game.player.value.pos });
        }
    } else {
        last_sent_position = game.player.value.pos;
        socket.send({ cmd: "SetPos", pos: game.player.value.pos });
    }

    // e também atualiza depois
    clearTimeout(pos_update_timeout);
    pos_update_timeout = window.setTimeout(() => {
        if (game.player) {
            last_sent_position = game.player.value.pos;
            socket.send({ cmd: "SetPos", pos: game.player.value.pos });
        }
    }, pos_update_ms);
}

css`${{ __filename, __line }}

.lobby-page {
    width: 100%;
    max-width: 100%;
    min-height: 100vh;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    overflow: hidden;
}

.player-config {
    display: flex;
    flex-direction: column;
    margin: 1em;
    padding: 1em;
    border-radius: 1em;
    box-shadow: inset #000000FF 0 0 30px -3px;
    background-color: #00000010;
}

.player-arena {
    flex-grow: 1;
    flex-shrink: 1;
    margin: 1em;
    padding: 1em;
    border-radius: 1em;
    box-shadow: inset #00000080 0 0 30px -3px;
    background-color: #0000000A;
    position: relative;
}

.player-character {
    display: flex;
    flex-direction: column;
    width: fit-content;
    align-items: center;
    transform: translate(-50%, -100%);
    user-select: none;

    position: absolute;
    left: var(--x);
    top: var(--y);
    transition: left 0.1s ease, top 0.1s ease;
    z-index: var(--z);
}
.player-character-self {
    transition: none;
}
.player-name {
    background-color: #00000060;
    padding: 0.1em 0.3em;
    color: white;
    white-space: pre;
}
.player-img {
    width: 4em;
    height: calc(4em * 934 / 768);
    transform: scaleX(var(--flip));
    transition: transform 0.1s ease;
}
.player-img2 {
    width: 100%;
    height: 100%;
    background-size: 100%;
    animation: player-img-idle 1.5s linear 0s infinite normal forwards;
}
.walking .player-img2 {
    animation: player-img-walk 0.2s ease 0s 1 normal forwards;
}
.player-character-self .walking .player-img2 {
    animation: player-img-walk 0.2s ease 0s infinite normal forwards;
}

@keyframes player-img-walk {
    0% { transform: translate(0%, 0%) rotate(0deg); }
    25% { transform: translate(-2%, -8%) rotate(-10deg); }
    50% { transform: translate(0%, 0%) rotate(0deg); }
    75% { transform: translate(2%, -8%) rotate(10deg); }
    100% { transform: translate(0%, 0%) rotate(0deg); }
}
@keyframes player-img-idle {
    0% { transform: scaleX(100%) scaleY(100%) translateY(0%); }
    50% { transform: scaleX(103%) scaleY(97%) translateY(2%); }
}
`
