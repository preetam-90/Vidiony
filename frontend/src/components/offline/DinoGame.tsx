"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";

// ── Sprite & physics constants ──────────────────────────────────
const GROUND_Y = 150;
const GRAVITY = 0.6;
const JUMP_FORCE = -11;
const INITIAL_SPEED = 4;
const MAX_SPEED = 10;
const SPEED_INC = 0.001;

// Dino dimensions
const DINO_W = 40;
const DINO_H = 44;
const DINO_DUCK_H = 28;
const DINO_X = 50;

// Obstacle dimensions
const CACTUS_W = 18;
const MIN_CACTUS_H = 30;
const MAX_CACTUS_H = 50;
const MIN_SPAWN_DIST = 200;
const MAX_SPAWN_DIST = 450;

type GameState = "idle" | "running" | "gameover";

interface Obstacle {
  x: number;
  w: number;
  h: number;
}

export default function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Mutable game state stored in refs for rAF loop ──────────
  const stateRef = useRef<GameState>("idle");
  const dinoYRef = useRef(GROUND_Y - DINO_H);
  const velYRef = useRef(0);
  const isDuckRef = useRef(false);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const nextSpawnRef = useRef(300);
  const distRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const scoreRef = useRef(0);
  const frameRef = useRef(0);
  const rafRef = useRef(0);

  // For re-rendering prompt text
  const [displayState, setDisplayState] = useState<GameState>("idle");

  // ── Drawing helpers ─────────────────────────────────────────
  const drawDino = useCallback(
    (ctx: CanvasRenderingContext2D, frame: number) => {
      const duck = isDuckRef.current;
      const h = duck ? DINO_DUCK_H : DINO_H;
      const y = duck ? GROUND_Y - DINO_DUCK_H : dinoYRef.current;
      const x = DINO_X;

      ctx.fillStyle = "#535353";

      // Body
      ctx.fillRect(x + 8, y, 24, h - 10);
      // Head
      ctx.fillRect(x + 18, y - 8, 20, 16);
      // Eye (white dot)
      ctx.fillStyle = "#fff";
      ctx.fillRect(x + 32, y - 4, 4, 4);
      ctx.fillStyle = "#535353";

      // Arm
      ctx.fillRect(x + 4, y + 12, 8, 4);

      // Tail
      ctx.fillRect(x, y + 4, 10, 6);

      // Legs — animate when running
      if (stateRef.current === "running" && dinoYRef.current >= GROUND_Y - DINO_H) {
        if (Math.floor(frame / 6) % 2 === 0) {
          ctx.fillRect(x + 10, y + h - 10, 6, 12);
          ctx.fillRect(x + 24, y + h - 6, 6, 8);
        } else {
          ctx.fillRect(x + 10, y + h - 6, 6, 8);
          ctx.fillRect(x + 24, y + h - 10, 6, 12);
        }
      } else {
        // Standing legs
        ctx.fillRect(x + 10, y + h - 10, 6, 12);
        ctx.fillRect(x + 24, y + h - 10, 6, 12);
      }
    },
    []
  );

  const drawCactus = useCallback(
    (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      ctx.fillStyle = "#535353";
      // Main trunk
      ctx.fillRect(obs.x, GROUND_Y - obs.h, obs.w, obs.h);
      // Left arm
      ctx.fillRect(obs.x - 6, GROUND_Y - obs.h + 10, 8, 4);
      ctx.fillRect(obs.x - 6, GROUND_Y - obs.h + 10, 4, 14);
      // Right arm
      ctx.fillRect(obs.x + obs.w - 2, GROUND_Y - obs.h + 18, 8, 4);
      ctx.fillRect(obs.x + obs.w + 2, GROUND_Y - obs.h + 18, 4, 12);
    },
    []
  );

  // ── Game loop ───────────────────────────────────────────────
  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    frameRef.current++;
    const frame = frameRef.current;

    if (stateRef.current === "running") {
      // Physics
      velYRef.current += GRAVITY;
      dinoYRef.current += velYRef.current;
      if (dinoYRef.current >= GROUND_Y - DINO_H) {
        dinoYRef.current = GROUND_Y - DINO_H;
        velYRef.current = 0;
      }

      // Speed ramp
      speedRef.current = Math.min(MAX_SPEED, speedRef.current + SPEED_INC);
      distRef.current += speedRef.current;
      scoreRef.current = Math.floor(distRef.current / 10);

      // Spawn obstacles
      nextSpawnRef.current -= speedRef.current;
      if (nextSpawnRef.current <= 0) {
        const h =
          MIN_CACTUS_H + Math.random() * (MAX_CACTUS_H - MIN_CACTUS_H);
        obstaclesRef.current.push({ x: W + 20, w: CACTUS_W, h });
        nextSpawnRef.current =
          MIN_SPAWN_DIST + Math.random() * (MAX_SPAWN_DIST - MIN_SPAWN_DIST);
      }

      // Move obstacles
      for (const obs of obstaclesRef.current) {
        obs.x -= speedRef.current;
      }
      // Remove off-screen
      obstaclesRef.current = obstaclesRef.current.filter((o) => o.x + o.w > -20);

      // Collision
      const duck = isDuckRef.current;
      const dh = duck ? DINO_DUCK_H : DINO_H;
      const dy = duck ? GROUND_Y - DINO_DUCK_H : dinoYRef.current;
      for (const obs of obstaclesRef.current) {
        if (
          DINO_X + DINO_W - 6 > obs.x + 4 &&
          DINO_X + 6 < obs.x + obs.w - 4 &&
          dy + dh > GROUND_Y - obs.h + 4
        ) {
          stateRef.current = "gameover";
          setDisplayState("gameover");
          break;
        }
      }
    }

    // ── Draw ──

    // Ground line
    ctx.strokeStyle = "#d4d4d4";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 2);
    ctx.lineTo(W, GROUND_Y + 2);
    ctx.stroke();

    // Ground dashes
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo((-distRef.current * 0.5) % W, GROUND_Y + 10);
    for (let i = 0; i < W + 40; i += 14) {
      ctx.moveTo(((i - distRef.current * 0.5) % (W + 40)) + W + 40 > W + 40
        ? (i - distRef.current * 0.5) % (W + 40)
        : (i - distRef.current * 0.5) % (W + 40) + W + 40,
        GROUND_Y + 10);
    }
    ctx.setLineDash([]);

    // Obstacles
    for (const obs of obstaclesRef.current) {
      drawCactus(ctx, obs);
    }

    // Dino
    drawDino(ctx, frame);

    // Score
    if (stateRef.current === "running" || stateRef.current === "gameover") {
      ctx.fillStyle = "#535353";
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        String(scoreRef.current).padStart(5, "0"),
        W - 12,
        24
      );
    }

    // Game Over text
    if (stateRef.current === "gameover") {
      ctx.fillStyle = "#535353";
      ctx.font = "bold 18px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText("G A M E   O V E R", W / 2, 60);

      ctx.font = "12px 'Courier New', monospace";
      ctx.fillText("Press Space or Tap to Restart", W / 2, 82);
      return; // stop the loop
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [drawDino, drawCactus]);

  // ── Reset ───────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    dinoYRef.current = GROUND_Y - DINO_H;
    velYRef.current = 0;
    isDuckRef.current = false;
    obstaclesRef.current = [];
    nextSpawnRef.current = 300;
    distRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    scoreRef.current = 0;
    frameRef.current = 0;
  }, []);

  // ── Start / Jump / Duck ─────────────────────────────────────
  const handleAction = useCallback(
    (action: "jump" | "duck-start" | "duck-end") => {
      if (stateRef.current === "idle") {
        stateRef.current = "running";
        setDisplayState("running");
        resetGame();
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      if (stateRef.current === "gameover") {
        stateRef.current = "running";
        setDisplayState("running");
        resetGame();
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      if (action === "jump" && dinoYRef.current >= GROUND_Y - DINO_H) {
        velYRef.current = JUMP_FORCE;
      }
      if (action === "duck-start") isDuckRef.current = true;
      if (action === "duck-end") isDuckRef.current = false;
    },
    [loop, resetGame]
  );

  // ── Keyboard events ─────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleAction("jump");
      }
      if (e.code === "ArrowDown") {
        e.preventDefault();
        handleAction("duck-start");
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") handleAction("duck-end");
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [handleAction]);

  // ── Draw idle frame on mount ────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initial idle draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Ground
    ctx.strokeStyle = "#d4d4d4";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 2);
    ctx.lineTo(canvas.width, GROUND_Y + 2);
    ctx.stroke();
    // Dino
    drawDino(ctx, 0);

    return () => cancelAnimationFrame(rafRef.current);
  }, [drawDino]);

  // ── Resize canvas to container ──────────────────────────────
  useEffect(() => {
    const resize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      const w = Math.min(container.clientWidth - 32, 620);
      canvas.width = w;
      canvas.height = 180;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
      {displayState === "idle" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          {/* Small dino icon */}
          <svg width="28" height="30" viewBox="0 0 40 44" fill="none">
            <rect x="8" y="0" width="24" height="34" fill="#535353" />
            <rect x="18" y="-8" width="20" height="16" rx="2" fill="#535353" />
            <rect x="32" y="-4" width="4" height="4" fill="#fff" />
            <rect x="4" y="12" width="8" height="4" fill="#535353" />
            <rect x="0" y="4" width="10" height="6" fill="#535353" />
            <rect x="10" y="24" width="6" height="12" fill="#535353" />
            <rect x="24" y="24" width="6" height="12" fill="#535353" />
          </svg>
          <span className="game-prompt">
            Click, Touch or use Space Bar<br />to Play
          </span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={620}
        height={180}
        onClick={() => handleAction("jump")}
        onTouchStart={(e) => {
          e.preventDefault();
          handleAction("jump");
        }}
        style={{ cursor: "pointer", touchAction: "none" }}
      />
    </div>
  );
}
