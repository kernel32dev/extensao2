import "./Lobby.css";
import { Derived, Effect, State } from "rubedo";
import { client } from "../client";
import { Elems, ref } from "rubedo-dom";

export default function Lobby({ }: {}): Elems {
    return (
        <div class="lobby-page">
            <div class="lobby-column">
                <div class="lobby-header">
                    {
                        client.isHost
                            ? // quando for o professor
                            <div class="owner-control">
                                <button onClick={start_game}>Começar o jogo</button>
                            </div>
                            : // quando for jogador
                            <div class="player-config">
                                <span>Esperando o professor começar o jogo...</span>
                                <label>
                                    Mudar seu nome:
                                    <input type="text" maxLength={16} value={State.proxy(() => client.me().name, set_name)} />
                                </label>
                            </div>
                    }
                    {
                        client.isHost
                            ?
                            <div>
                                <span class="green-light">Jogadores verdes: {new Derived(() => client.players.filter(x => !x.team).length)}</span> / <span class="yellow-light">Jogadores amarelos: {new Derived(() => client.players.filter(x => x.team).length)}</span>
                            </div>
                            :
                            <div>
                                <button style={{ fontSize: "x-large", padding: "0.1em 0.4em" }} onClick={change_team}>
                                    Trocar de time
                                </button>
                            </div>
                    }
                </div>
                <div class="player-arena" onMouseMove={move_to} onTouchStart={move_to} onTouchMove={move_to}>
                    {Derived.Array.range(Derived.prop(client.players, "length"), i => (
                        Derived.now(() => render_player(Derived.prop(client.players, i)))
                    ))}
                </div>
            </div>
            {client.isHost && (
                <img class="lobby-qrcode" src="/qrcode" alt="" />
            )}
        </div>
    )
    function set_name(name: string) {
        if (!name) return;
        client.me().name = name;
        client.send({
            cmd: "Player",
            cid: client.cid,
            name,
        });
    }
    function start_game() {
        client.send({
            cmd: "Room",
            room: "quiz_intro",
        })
    }
    function change_team() {
        client.send({
            cmd: "Player",
            cid: client.cid,
            team: !client.me().team,
        });
    }
    function move_to(this: HTMLDivElement, e: MouseEvent | TouchEvent) {
        if (client.isHost) return;
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

        update_position(x, y);
    }
    function render_player(p: Derived<{ cid: number, x: number, y: number, name: string, team: boolean }>): Elems {
        const player_images = [
            "/public/among-us-cyan-768x934.webp",
            "/public/among-us-green-768x934.webp",
            "/public/among-us-red-768x934.webp",
            "/public/among-us-yellow-768x934.webp",
        ];

        const player_images_index = p().cid % player_images.length;

        const name = ref<"div">();
        const img = ref<"div">();

        const character = (
            <div class="player-character">
                <div ref={name} class={p.derive(x => x.team ? "player-name yellow-border" : "player-name green-border")}>{p.prop("name")}</div>
                <div ref={img} class="player-img">
                    <div class="player-img2" style={{ backgroundImage: `url("${player_images[player_images_index]}")` }} />
                </div>
            </div>
        ) as HTMLDivElement;

        const is_self = client.cid === p().cid;
        let self_walking = 0;

        // se estivermos renderizando o nosso jogador, adiciona a classe player-character-self
        if (is_self) character.classList.add("player-character-self");

        let flip = Math.random() < 0.5;
        let flip_old_x = p().x;

        // inicializa a posição e o a direção que o personagem está olhando
        character.style.setProperty("--flip", flip ? "-100%" : "100%");
        character.style.setProperty("--x", p().x * 100 + "%");
        character.style.setProperty("--y", p().y * 100 + "%");
        character.style.setProperty("--z", String(Math.floor(p().y * 1000)));

        // faça o seguinte quando os dados do jogador mudarem
        new Effect(character, () => {
            const { x, y } = p();
            Derived.now(() => {
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

                const flip_threshold = 0.005;
                if (flip) {
                    flip_old_x = Math.min(flip_old_x, x);
                    if (x - flip_old_x > flip_threshold) {
                        flip = false;
                        character.style.setProperty("--flip", "100%");
                        flip_old_x = x;
                    }
                } else {
                    flip_old_x = Math.max(flip_old_x, x);
                    if (flip_old_x - x > flip_threshold) {
                        flip = true;
                        character.style.setProperty("--flip", "-100%");
                        flip_old_x = x;
                    }
                }

                // atualiza posição
                character.style.setProperty("--x", x * 100 + "%");
                character.style.setProperty("--y", y * 100 + "%");
                character.style.setProperty("--z", String(Math.floor(y * 1000)));
            });
        });

        return character;
    }
}

let pos_update_timeout = 0;
const pos_update_timeout_ms = 500;
let last_sent_position_x = NaN;
let last_sent_position_y = NaN;

function update_position(x: number, y: number) {

    if (!Number.isNaN(last_sent_position_x) && Number.isNaN(last_sent_position_y)) {
        const distance = (last_sent_position_x - x) * (last_sent_position_x - x) + (last_sent_position_y - y) * (last_sent_position_y - y);
        const max_distance = 0.1;

        if (distance > max_distance * max_distance) {
            // se a mudança for maior que max_distance% do tamanho da sala, atualiza logo
            // isso serve para mandar menos mensagems ao servidor
            last_sent_position_x = x;
            last_sent_position_y = y;
            client.send({ cmd: "Player", cid: client.cid, x, y });
        }
    } else {
        last_sent_position_x = x;
        last_sent_position_y = y;
        client.send({ cmd: "Player", cid: client.cid, x, y });
    }

    // e também atualiza depois
    clearTimeout(pos_update_timeout);
    pos_update_timeout = window.setTimeout(() => {
        last_sent_position_x = x;
        last_sent_position_y = y;
        client.send({ cmd: "Player", cid: client.cid, x, y });
    }, pos_update_timeout_ms);
}
