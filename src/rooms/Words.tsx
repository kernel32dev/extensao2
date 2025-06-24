import "./Words.css"
import seedrandom from "seedrandom";
import WordHuntBoards from "./Words.json";
import { Derived, State } from "rubedo";
import { Elems } from "rubedo-dom";
import { client } from "../client";
import Timer from "./Timer";

type WordHuntBoardsType = {
    [words_set_id: string]: {
        size: number,
        words: string[],
    }
};

type Point = { x: number, y: number };
type Rect = { x1: number, y1: number, x2: number, y2: number };

export default function Words({ }: {}) {
    const { size, words } = (WordHuntBoards as WordHuntBoardsType)["default"];
    const { letters, wordRects } = genLetters("semente fixa", size, words);

    const selectStart = new State<Point | null>(null);
    const lastError = new State<Rect | null>(null);

    const eachCell = (callback: (x: number, y: number, i: number) => Elems) => {
      const arr = [];
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          arr.push(callback(x, y, x + y * size));
        }
      }
      return arr;
    };
    const tryRect = (rect: Rect) => {
        selectStart.set(null);
        const index = wordRects.findIndex(x => x.x1 == rect.x1 && x.y1 == rect.y1 && x.x2 == rect.x2 && x.y2 == rect.y2);
        if (index == -1) {
          lastError.set(rect);
          return;
        }
        if (client.answers.find(x => x.index == index)) return;
        client.send({
            cmd: "Answer",
            index,
            team: client.me().team,
        });
      };
      const getColorClass = (x: number, y: number) => {
        const ss = selectStart();
        if (ss && ss.x == x && ss.y == y) return "first-selected";
        for (const { index, team } of client.answers) {
          const rect = wordRects[index];
          if (
            x >= rect.x1
            && y >= rect.y1
            && x <= rect.x2
            && y <= rect.y2
          ) {
            return team ? "blue-answer" : "red-answer";
          }
        }
        if (ss && (ss.x == x || ss.y == y)) return "possible-second-selected";
        return "";
      };
      const getErrorClass = (x: number, y: number) => {
        const le = lastError();
        return le
        && x >= le.x1
        && y >= le.y1
        && x <= le.x2
        && y <= le.y2
        ? "wordhunt-error"
        : ""
      };
      const fontSize = 2.8 * 20 / size;
    return (
        <div class="wordhunt-screen">
            <Timer position="top-left" />
            <h1>Caça-Palavras</h1>
            <p>
                Encontre as palavras antes do time oposto e contribua para a vitória do seu time!
                <br />
                Todo mundo está olhando para o mesmo jogo.
                <br />
                Para pegar uma palavra, selecione a primeira letra e então toque na a última
                <br />
                Palavras restantes: {new Derived(() => words.length - client.answers.length)}
            </p>
            <div class="wordhunt-box" style={{
                gridTemplateColumns: " 1fr".repeat(size),
                gridTemplateRows: " 1fr".repeat(size),
                fontSize: `min(${fontSize}vw, ${fontSize}vh)`
            }}>
                {eachCell((x, y, i) => (
                    <span
                        class={[new Derived(() => getColorClass(x, y)), new Derived(() => getErrorClass(x, y))]}
                        onClick={() => {
                            const ss = selectStart();
                            if (ss && ss.x == x && ss.y == y) {
                                selectStart.set(null);
                            } else if (ss && ss.x == x) {
                                tryRect({
                                    x1: x,
                                    y1: Math.min(y, ss.y),
                                    x2: x,
                                    y2: Math.max(y, ss.y),
                                });
                            } else if (ss && ss.y == y) {
                                tryRect({
                                    x1: Math.min(x, ss.x),
                                    y1: y,
                                    x2: Math.max(x, ss.x),
                                    y2: y,
                                });
                            } else {
                                selectStart.set({ x, y });
                                lastError.set(null);
                            }
                        }}
                    >
                        {letters[i]}
                    </span>
                ))}
            </div>
        </div>
    );
}

function genLetters(seed: string, size: number, words: string[]) {
    const rng = seedrandom(seed);
    const board = Array(size * size).fill("");
    const wordRects = [];
    for (let i = 0; i < words.length; i++) {
        while (true) {
            // TODO! não esquecer de mudar para toLocaleUpperCase quando sair do desenvolvimento
            const word = words[i].toLocaleLowerCase();
            const u = Math.floor(rng() * size);
            const v = Math.floor(rng() * (size - word.length + 1));
            const horz = rng() > 0.5;
            let j;
            for (j = 0; j < word.length; j++) {
                if (board[horz ? j + v + u * size : u + (v + j) * size]) break;
            }
            if (j < word.length) continue;
            for (j = 0; j < word.length; j++) {
                board[horz ? j + v + u * size : u + (v + j) * size] = word[j];
            }
            if (horz) {
                wordRects.push({
                    x1: v,
                    y1: u,
                    x2: v + word.length - 1,
                    y2: u,
                });
            } else {
                wordRects.push({
                    x1: u,
                    y1: v,
                    x2: u,
                    y2: v + word.length - 1,
                });
            }
            break;
        }
    }
    for (let i = 0; i < board.length; i++) {
        board[i] = board[i] || genRandomLetter(rng);
    }
    return {
        letters: board.join(""),
        wordRects,
    };
}

function genRandomLetter(rng: () => number) {
    return String.fromCodePoint(65 + Math.floor(rng() * 26));
}