import { Derived, Effect } from "rubedo";
import "./Confetti.css";

export default function Confetti({ team, count }: { team: Derived<boolean | undefined>, count: number }) {
    // let confetti = Array.from(document.getElementsByClassName("confetti"));
    // for (let i = 0; i < confetti.length; i++) {
    //     confetti[i].remove();
    // }
    const scoreboard = <div /> as HTMLElement;
    new Effect(scoreboard, () => {
        const x = team();
        if (x !== undefined) {
            scoreboard.style.setProperty("--color-fg", x ? "#00f" : "#f00");
            scoreboard.style.setProperty("--color-bg", x ? "#008" : "#800");
            scoreboard.style.removeProperty("display");
        } else {
            scoreboard.style.removeProperty("--color-fg");
            scoreboard.style.removeProperty("--color-bg");
            scoreboard.style.setProperty("display", "none");
        }
    });
    function r(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }
    for (let i = 0; i < count; i++) {
        const fromx = r(-10, 110);
        const fromy = -10;
        const tox = fromx + r(-10, 10);
        const toy = 110;
        const rotx = r(0, 1);
        const roty = r(0, 1);
        const rotz = r(0, 1);
        const rot = r(0, 45);
        const time = r(3, 4);
        const delay = -r(0, time);
        const rot_time = r(0.5, 1.25);
        scoreboard.insertAdjacentHTML('afterbegin', `<div class="confetti" style="--fromx: ${fromx}%; --fromy: ${fromy}%; --tox: ${tox}%; --toy: ${toy}%; --rotx: ${rotx}; --roty: ${roty}; --rotz: ${rotz}; --rot: ${rot}deg; --time: ${time}s; --delay: ${delay}s; --rot-time: ${rot_time}s;"></div>`);
    }
    return scoreboard;
}
