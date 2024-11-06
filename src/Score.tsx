import { useEffect, useRef, useState } from "react";
import "./Score.css";
import Stars from "./Stars";
import Matter from 'matter-js';
import Clock from "./Clock";

export default function ScorePage({ score, remaining, onStop, onExtra, onReturn }: {
  score: [number, number] | null,
  remaining: number,
  onStop?(): void,
  onExtra?(seconds: number): void,
  onReturn?(): void,
}) {
  const redBalls = score ? score[0] : 0;
  const blueBalls = score ? score[1] : 0;
  return (
    <div className="score-page">
      <Stars count={300} />
      <Clock remaining_ms={remaining} />
      <div className="score-bucket-row">
        <div className="score-bucket-col">
          <Bucket team="red" balls={redBalls} />
          <div className="score-bucket-title red">
            Time vermelho: <br /> {redBalls} pontos
          </div>
        </div>
        <div className="score-bucket-col">
          <Bucket team="blue" balls={blueBalls} />
          <div className="score-bucket-title blue">
            Time azul: <br /> {blueBalls} pontos
          </div>
        </div>
      </div>
      <div className="score-title">
        <h1>Projeto de Extensão</h1>
      </div>
      <div className="score-control">
        {onExtra && <button onClick={() => onExtra(10)}>Adicionar mais 10 segundos</button>}
        {onStop && <button onClick={() => onStop()}>Encerrar o jogo</button>}
        {onReturn && <button onClick={() => onReturn()}>Voltar para o lobby</button>}
      </div>
    </div>
  );
}
function Bucket({ team, balls }: { team: "red" | "blue", balls: number }) {
  const sceneRef = useRef<HTMLDivElement>(null!);
  const engine = useRef<Matter.Engine>(null!);
  const render = useRef<Matter.Render>(null!);
  const createRemainingBalls = useRef<((new_ball_count: number) => void) | null>(null);

  if (createRemainingBalls.current) {
    createRemainingBalls.current(balls);
  }

  useEffect(() => {
    const { Render, Runner, World, Bodies, Body } = Matter;

    if (!engine.current) {
      engine.current = Matter.Engine.create();
      console.log("gravity: ", engine.current.gravity);
    }

    // Configuração básica de renderização
    const width = 300;
    const height = 500;
    const radius = 10;

    render.current = Render.create({
      element: sceneRef.current,
      engine: engine.current,
      options: {
        width,
        height,
        wireframes: false,
        background: '#ffffff',
      },
    });

    const barrier = 80;
    const vbarrier = 10;

    // Cria o retângulo como limite
    const container = [
      Bodies.rectangle(width * 0.5, height + barrier * 0.5 - vbarrier, width, barrier, { isStatic: true, render: { fillStyle: team }, restitution: 1 }),

      Bodies.rectangle(vbarrier - barrier * 0.5, height * 0.5, barrier, height * 1000, { isStatic: true, render: { opacity: 0 }, restitution: 1 }),
      Bodies.rectangle(vbarrier - barrier * 0.5, height - width * 0.5, barrier, width, { isStatic: true, render: { fillStyle: team }, restitution: 1 }),
      Bodies.rectangle(width - vbarrier + barrier * 0.5, height * 0.5, barrier, height * 1000, { isStatic: true, render: { opacity: 0 }, restitution: 1 }),
      Bodies.rectangle(width - vbarrier + barrier * 0.5, height - width * 0.5, barrier, width, { isStatic: true, render: { fillStyle: team }, restitution: 1 }),
    ];

    // Adiciona o retângulo ao mundo
    World.add(engine.current.world, container);

    let ball_count = 0;

    // Função para criar bolinhas
    createRemainingBalls.current = (new_ball_count: number) => {
      for (; ball_count < new_ball_count; ball_count++) {
        const x = width * 0.5 + (Math.random() - 0.5) * (width - radius * 2) + radius;
        const y = -radius - Math.random() * height;
        const ball = Bodies.circle(x, y, radius * 2, {
          restitution: 1, // Bouncy
          friction: 0,
          render: { fillStyle: team },
        });
        Body.applyForce(ball, { x, y }, { x: (Math.random() - 0.5) * 0.05, y: Math.random() * 0.01 });
        World.add(engine.current.world, ball);
      }
    };

    createRemainingBalls.current(balls);

    // Inicializa e executa o motor e renderização
    const runner = Runner.create();
    Runner.run(runner, engine.current);
    Render.run(render.current);

    // Cleanup ao desmontar o componente
    return () => {
      Matter.Render.stop(render.current);
      Runner.stop(runner);
      Matter.World.clear(engine.current.world, false);
      Matter.Engine.clear(engine.current);
      render.current.canvas.remove();
      render.current.canvas = null!;
      render.current.context = null!;
      render.current.textures = {};
    };
  }, []);

  return <div className={"score-bucket " + team} ref={sceneRef} />;
};

