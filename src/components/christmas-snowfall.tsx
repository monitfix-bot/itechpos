"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Snowflake = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  swing: number;
  isCrystal: boolean;
};

export function ChristmasSnowfall() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // 28 gentle, festive snowflakes across the full screen
    const count = 28;
    const flakes: Snowflake[] = [];

    for (let i = 0; i < count; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: 0.55 + Math.random() * 0.75, // gentle slow fall
        size: 3 + Math.random() * 4,
        opacity: 0.6 + Math.random() * 0.35,
        swing: Math.random() * Math.PI * 2,
        isCrystal: i % 4 === 0, // 25% are delicate 6-pointed ice crystals
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      flakes.forEach((f) => {
        f.swing += 0.02;
        f.y += f.vy;
        f.x += f.vx + Math.sin(f.swing) * 0.5;

        // Wrap around screen boundaries
        if (f.y > height + 10) {
          f.y = -10;
          f.x = Math.random() * width;
        }
        if (f.x > width + 10) f.x = -10;
        if (f.x < -10) f.x = width + 10;

        ctx.save();

        if (f.isCrystal) {
          // Delicate 6-pointed ice crystal snowflake
          const r = f.size * 1.1;
          ctx.strokeStyle = `rgba(255, 255, 255, ${f.opacity})`;
          ctx.lineWidth = 1;
          ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
          ctx.shadowBlur = 4;
          ctx.beginPath();
          for (let a = 0; a < 3; a++) {
            const rad = (a * Math.PI) / 3 + f.swing * 0.4;
            ctx.moveTo(f.x - Math.cos(rad) * r, f.y - Math.sin(rad) * r);
            ctx.lineTo(f.x + Math.cos(rad) * r, f.y + Math.sin(rad) * r);
          }
          ctx.stroke();
        } else {
          // Soft glowing snow orb
          ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
          ctx.shadowColor = "rgba(255, 255, 255, 0.85)";
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[45] overflow-hidden"
    />,
    document.body
  );
}
