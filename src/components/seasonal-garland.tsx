"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ChristmasSnowfall } from "./christmas-snowfall";
import { cn } from "@/lib/utils";

export function SeasonalGarland({ theme }: { theme: string }) {
  if (!theme) return null;

  switch (theme) {
    case "halloween":
      return <HalloweenGarland />;
    case "christmas":
      return <ChristmasGarland />;
    case "tet-trung-thu":
      return <TrungThuGarland />;
    case "quoc-khanh":
      return <QuocKhanhGarland />;
    case "tet-nguyen-dan":
      return <TetNguyenDanGarland />;
    case "tet-doan-ngo":
      return <TetDoanNgoGarland />;
    default:
      return null;
  }
}

// ============================================================================
// 1. HALLOWEEN GARLAND (3 BATS HORIZONTAL FLIGHT WITH RANDOM UP/DOWN SWOOPS)
// ============================================================================
function HalloweenBats() {
  const [mounted, setMounted] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");

  const bat1Ref = useRef<HTMLDivElement | null>(null);
  const bat2Ref = useRef<HTMLDivElement | null>(null);
  const bat3Ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let rafId: number;
    let spawnTimerId: ReturnType<typeof setTimeout>;
    let isRunning = false;

    const startFlight = () => {
      isRunning = true;
      setIsActive(true);

      const dir: "ltr" | "rtl" = Math.random() > 0.25 ? "ltr" : "rtl";
      setDirection(dir);

      const screenW = typeof window !== "undefined" ? window.innerWidth : 1200;
      const screenH = typeof window !== "undefined" ? window.innerHeight : 800;

      // Base altitude across screen (22% to 65% of viewport height)
      const baseTopY = Math.floor(Math.random() * (screenH * 0.43)) + screenH * 0.22;
      // Steady horizontal cruising speed (takes ~13.5s - 15s to cross)
      const durationSeconds = 14;
      const totalDist = screenW + 360;
      const speed = dir === "ltr" ? totalDist / (durationSeconds * 60) : -totalDist / (durationSeconds * 60);

      let x = dir === "ltr" ? -140 : screenW + 140;

      const now = performance.now();
      const batSims = [
        {
          ref: bat1Ref,
          baseOffsetX: 0,
          baseOffsetY: 0,
          currentY: 0,
          targetY: 0,
          nextDecision: now + 400,
        },
        {
          ref: bat2Ref,
          baseOffsetX: 65,
          baseOffsetY: -32,
          currentY: 0,
          targetY: 0,
          nextDecision: now + 900,
        },
        {
          ref: bat3Ref,
          baseOffsetX: 125,
          baseOffsetY: 38,
          currentY: 0,
          targetY: 0,
          nextDecision: now + 1500,
        },
      ];

      const tick = () => {
        if (!isRunning) return;
        x += speed;

        const curTime = performance.now();

        batSims.forEach((bat) => {
          if (!bat.ref.current) return;

          // Organic, unpredictable decisions to swoop up, dive down, or level off
          if (curTime >= bat.nextDecision) {
            // Random target deviation between -45px (climb) and +45px (dive)
            bat.targetY = (Math.random() - 0.5) * 90;
            // Next random decision occurs in 1.2s to 3.0s
            bat.nextDecision = curTime + 1200 + Math.random() * 1800;
          }

          // Smooth easing towards target altitude (fluid biological aerodynamics)
          bat.currentY += (bat.targetY - bat.currentY) * 0.035;

          // Realistic pitch rotation matching vertical climb/dive
          const dy = bat.targetY - bat.currentY;
          const pitch = dir === "ltr" ? dy * 0.3 : -dy * 0.3;
          const clampedPitch = Math.max(Math.min(pitch, 16), -16);

          const finalX = dir === "ltr" ? x - bat.baseOffsetX : x + bat.baseOffsetX;
          const finalY = baseTopY + bat.baseOffsetY + bat.currentY;

          bat.ref.current.style.transform = `translate3d(${finalX.toFixed(1)}px, ${finalY.toFixed(1)}px, 0) rotate(${clampedPitch.toFixed(1)}deg)`;
        });

        // Check if all bats have cleared the opposite screen border
        const isDone =
          dir === "ltr" ? x - 135 > screenW + 30 : x + 135 < -30;

        if (isDone) {
          isRunning = false;
          setIsActive(false);
          // Low frequency: next random flight in 30s to 45s
          const nextInterval = 30000 + Math.random() * 15000;
          spawnTimerId = setTimeout(startFlight, nextInterval);
        } else {
          rafId = requestAnimationFrame(tick);
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    // First flight starts after 1.2s for immediate verification
    spawnTimerId = setTimeout(startFlight, 1200);

    return () => {
      isRunning = false;
      cancelAnimationFrame(rafId);
      clearTimeout(spawnTimerId);
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 pointer-events-none z-[45] overflow-hidden select-none transition-opacity duration-300",
        isActive ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Bat 1: Leader (46px) */}
      <div
        ref={bat1Ref}
        className="absolute top-0 left-0 will-change-transform"
        style={{ transform: "translate3d(-200px, -200px, 0)" }}
      >
        <BatSvg size={46} direction={direction} batIndex={1} />
      </div>

      {/* Bat 2: Upper Wingman (38px) */}
      <div
        ref={bat2Ref}
        className="absolute top-0 left-0 will-change-transform"
        style={{ transform: "translate3d(-200px, -200px, 0)" }}
      >
        <BatSvg size={38} direction={direction} batIndex={2} />
      </div>

      {/* Bat 3: Lower Wingman (36px) */}
      <div
        ref={bat3Ref}
        className="absolute top-0 left-0 will-change-transform"
        style={{ transform: "translate3d(-200px, -200px, 0)" }}
      >
        <BatSvg size={36} direction={direction} batIndex={3} />
      </div>
    </div>,
    document.body
  );
}

function BatSvg({
  size,
  direction,
  batIndex,
}: {
  size: number;
  direction: "ltr" | "rtl";
  batIndex: 1 | 2 | 3;
}) {
  const dur = batIndex === 1 ? "0.32s" : batIndex === 2 ? "0.27s" : "0.35s";
  const bodyBobDur = batIndex === 1 ? "0.36s" : batIndex === 2 ? "0.31s" : "0.39s";

  return (
    <svg
      className={cn(
        "overflow-visible drop-shadow-[0_0_8px_rgba(192,132,252,0.85)]",
        direction === "rtl" && "-scale-x-100"
      )}
      style={{ width: `${size}px`, height: `${size * 0.5}px` }}
      viewBox="0 0 80 40"
    >
      {/* Left Wing (Hinged at shoulder 38, 18) with Hardware Accelerated CSS Flap */}
      <g transform="translate(38, 18)">
        <g className={batIndex === 1 ? "animate-bat-wing-left-1" : batIndex === 2 ? "animate-bat-wing-left-2" : "animate-bat-wing-left-3"}>
          <path
            d="M 0,0 C -10,-8 -22,-12 -36,-5 C -28,3 -20,6 -12,6 C -8,10 -3,8 0,4 Z"
            fill="#3b1d61"
            stroke="#c084fc"
            strokeWidth="0.95"
          />
          {/* Subtle wing bones */}
          <path d="M 0,0 Q -18,-6 -36,-5" stroke="#e9d5ff" strokeWidth="0.65" fill="none" opacity="0.6" />
          <path d="M -8,-2 Q -16,3 -22,6" stroke="#e9d5ff" strokeWidth="0.5" fill="none" opacity="0.5" />
        </g>
      </g>

      {/* Right Wing (Hinged at shoulder 42, 18) with Hardware Accelerated CSS Flap */}
      <g transform="translate(42, 18)">
        <g className={batIndex === 1 ? "animate-bat-wing-right-1" : batIndex === 2 ? "animate-bat-wing-right-2" : "animate-bat-wing-right-3"}>
          <path
            d="M 0,0 C 10,-8 22,-12 36,-5 C 28,3 20,6 12,6 C 8,10 3,8 0,4 Z"
            fill="#3b1d61"
            stroke="#c084fc"
            strokeWidth="0.95"
          />
          {/* Subtle wing bones */}
          <path d="M 0,0 Q 18,-6 36,-5" stroke="#e9d5ff" strokeWidth="0.65" fill="none" opacity="0.6" />
          <path d="M 8,-2 Q 16,3 22,6" stroke="#e9d5ff" strokeWidth="0.5" fill="none" opacity="0.5" />
        </g>
      </g>

      {/* Center Body & Head */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 0,-2.5; 0,0"
          dur={bodyBobDur}
          repeatCount="indefinite"
        />
        {/* Pointy ears */}
        <polygon points="37.5,12 39,5.5 40.5,11" fill="#3b1d61" stroke="#c084fc" strokeWidth="0.7" />
        <polygon points="42.5,11 44,5.5 45.5,12" fill="#3b1d61" stroke="#c084fc" strokeWidth="0.7" />
        {/* Head */}
        <circle cx="41.5" cy="13" r="3.2" fill="#3b1d61" stroke="#c084fc" strokeWidth="0.7" />
        {/* Glowing amber eyes */}
        <circle cx="40.3" cy="12.5" r="0.85" fill="#fbbf24" />
        <circle cx="42.7" cy="12.5" r="0.85" fill="#fbbf24" />
        {/* Torso */}
        <ellipse cx="41.5" cy="20" rx="3.5" ry="5.8" fill="#3b1d61" stroke="#c084fc" strokeWidth="0.7" />
        {/* Feet/tail */}
        <polygon points="40,25 41.5,28 43,25" fill="#3b1d61" />
      </g>
    </svg>
  );
}

function HalloweenGarland() {
  return (
    <>
      {/* 4. Horizontal Flying Bats (Portal to viewport) */}
      <HalloweenBats />

      <div className="absolute top-full left-0 right-0 z-30 pointer-events-none select-none overflow-visible">
        {/* 1. Spider Web (Left Corner) with Dropping/Crawling Spider on Silk Thread */}
        <div className="absolute top-0 left-0 w-28 h-28 sm:w-36 sm:h-36 pointer-events-none overflow-visible">
          <svg
            className="size-full text-white/20 dark:text-white/25 overflow-visible"
            viewBox="0 0 100 100"
            fill="none"
          >
            {/* Web spokes */}
            <line x1="0" y1="0" x2="98" y2="12" stroke="currentColor" strokeWidth="0.8" />
            <line x1="0" y1="0" x2="84" y2="44" stroke="currentColor" strokeWidth="0.8" />
            <line x1="0" y1="0" x2="52" y2="78" stroke="currentColor" strokeWidth="0.8" />
            <line x1="0" y1="0" x2="16" y2="96" stroke="currentColor" strokeWidth="0.8" />

            {/* Web arcs */}
            <path d="M 24,3 Q 20,12 4,24" stroke="currentColor" strokeWidth="0.6" />
            <path d="M 46,6 Q 38,23 7,46" stroke="currentColor" strokeWidth="0.6" />
            <path d="M 68,9 Q 58,35 10,68" stroke="currentColor" strokeWidth="0.6" />
            <path d="M 90,11 Q 78,44 14,90" stroke="currentColor" strokeWidth="0.6" />

            {/* SPIDER SILK THREAD (UNROLLS WHEN SPIDER DROPS & RETRACTS WHEN IT CLIMBS BACK) */}
            <line
              x1="46"
              y1="34"
              x2="46"
              y2="86"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="0.5"
              className="animate-spider-silk"
            />

            {/* COMPACT SPIDER (DROPS DOWN SILK, SWAYS, CLIMBS UP, HIDES FOR A WHILE) */}
            <g className="animate-spider-lifecycle">
              <g className="animate-spider-subtle">
                {/* Spider Body */}
                <ellipse cx="0" cy="0.6" rx="2.4" ry="3.0" fill="#7e22ce" />
                <circle cx="0" cy="-2.4" r="1.5" fill="#6b21a8" />
                <ellipse cx="0" cy="0.3" rx="1.2" ry="1.6" fill="#c084fc" opacity="0.65" />
                {/* 8 Legs */}
                <path d="M -1.8,-1.8 Q -4,-4.5 -5.5,-2.5" stroke="#a855f7" strokeWidth="0.65" strokeLinecap="round" fill="none" />
                <path d="M 1.8,-1.8 Q 4,-4.5 5.5,-2.5" stroke="#a855f7" strokeWidth="0.65" strokeLinecap="round" fill="none" />
                <path d="M -2.2,-0.3 Q -5.5,-1.5 -6,1" stroke="#a855f7" strokeWidth="0.65" strokeLinecap="round" fill="none" />
                <path d="M 2.2,-0.3 Q 5.5,-1.5 6,1" stroke="#a855f7" strokeWidth="0.65" strokeLinecap="round" fill="none" />
                <path d="M -2.2,1.5 Q -5.5,2.5 -5.5,5" stroke="#a855f7" strokeWidth="0.65" strokeLinecap="round" fill="none" />
                <path d="M 2.2,1.5 Q 5.5,2.5 5.5,5" stroke="#a855f7" strokeWidth="0.65" strokeLinecap="round" fill="none" />
                <path d="M -1.8,2.8 Q -4,5.5 -4.8,7.5" stroke="#a855f7" strokeWidth="0.65" strokeLinecap="round" fill="none" />
                <path d="M 1.8,2.8 Q 4,5.5 4.8,7.5" stroke="#a855f7" strokeWidth="0.65" strokeLinecap="round" fill="none" />
              </g>
            </g>
          </svg>
        </div>

        {/* 2. Spider Web (Right Corner) - Mirrored */}
        <div className="absolute top-0 right-0 w-28 h-28 sm:w-36 sm:h-36 pointer-events-none overflow-visible">
          <svg
            className="size-full text-white/20 dark:text-white/25 -scale-x-100"
            viewBox="0 0 100 100"
            fill="none"
          >
            <line x1="0" y1="0" x2="98" y2="12" stroke="currentColor" strokeWidth="0.8" />
            <line x1="0" y1="0" x2="84" y2="44" stroke="currentColor" strokeWidth="0.8" />
            <line x1="0" y1="0" x2="52" y2="78" stroke="currentColor" strokeWidth="0.8" />
            <line x1="0" y1="0" x2="16" y2="96" stroke="currentColor" strokeWidth="0.8" />

            <path d="M 24,3 Q 20,12 4,24" stroke="currentColor" strokeWidth="0.6" />
            <path d="M 46,6 Q 38,23 7,46" stroke="currentColor" strokeWidth="0.6" />
            <path d="M 68,9 Q 58,35 10,68" stroke="currentColor" strokeWidth="0.6" />
            <path d="M 90,11 Q 78,44 14,90" stroke="currentColor" strokeWidth="0.6" />
          </svg>
        </div>

        {/* 3. Repeating Garland Wire with Glowing Bulbs & Mini Pumpkins */}
        <svg className="w-full h-8 overflow-visible" preserveAspectRatio="none">
          <defs>
            <radialGradient id="halo-purple" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="halo-green" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#22c55e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="halo-orange" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fb923c" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
            </radialGradient>

            <pattern id="garland-hw" width="130" height="32" patternUnits="userSpaceOnUse">
              <path d="M 0,2 Q 65,14 130,2" stroke="#475569" strokeWidth="1" fill="none" opacity="0.75" />

              {/* Bulb 1: Purple */}
              <g transform="translate(14, 5)">
                <circle cx="0" cy="3" r="8" fill="url(#halo-purple)" />
                <rect x="-0.8" y="-2" width="1.6" height="2" fill="#334155" />
                <ellipse cx="0" cy="3" rx="2.4" ry="3.6" fill="#c084fc" />
                <circle cx="-0.8" cy="2" r="0.7" fill="#ffffff" opacity="0.7" />
              </g>

              {/* Bulb 2: Green */}
              <g transform="translate(34, 9)">
                <circle cx="0" cy="3" r="8" fill="url(#halo-green)" />
                <rect x="-0.8" y="-2" width="1.6" height="2" fill="#334155" />
                <ellipse cx="0" cy="3" rx="2.4" ry="3.6" fill="#4ade80" />
                <circle cx="-0.8" cy="2" r="0.7" fill="#ffffff" opacity="0.7" />
              </g>

              {/* Bulb 3: Orange */}
              <g transform="translate(54, 11)">
                <circle cx="0" cy="3" r="8" fill="url(#halo-orange)" />
                <rect x="-0.8" y="-2" width="1.6" height="2" fill="#334155" />
                <ellipse cx="0" cy="3" rx="2.4" ry="3.6" fill="#fb923c" />
                <circle cx="-0.8" cy="2" r="0.7" fill="#ffffff" opacity="0.7" />
              </g>

              {/* MINI PUMPKIN BULB */}
              <g transform="translate(74, 12)">
                <circle cx="0" cy="4" r="11" fill="url(#halo-orange)" />
                <rect x="-1" y="-2" width="2" height="2.5" fill="#16a34a" rx="0.5" />
                <ellipse cx="0" cy="4" rx="6.2" ry="4.8" fill="#f97316" />
                <ellipse cx="0" cy="4" rx="3.5" ry="4.6" fill="#ea580c" />
              </g>

              {/* Bulb 4: Purple */}
              <g transform="translate(94, 11)">
                <circle cx="0" cy="3" r="8" fill="url(#halo-purple)" />
                <rect x="-0.8" y="-2" width="1.6" height="2" fill="#334155" />
                <ellipse cx="0" cy="3" rx="2.4" ry="3.6" fill="#c084fc" />
                <circle cx="-0.8" cy="2" r="0.7" fill="#ffffff" opacity="0.7" />
              </g>

              {/* Bulb 5: Green */}
              <g transform="translate(114, 7)">
                <circle cx="0" cy="3" r="8" fill="url(#halo-green)" />
                <rect x="-0.8" y="-2" width="1.6" height="2" fill="#334155" />
                <ellipse cx="0" cy="3" rx="2.4" ry="3.6" fill="#4ade80" />
                <circle cx="-0.8" cy="2" r="0.7" fill="#ffffff" opacity="0.7" />
              </g>
            </pattern>
          </defs>

          <rect width="100%" height="32" fill="url(#garland-hw)" />
        </svg>
      </div>
    </>
  );
}

// ============================================================================
// 2. CHRISTMAS GARLAND (WITH SNOWFALL, FLYING SANTA SLEIGH & FESTIVE LIGHTS)
// ============================================================================
function ChristmasSanta() {
  const [mounted, setMounted] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const sleighRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let rafId: number;
    let spawnTimerId: ReturnType<typeof setTimeout>;
    let isRunning = false;

    const startFlight = () => {
      isRunning = true;
      setIsActive(true);

      const dir: "ltr" | "rtl" = Math.random() > 0.25 ? "ltr" : "rtl";
      setDirection(dir);

      const screenW = typeof window !== "undefined" ? window.innerWidth : 1200;
      const screenH = typeof window !== "undefined" ? window.innerHeight : 800;

      // Base altitude in upper screen (12% to 28% of viewport height)
      const baseTopY = Math.floor(Math.random() * (screenH * 0.16)) + screenH * 0.12;
      const durationSeconds = 16;
      const totalDist = screenW + 420;
      const speed = dir === "ltr" ? totalDist / (durationSeconds * 60) : -totalDist / (durationSeconds * 60);

      let x = dir === "ltr" ? -280 : screenW + 280;
      const startTime = performance.now();

      const tick = () => {
        if (!isRunning) return;
        x += speed;

        const elapsed = (performance.now() - startTime) / 1000;
        // Gentle undulating flight wave
        const waveY = Math.sin(elapsed * 1.1) * 16 + Math.cos(elapsed * 0.5) * 7;
        const pitch = Math.cos(elapsed * 1.1) * (dir === "ltr" ? -3.5 : 3.5);

        if (sleighRef.current) {
          sleighRef.current.style.transform = `translate3d(${x.toFixed(1)}px, ${(baseTopY + waveY).toFixed(1)}px, 0) rotate(${pitch.toFixed(1)}deg)`;
        }

        const isDone = dir === "ltr" ? x > screenW + 280 : x < -280;

        if (isDone) {
          isRunning = false;
          setIsActive(false);
          // Frequency: next flight in 32s to 48s
          const nextInterval = 32000 + Math.random() * 16000;
          spawnTimerId = setTimeout(startFlight, nextInterval);
        } else {
          rafId = requestAnimationFrame(tick);
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    // First flight starts after 1.5s so user immediately sees Santa
    spawnTimerId = setTimeout(startFlight, 1500);

    return () => {
      isRunning = false;
      cancelAnimationFrame(rafId);
      clearTimeout(spawnTimerId);
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 pointer-events-none z-[46] overflow-hidden select-none transition-opacity duration-500",
        isActive ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        ref={sleighRef}
        className="absolute top-0 left-0 will-change-transform"
        style={{ transform: "translate3d(-350px, -200px, 0)" }}
      >
        <SantaSleighSvg direction={direction} />
      </div>
    </div>,
    document.body
  );
}

function SantaSleighSvg({ direction }: { direction: "ltr" | "rtl" }) {
  return (
    <svg
      className={cn(
        "overflow-visible drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]",
        direction === "rtl" && "-scale-x-100"
      )}
      style={{ width: "240px", height: "70px" }}
      viewBox="0 0 240 70"
    >
      {/* 1. Trailing Stardust Sparkles */}
      <g opacity="0.9">
        <text x="5" y="48" fill="#fef08a" fontSize="13" className="animate-pulse">✦</text>
        <text x="18" y="32" fill="#fde047" fontSize="11" opacity="0.8">✧</text>
        <text x="14" y="58" fill="#facc15" fontSize="9" opacity="0.7">✦</text>
        <circle cx="26" cy="52" r="1.5" fill="#ffffff" />
        <circle cx="10" cy="22" r="1.2" fill="#fef08a" opacity="0.75" />
      </g>

      {/* 2. Golden Reins */}
      <path
        d="M 68,34 Q 112,44 148,34"
        stroke="#f59e0b"
        strokeWidth="1.2"
        strokeDasharray="3,1.5"
        fill="none"
        opacity="0.9"
      />
      <path
        d="M 68,34 Q 140,46 205,29"
        stroke="#f59e0b"
        strokeWidth="1.2"
        strokeDasharray="3,1.5"
        fill="none"
        opacity="0.9"
      />

      {/* 3. Santa's Sleigh & Gifts */}
      <g>
        {/* Golden Runners (Skids) */}
        <path
          d="M 32,60 C 45,62 88,62 98,56 C 104,52 104,46 100,44"
          stroke="#f59e0b"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M 46,58 L 52,50 M 80,58 L 76,50" stroke="#f59e0b" strokeWidth="1.8" />

        {/* Sleigh Carriage */}
        <path
          d="M 40,38 C 38,48 44,52 82,52 C 94,52 98,46 96,40 C 94,36 86,38 78,38 Z"
          fill="#b91c1c"
          stroke="#f59e0b"
          strokeWidth="1.2"
        />

        {/* Toy Sack & Gifts */}
        <ellipse cx="48" cy="34" rx="12" ry="10" fill="#92400e" stroke="#78350f" strokeWidth="1" />
        <rect x="42" y="22" width="7" height="7" fill="#16a34a" rx="1" />
        <rect x="48" y="20" width="8" height="8" fill="#eab308" rx="1" />

        {/* Santa Torso */}
        <ellipse cx="68" cy="34" rx="8" ry="9" fill="#dc2626" />
        <path d="M 62,34 Q 68,36 74,34" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

        {/* Santa Head & Beard */}
        <circle cx="68" cy="24" r="5" fill="#fecaca" />
        <path d="M 64,24 C 64,31 72,31 72,24 Z" fill="#ffffff" />
        <ellipse cx="68" cy="27" rx="4.5" ry="3.5" fill="#ffffff" />

        {/* Santa Hat */}
        <path d="M 63,22 Q 68,14 74,18 L 74,22 Z" fill="#dc2626" />
        <rect x="63" y="21" width="11" height="2.5" fill="#ffffff" rx="1" />
        <circle cx="75" cy="18" r="2" fill="#ffffff" />

        {/* Santa Waving Arm */}
        <path d="M 62,28 Q 56,22 58,16" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="58" cy="15" r="2" fill="#ffffff" />
      </g>

      {/* 4. Reindeer 2 (Follower) */}
      <g>
        {/* Galloping Legs */}
        <g className="animate-reindeer-legs">
          <path d="M 155,38 Q 163,48 168,58" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M 140,38 Q 133,48 127,56" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </g>
        {/* Antlers */}
        <path d="M 152,22 L 148,11 M 150,15 L 155,13 M 149,13 L 144,11" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        {/* Body */}
        <ellipse cx="148" cy="35" rx="14" ry="7.5" fill="#b45309" />
        <path d="M 154,32 C 156,26 161,23 166,24 C 169,25 171,28 171,30 C 169,33 164,35 159,36 Z" fill="#b45309" />
        {/* Golden Collar with Bell */}
        <path d="M 163,33 L 160,37" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
        <circle cx="159" cy="38" r="1.5" fill="#facc15" />
      </g>

      {/* 5. Reindeer 1 (Rudolph with Glowing Red Nose) */}
      <g>
        {/* Galloping Legs */}
        <g className="animate-reindeer-legs">
          <path d="M 218,38 Q 226,48 232,58" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M 201,38 Q 194,48 188,56" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </g>
        {/* Antlers */}
        <path d="M 215,22 L 210,10 M 213,15 L 218,12 M 211,12 L 206,10" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        {/* Body */}
        <ellipse cx="210" cy="34" rx="15" ry="7.5" fill="#b45309" />
        <path d="M 217,31 C 219,25 224,22 230,23 C 233,24 235,27 235,29 C 233,32 227,34 222,35 Z" fill="#b45309" />
        {/* Golden Collar */}
        <path d="M 226,32 L 223,36" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
        <circle cx="222" cy="37" r="1.5" fill="#facc15" />
        {/* Rudolph's Glowing Red Nose */}
        <circle
          cx="236"
          cy="26"
          r="3.2"
          fill="#ef4444"
          className="animate-rudolph-nose"
        />
      </g>
    </svg>
  );
}

function ChristmasGarland() {
  return (
    <>
      {/* 1. Multi-Style Gentle Snowfall Across Screen */}
      <ChristmasSnowfall />

      {/* 2. Flying Santa Claus & Reindeer Sleigh Across Upper Screen */}
      <ChristmasSanta />

      {/* 3. Snow-Frosted Pine Garland with Glowing Baubles under Header */}
      <div className="absolute top-full left-0 right-0 z-30 pointer-events-none select-none overflow-visible">
        <svg className="w-full h-8 overflow-visible" preserveAspectRatio="none">
          <defs>
            <radialGradient id="halo-xmas-red" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="halo-xmas-gold" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#eab308" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="halo-xmas-green" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </radialGradient>

            <pattern id="garland-xmas" width="130" height="32" patternUnits="userSpaceOnUse">
              {/* Pine Needle Swag */}
              <path
                d="M 0,2 Q 65,14 130,2"
                stroke="#065f46"
                strokeWidth="2.5"
                fill="none"
                opacity="0.9"
              />
              {/* Snow frosting on top of pine swag */}
              <path
                d="M 0,1 Q 65,13 130,1"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeDasharray="4,2"
                fill="none"
                opacity="0.85"
              />

              {/* Bauble 1: Gold */}
              <g transform="translate(20, 8)">
                <circle cx="0" cy="3" r="7" fill="url(#halo-xmas-gold)" />
                <rect x="-0.8" y="-1.5" width="1.6" height="2" fill="#ca8a04" />
                <ellipse cx="0" cy="3" rx="2.8" ry="3.8" fill="#facc15" />
                <circle cx="-0.8" cy="2" r="0.8" fill="#ffffff" opacity="0.8" />
              </g>

              {/* Bauble 2: Ruby Red */}
              <g transform="translate(48, 13)">
                <circle cx="0" cy="3" r="8" fill="url(#halo-xmas-red)" />
                <rect x="-0.8" y="-1.5" width="1.6" height="2" fill="#991b1b" />
                <ellipse cx="0" cy="3" rx="3.5" ry="4.5" fill="#dc2626" />
                <circle cx="-1" cy="2" r="0.9" fill="#ffffff" opacity="0.85" />
              </g>

              {/* Bauble 3: Golden Star / Sparkle Ornament */}
              <g transform="translate(74, 14)">
                <circle cx="0" cy="3" r="9" fill="url(#halo-xmas-gold)" />
                <rect x="-0.8" y="-1.5" width="1.6" height="2" fill="#ca8a04" />
                <ellipse cx="0" cy="3" rx="3.8" ry="4.8" fill="#eab308" />
                <circle cx="-1" cy="2" r="1" fill="#ffffff" opacity="0.9" />
              </g>

              {/* Bauble 4: Emerald Green */}
              <g transform="translate(98, 12)">
                <circle cx="0" cy="3" r="7" fill="url(#halo-xmas-green)" />
                <rect x="-0.8" y="-1.5" width="1.6" height="2" fill="#047857" />
                <ellipse cx="0" cy="3" rx="2.8" ry="3.8" fill="#10b981" />
                <circle cx="-0.8" cy="2" r="0.8" fill="#ffffff" opacity="0.8" />
              </g>

              {/* Bauble 5: Ruby Mini */}
              <g transform="translate(118, 7)">
                <circle cx="0" cy="3" r="6" fill="url(#halo-xmas-red)" />
                <rect x="-0.8" y="-1.5" width="1.6" height="2" fill="#991b1b" />
                <ellipse cx="0" cy="3" rx="2.5" ry="3.2" fill="#dc2626" />
                <circle cx="-0.7" cy="2" r="0.7" fill="#ffffff" opacity="0.8" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="32" fill="url(#garland-xmas)" />
        </svg>
      </div>
    </>
  );
}

// ============================================================================
// 3. TẾT TRUNG THU GARLAND (SIMPLE LANTERNS UNDER HEADER)
// ============================================================================
function TrungThuGarland() {
  return (
    <div className="absolute top-full left-0 right-0 z-30 pointer-events-none select-none overflow-visible">
      <svg className="w-full h-8 overflow-visible" preserveAspectRatio="none">
        <defs>
          <pattern id="garland-tt" width="120" height="32" patternUnits="userSpaceOnUse">
            <path d="M 0,2 Q 60,14 120,2" stroke="#b45309" strokeWidth="1.2" fill="none" opacity="0.8" />
            <circle cx="20" cy="8" r="2.8" fill="#fbbf24" />
            <g transform="translate(45, 11)">
              <ellipse cx="0" cy="4" rx="5" ry="5.5" fill="#dc2626" />
              <line x1="0" y1="9.5" x2="0" y2="13" stroke="#eab308" strokeWidth="1" />
            </g>
            <circle cx="75" cy="13" r="4.5" fill="#fde047" />
            <circle cx="105" cy="8" r="2.8" fill="#fbbf24" />
          </pattern>
        </defs>
        <rect width="100%" height="32" fill="url(#garland-tt)" />
      </svg>
    </div>
  );
}

// ============================================================================
// 4. QUỐC KHÁNH 2/9 GARLAND (SIMPLE BUNTING UNDER HEADER)
// ============================================================================
function QuocKhanhGarland() {
  return (
    <div className="absolute top-full left-0 right-0 z-30 pointer-events-none select-none overflow-visible">
      <svg className="w-full h-8 overflow-visible" preserveAspectRatio="none">
        <defs>
          <pattern id="garland-qk" width="110" height="32" patternUnits="userSpaceOnUse">
            <path d="M 0,2 Q 55,14 110,2" stroke="#991b1b" strokeWidth="1.2" fill="none" opacity="0.8" />
            <polygon points="18,7 32,7 25,18" fill="#dc2626" />
            <circle cx="25" cy="11" r="2" fill="#facc15" />
            <polygon points="72,7 86,7 79,18" fill="#dc2626" />
            <circle cx="79" cy="11" r="2" fill="#facc15" />
          </pattern>
        </defs>
        <rect width="100%" height="32" fill="url(#garland-qk)" />
      </svg>
    </div>
  );
}

// ============================================================================
// 5. TẾT NGUYÊN ĐÁN GARLAND (SPRING BLOSSOMS UNDER HEADER)
// ============================================================================
function TetNguyenDanGarland() {
  return (
    <div className="absolute top-full left-0 right-0 z-30 pointer-events-none select-none overflow-visible">
      <svg className="w-full h-8 overflow-visible" preserveAspectRatio="none">
        <defs>
          <pattern id="garland-tet" width="120" height="32" patternUnits="userSpaceOnUse">
            <path d="M 0,2 Q 60,13 120,2" stroke="#78350f" strokeWidth="1.3" fill="none" opacity="0.8" />
            <circle cx="25" cy="8" r="3" fill="#facc15" />
            <g transform="translate(60, 12)">
              <rect x="-3.5" y="0" width="7" height="9" fill="#dc2626" rx="1" />
              <circle cx="0" cy="3.5" r="1.5" fill="#facc15" />
            </g>
            <circle cx="95" cy="8" r="3" fill="#fb7185" />
          </pattern>
        </defs>
        <rect width="100%" height="32" fill="url(#garland-tet)" />
      </svg>
    </div>
  );
}

// ============================================================================
// 6. TẾT ĐOAN NGỌ GARLAND (BAMBOO LEAVES UNDER HEADER)
// ============================================================================
function TetDoanNgoGarland() {
  return (
    <div className="absolute top-full left-0 right-0 z-30 pointer-events-none select-none overflow-visible">
      <svg className="w-full h-8 overflow-visible" preserveAspectRatio="none">
        <pattern id="garland-dn" width="110" height="32" patternUnits="userSpaceOnUse">
          <path d="M 0,2 Q 55,13 110,2" stroke="#166534" strokeWidth="1.2" fill="none" opacity="0.8" />
          <ellipse cx="28" cy="8" rx="2" ry="5.5" fill="#15803d" transform="rotate(-15 28 8)" />
          <polygon points="55,9 60,16 50,16" fill="#166534" />
          <ellipse cx="82" cy="8" rx="2" ry="5.5" fill="#22c55e" transform="rotate(15 82 8)" />
        </pattern>
        <rect width="100%" height="32" fill="url(#garland-dn)" />
      </svg>
    </div>
  );
}

// ============================================================================
// 7. SEASONAL LOGO DECORATIONS (SANTA HAT & HALLOWEEN PUMPKIN ON LOGO CORNER)
// ============================================================================
export function ChristmasSantaHat() {
  return (
    <div
      className="absolute -top-3.5 -left-2.5 pointer-events-none select-none z-20 animate-santa-hat-wiggle"
      title="Giáng Sinh An Lành!"
    >
      <svg
        className="w-7 h-7 overflow-visible drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
        viewBox="0 0 32 32"
        fill="none"
      >
        <defs>
          <linearGradient id="santa-hat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="70%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>

        {/* 1. Curved Red Velvet Hat Cone */}
        <path
          d="M 6,22 C 4,14 12,5 21,5 C 26,5 29,10 27,14 C 25,18 21,18 19,15"
          fill="url(#santa-hat-grad)"
        />
        {/* Soft fabric shadow crease */}
        <path
          d="M 11,21 C 13,13 18,7 21,5"
          stroke="#7f1d1d"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* 2. Holly Leaves & Berries tucked into brim */}
        <g transform="translate(4, 18) scale(0.85)">
          <path d="M 0,0 Q -3,-4 -1,-7 Q 3,-4 0,0" fill="#15803d" />
          <path d="M 0,0 Q -4,2 -7,1 Q -5,-3 0,0" fill="#16a34a" />
          <circle cx="0" cy="0" r="1.6" fill="#ef4444" />
          <circle cx="2" cy="-1.5" r="1.3" fill="#dc2626" />
        </g>

        {/* 3. Fluffy White Fur Brim sitting across logo corner */}
        <path
          d="M 5,21 C 5,19 7,18 9,18 C 11,18 12,19 14,19 C 16,19 17,18 19,18 C 21,18 23,19 23,21 C 23,23 21,24 19,24 C 17,24 16,23 14,23 C 12,23 11,24 9,24 C 7,24 5,23 5,21 Z"
          fill="#ffffff"
        />

        {/* 4. Fluffy White Pom-Pom Ball hanging from tip */}
        <g className="animate-pom-pom-bounce">
          <circle cx="21" cy="15.5" r="3.2" fill="#ffffff" />
          <circle cx="20.2" cy="14.8" r="1.2" fill="#f8fafc" opacity="0.9" />
        </g>

        {/* 5. Golden Holiday Star Sparkle */}
        <path
          d="M 27,4 L 28,1 L 29,4 L 32,5 L 29,6 L 28,9 L 27,6 L 24,5 Z"
          fill="#facc15"
          className="animate-pulse"
          opacity="0.95"
        />
      </svg>
    </div>
  );
}

export function HalloweenLogoPumpkin() {
  return (
    <div
      className="absolute -top-3 -right-2 pointer-events-none select-none z-20 animate-bounce-subtle"
      title="Halloween Kỳ Bí!"
    >
      <svg
        className="w-6 h-6 overflow-visible drop-shadow-[0_2px_4px_rgba(249,115,22,0.4)]"
        viewBox="0 0 24 24"
        fill="none"
      >
        {/* Pumpkin green stem */}
        <path d="M 12,4 Q 13,1 15,2" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
        {/* Pumpkin Body */}
        <ellipse cx="12" cy="13" rx="8" ry="7" fill="#f97316" />
        <ellipse cx="12" cy="13" rx="5" ry="6.8" fill="#ea580c" />
        <ellipse cx="12" cy="13" rx="2.5" ry="6.5" fill="#f97316" />
        {/* Spooky Glowing Eyes & Mouth */}
        <polygon points="9,11 10.5,13 8.5,13" fill="#fef08a" />
        <polygon points="15,11 15.5,13 13.5,13" fill="#fef08a" />
        <path d="M 9,16 Q 12,18 15,16" stroke="#fef08a" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
