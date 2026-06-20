"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 300;
const PLAYER_INITIAL_SIZE = 20;
const SPAWN_INTERVAL_MIN = 1000;
const SPAWN_INTERVAL_MAX = 2000;

const FISH_COLORS = [
  "#e74c3c",
  "#3498db",
  "#27ae60",
  "#f39c12",
  "#e91e63",
  "#00bcd4",
  "#ff9800",
  "#8bc34a",
];

function drawFish(ctx, x, y, size, color, facingRight, isPlayer) {
  const bodyW = size * 2;
  const bodyH = size;
  const tailW = size * 0.7;

  ctx.fillStyle = color;

  // Body (ellipse approximation with roundRect)
  ctx.beginPath();
  ctx.ellipse(x, y, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  const tailDir = facingRight ? -1 : 1;
  ctx.beginPath();
  ctx.moveTo(x + (tailDir * bodyW) / 2, y);
  ctx.lineTo(x + (tailDir * bodyW) / 2 + tailDir * tailW, y - bodyH / 2);
  ctx.lineTo(x + (tailDir * bodyW) / 2 + tailDir * tailW, y + bodyH / 2);
  ctx.closePath();
  ctx.fill();

  // Eye
  const eyeX = x + (facingRight ? 1 : -1) * (bodyW / 4);
  const eyeY = y - bodyH / 6;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, size * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(eyeX + (facingRight ? 1 : -1) * 1, eyeY, size * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Player glow
  if (isPlayer) {
    ctx.strokeStyle = "rgba(200, 150, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, bodyW / 2 + 2, bodyH / 2 + 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export default function FishGame({ onBack }) {
  const canvasRef = useRef(null);
  const gameState = useRef({
    player: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      size: PLAYER_INITIAL_SIZE,
      facingRight: true,
    },
    enemies: [],
    score: 0,
    gameOver: false,
    keys: {},
    mouse: null,
    lastSpawn: 0,
    nextSpawnDelay:
      SPAWN_INTERVAL_MIN +
      Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN),
    waveOffset: 0,
  });
  const [score, setScore] = useState(0);
  const [sizeLevel, setSizeLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const animFrameRef = useRef(null);

  const resetGame = useCallback(() => {
    const gs = gameState.current;
    gs.player = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      size: PLAYER_INITIAL_SIZE,
      facingRight: true,
    };
    gs.enemies = [];
    gs.score = 0;
    gs.gameOver = false;
    gs.lastSpawn = performance.now();
    gs.nextSpawnDelay =
      SPAWN_INTERVAL_MIN +
      Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN);
    setScore(0);
    setSizeLevel(1);
    setGameOver(false);
  }, []);

  useEffect(() => {
    const gs = gameState.current;
    gs.lastSpawn = performance.now();

    const handleKeyDown = (e) => {
      gs.keys[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e) => {
      gs.keys[e.key.toLowerCase()] = false;
    };

    const canvas = canvasRef.current;

    const handleMouseMove = (e) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      gs.mouse = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handleTouchMove = (e) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const touch = e.touches[0];
      gs.mouse = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    };

    const handleMouseLeave = () => {
      gs.mouse = null;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    if (canvas) {
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
      canvas.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const gs = gameState.current;

    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!gs.gameOver) {
        // Player movement
        const speed = 150;
        let dx = 0,
          dy = 0;

        if (gs.keys["arrowleft"] || gs.keys["a"]) dx -= 1;
        if (gs.keys["arrowright"] || gs.keys["d"]) dx += 1;
        if (gs.keys["arrowup"] || gs.keys["w"]) dy -= 1;
        if (gs.keys["arrowdown"] || gs.keys["s"]) dy += 1;

        // Mouse/touch following
        if (gs.mouse) {
          const mdx = gs.mouse.x - gs.player.x;
          const mdy = gs.mouse.y - gs.player.y;
          const dist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (dist > 5) {
            dx = mdx / dist;
            dy = mdy / dist;
          }
        }

        if (dx !== 0 || dy !== 0) {
          const len = Math.sqrt(dx * dx + dy * dy);
          gs.player.x += (dx / len) * speed * dt;
          gs.player.y += (dy / len) * speed * dt;
          if (dx !== 0) gs.player.facingRight = dx > 0;
        }

        // Clamp player to canvas
        gs.player.x = Math.max(
          gs.player.size,
          Math.min(CANVAS_WIDTH - gs.player.size, gs.player.x)
        );
        gs.player.y = Math.max(
          gs.player.size,
          Math.min(CANVAS_HEIGHT - gs.player.size, gs.player.y)
        );

        // Spawn enemies
        if (now - gs.lastSpawn > gs.nextSpawnDelay) {
          gs.lastSpawn = now;
          gs.nextSpawnDelay =
            SPAWN_INTERVAL_MIN +
            Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN);

          const fromLeft = Math.random() < 0.5;
          const enemySize =
            gs.player.size * (0.4 + Math.random() * 1.2);
          const enemy = {
            x: fromLeft ? -enemySize * 2 : CANVAS_WIDTH + enemySize * 2,
            y: enemySize + Math.random() * (CANVAS_HEIGHT - enemySize * 2),
            size: enemySize,
            speed: 40 + Math.random() * 80,
            facingRight: fromLeft,
            color:
              FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)],
          };
          gs.enemies.push(enemy);
        }

        // Move enemies
        for (let i = gs.enemies.length - 1; i >= 0; i--) {
          const e = gs.enemies[i];
          e.x += (e.facingRight ? 1 : -1) * e.speed * dt;

          // Remove off-screen
          if (e.x < -e.size * 4 || e.x > CANVAS_WIDTH + e.size * 4) {
            gs.enemies.splice(i, 1);
            continue;
          }

          // Collision with player
          const cdx = gs.player.x - e.x;
          const cdy = gs.player.y - e.y;
          const dist = Math.sqrt(cdx * cdx + cdy * cdy);
          const collisionDist = gs.player.size + e.size * 0.7;

          if (dist < collisionDist) {
            if (gs.player.size > e.size * 1.1) {
              // Eat the fish
              gs.enemies.splice(i, 1);
              gs.score += Math.ceil(e.size);
              gs.player.size += e.size * 0.08;
              setScore(gs.score);
              setSizeLevel(
                Math.floor((gs.player.size - PLAYER_INITIAL_SIZE) / 8) + 1
              );
            } else if (e.size > gs.player.size * 1.1) {
              // Game over
              gs.gameOver = true;
              setGameOver(true);
            }
          }
        }

        // Wave animation
        gs.waveOffset += dt * 30;
      }

      // === RENDER ===
      // Ocean background
      ctx.fillStyle = "#0a0520";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Pixel waves
      ctx.fillStyle = "rgba(100, 60, 180, 0.08)";
      for (let y = 0; y < CANVAS_HEIGHT; y += 20) {
        const offset = Math.sin((y + gs.waveOffset) * 0.05) * 10;
        ctx.fillRect(offset, y, CANVAS_WIDTH, 2);
      }

      // Draw enemies
      for (const e of gs.enemies) {
        drawFish(ctx, e.x, e.y, e.size, e.color, e.facingRight, false);
      }

      // Draw player
      drawFish(
        ctx,
        gs.player.x,
        gs.player.y,
        gs.player.size,
        "#9b59b6",
        gs.player.facingRight,
        true
      );

      // UI
      ctx.fillStyle = "#e8d5f5";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`分数: ${gs.score}`, 10, 20);
      ctx.textAlign = "right";
      ctx.fillText(
        `等级: ${Math.floor((gs.player.size - PLAYER_INITIAL_SIZE) / 8) + 1}`,
        CANVAS_WIDTH - 10,
        20
      );

      // Game over
      if (gs.gameOver) {
        ctx.fillStyle = "rgba(10, 5, 32, 0.85)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("游戏结束!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 25);
        ctx.fillStyle = "#e8d5f5";
        ctx.font = "bold 16px monospace";
        ctx.fillText(
          `最终分数: ${gs.score}`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 10
        );
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-[400px] mb-2">
        <button
          onClick={onBack}
          className="text-sm text-purple-300 hover:text-purple-100 transition-colors"
        >
          ← 返回
        </button>
        <div className="flex items-center gap-3 text-xs text-purple-300">
          <span>分数: {score}</span>
          <span>等级: {sizeLevel}</span>
        </div>
        {gameOver && (
          <button
            onClick={resetGame}
            className="text-sm px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            再来一局
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="rounded-lg border border-purple-500/30 cursor-none"
        style={{ touchAction: "none" }}
      />
      <p className="text-xs text-purple-400/60 mt-2">
        方向键/WASD/鼠标控制移动
      </p>
    </div>
  );
}
