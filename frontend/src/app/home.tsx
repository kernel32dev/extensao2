import { Page } from "./app";
import "./home.css";

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
