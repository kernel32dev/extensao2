import seedrandom from "seedrandom";
import { useEffect, useMemo, useState } from "react";
import "./WordHunt.css";
import type { GameChallenge } from "../App";
import WordHuntBoards from "./WordHuntBoards.json";

type WordHuntBoardsType = {
  [words_set_id: string]: {
    size: number,
    words: string[],
  }
};

export type GameChallengeWordHunt = GameChallenge & { challenge: { id: "WordHunt" } };

type Point = { x: number, y: number };
type Rect = { x1: number, y1: number, x2: number, y2: number };

export default function WordHunt({ game, onAnswer }: { game: GameChallengeWordHunt, onAnswer(index: number): void }) {
  const { seed, answers } = game.challenge;
  const { size, words } = (WordHuntBoards as WordHuntBoardsType)[game.challenge.words_set_id];
  const { letters, wordRects } = useMemo(() => genLetters(seed, size, words), [seed, size, words]);
  const [selectStart, setSelectStart] = useState<Point | null>(null);
  const [lastError, setLastError] = useState<Rect | null>(null);
  const eachCell = (callback: (x: number, y: number, i: number) => JSX.Element) => {
    const arr = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        arr.push(callback(x, y, x + y * size));
      }
    }
    return arr;
  };
  useEffect(() => console.log("Answers: ", answers), [answers]);
  useEffect(() => {
    // habilita zoom com gestos
    const meta = document.querySelector("meta[name=viewport]") as HTMLMetaElement | null;
    if (!meta) return () => { };
    const old = meta.content;
    meta.content = "width=device-width, initial-scale=1";
    return () => meta.content = old;
  }, []);
  const tryRect = (rect: Rect) => {
    setSelectStart(null);
    const index = wordRects.findIndex(x => x.x1 == rect.x1 && x.y1 == rect.y1 && x.x2 == rect.x2 && x.y2 == rect.y2);
    if (index == -1) {
      setLastError(rect);
      return;
    }
    if (answers.find(x => x.index == index)) return;
    onAnswer(index);
  };
  const getColorClass = (x: number, y: number) => {
    if (selectStart && selectStart.x == x && selectStart.y == y) return "first-selected";
    for (const { index, team } of answers) {
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
    if (selectStart && (selectStart.x == x || selectStart.y == y)) return "possible-second-selected";
    return "";
  };
  const getErrorClass = (x: number, y: number) => lastError
    && x >= lastError.x1
    && y >= lastError.y1
    && x <= lastError.x2
    && y <= lastError.y2
    ? "wordhunt-error"
    : "";
  const fontSize = 2.8 * 20 / size;
  return (
    <div className="wordhunt-screen">
      <h1>Caça-Palavras</h1>
      <p>
        Encontre as palavras antes do time oposto e contribua para a vitória do seu time!
        <br />
        Todo mundo está olhando para o mesmo jogo.
      </p>
      <div className="wordhunt-box" style={{
        gridTemplateColumns: " 1fr".repeat(size),
        gridTemplateRows: " 1fr".repeat(size),
        fontSize: `min(${fontSize}vw, ${fontSize}vh)`
      }}>
        {eachCell((x, y, i) => (
          <span
            key={`${x}:${y}`}
            className={`${getColorClass(x, y)} ${getErrorClass(x, y)}`}
            onClick={() => {
              if (selectStart && selectStart.x == x && selectStart.y == y) {
                setSelectStart(null);
              } else if (selectStart && selectStart.x == x) {
                tryRect({
                  x1: x,
                  y1: Math.min(y, selectStart.y),
                  x2: x,
                  y2: Math.max(y, selectStart.y),
                });
              } else if (selectStart && selectStart.y == y) {
                tryRect({
                  x1: Math.min(x, selectStart.x),
                  y1: y,
                  x2: Math.max(x, selectStart.x),
                  y2: y,
                });
              } else {
                setSelectStart({ x, y });
                setLastError(null);
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