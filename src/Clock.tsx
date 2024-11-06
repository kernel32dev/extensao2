import "./Clock.css";
import { useEffect, useState } from "react";

export default function Clock({remaining_ms}: {remaining_ms: number}) {
    const [lastRemaining, setLastRemaining] = useState(NaN);
    const [gameEnd, setGameEnd] = useState(NaN);
    const [lastVisualSecondsRemaining, setLastVisualSecondsRemaining] = useState(0);
    if (lastRemaining != remaining_ms) {
        setLastRemaining(remaining_ms);
        setLastVisualSecondsRemaining(remaining_ms * 0.001);
        setGameEnd(performance.now() + remaining_ms);
    }
    useEffect(() => {
        const interval = setInterval(() => {
            setLastVisualSecondsRemaining(Math.max(0, (gameEnd - performance.now()) * 0.001));
        });
        return () => clearInterval(interval);
    }, [gameEnd]);

    const s = Math.floor(lastVisualSecondsRemaining) % 60;
    const m = Math.floor((lastVisualSecondsRemaining - s) / 60);
    return (
        <div className="clock-div">
            <h1>{m}:{String(s).padStart(2, "0")}</h1>
        </div>
    );
}