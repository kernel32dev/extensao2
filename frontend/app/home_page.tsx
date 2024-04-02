import * as socket from "./socket";

/** a página que é mostrada quando o usuário ainda não está conectado */
export function HomePage(): Elems {
    return (
        <div class="home-page">
            <Stars count={300} />
            <div class="home-content">
                <h1>Extensão 2.0</h1>
                <p class="home-game-description">
                    Este é um jogo onde vários jogadores competem como dois times
                </p>
                <div class="home-choices">
                    <div class="home-choice">
                        <h3>Se você for um estudante:</h3>
                        <h4>Entre na sala pelo código!</h4>
                        <br />
                        <input type="text" onInput={join_room} />
                    </div>
                    <div class="home-choice">
                        <h3>Se você for um professor:</h3>
                        <h4>Clique aqui para criar a sala!</h4>
                        <br />
                        <button onClick={open_room}>Criar sala</button>
                    </div>
                </div>
            </div>
        </div>
    )
    function join_room(this: HTMLInputElement, ev: InputEvent) {
        const room_id_regex = /^[BCDFGHJKLMNPQRSTVWXYZ][AEIOU][BCDFGHJKLMNPQRSTVWXYZ]$/;
        const value = this.value.toUpperCase();
        if (room_id_regex.test(value)) {
            socket.connect({ mode: "join", room: value });
        }
    }
    function open_room() {
        socket.connect({ mode: "open" });
    }
}

/** uma função que produz um elemento `<div class="home-stars" />` contendo vários `<div class="home-star" />` */
function Stars({ count }: { count: number }): Elems {
    const time = 60;
    const stars = <div class="home-stars" />;
    for (let i = 0; i < count; i++) {
        const star = <div class="home-star" /> as HTMLDivElement;
        const angle = Math.random() * Math.PI * 2;
        const delay = Math.random() * time;
        star.style.setProperty("--rot", angle + "rad");
        star.style.setProperty("--from-x", "50%");
        star.style.setProperty("--from-y", "50%");
        star.style.setProperty("--to-x", Math.cos(angle) * 150 + "%");
        star.style.setProperty("--to-y", Math.sin(angle) * 150 + "%");
        star.style.setProperty("--delay", "-" + delay + "s");
        star.style.setProperty("--time", time + "s");
        stars.appendChild(star);
    }
    return stars;
}

css`${{ __filename, __line }}

.home-page {
    width: 100%;
    max-width: 100%;
    min-height: 100vh;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}
.home-content {
    max-width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 5em;
}
.home-game-description {
    max-width: 50vw;
    margin: 1em;
    text-align: center;
}
.home-choices {
    display: flex;
    gap: 1em;
    flex-direction: row;
    flex-wrap: wrap;
    max-width: 100%;
    justify-content: center;
    align-items: stretch;
}
.home-choice {
    text-align: center;
    border: 1px solid black;
    padding: 1em;
    width: 300px;
}
.home-stars {
    position: absolute;
    user-select: none;
    pointer-events: none;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    z-index: -1;
}
.home-star {
    position: absolute;
    user-select: none;
    pointer-events: none;
    width: 10px;
    height: 3px;
    background-color: #00000033;
    transform: rotate(var(--rot));
    animation: home-shooting-star var(--time) linear var(--delay) infinite;
}

@keyframes home-shooting-star {
    0% {
        top: var(--from-y);
        left: var(--from-x);
        opacity: 0;
    }
    30% {
        opacity: 1;
    }
    100% {
        top: var(--to-y);
        left: var(--to-x);
    }
}
`