import { Page } from "./app";

export function HomePage(curpage: State<Page>): Elems {
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
                    </div>
                    <div class="home-choice">
                        <h3>Se você for um professor:</h3>
                        <h4>Clique aqui para criar a sala!</h4>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Stars({count}: {count: number}): Elems {
    const time = 60;
    let stars = <div class="home-stars"/>;
    for (let i = 0; i < count; i++) {
        let star = <div class="home-star" /> as HTMLDivElement;
        let angle = Math.random() * Math.PI * 2;
        star.style.setProperty("--rot", angle + "rad");
        star.style.setProperty("--from-x", "50%");
        star.style.setProperty("--from-y", "50%");
        star.style.setProperty("--to-x", Math.cos(angle) * 150 + "%");
        star.style.setProperty("--to-y", Math.sin(angle) * 150 + "%");
        star.style.setProperty("--delay", "-" + Math.random() * time + "s");
        star.style.setProperty("--time", time + "s");
        stars.appendChild(star);
    }
    return stars;
}

css`${{__filename, __line}}

.home-page {
    width: 100%;
    min-height: 100vh;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}
.home-content {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.home-game-description {
    max-width: 50vw;
    margin: 1em;
    text-align: center;
}
.home-choices {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
    gap: 1em;
}
.home-choice {
    text-align: center;
    border: 1px solid black;
    padding: 1em;
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