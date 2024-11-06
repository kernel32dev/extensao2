import "./Stars.css";
import { useEffect, useRef } from "react";

export default function Stars({ count }: { count: number }) {
    const starsRef = useRef<HTMLDivElement>(null);
    const time = 60;
  
    useEffect(() => {
      if (starsRef.current) {
        starsRef.current.innerHTML = ''; // Limpa o container ao recarregar
  
        for (let i = 0; i < count; i++) {
          const star = document.createElement('div');
          star.className = 'home-star';
          const angle = Math.random() * Math.PI * 2;
          const delay = Math.random() * time;
  
          star.style.setProperty('--rot', angle + 'rad');
          star.style.setProperty('--from-x', '50%');
          star.style.setProperty('--from-y', '50%');
          star.style.setProperty('--to-x', Math.cos(angle) * 150 + '%');
          star.style.setProperty('--to-y', Math.sin(angle) * 150 + '%');
          star.style.setProperty('--delay', '-' + delay + 's');
          star.style.setProperty('--time', time + 's');
  
          starsRef.current.appendChild(star);
        }
      }
    }, [count, time]);
  
    return <div className="home-stars" ref={starsRef}></div>;
  };
  