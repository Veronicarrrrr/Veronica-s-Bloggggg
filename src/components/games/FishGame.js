"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const PLAYER_INITIAL_SIZE = 28;
const SPAWN_INTERVAL_MIN = 800;
const SPAWN_INTERVAL_MAX = 1800;

const FISH_SPRITES = [
  "/image/大鱼吃小鱼-1.png",
  "/image/大鱼吃小鱼-2.png",
  "/image/大鱼吃小鱼-3.png",
  "/image/大鱼吃小鱼-4.png",
];
const BG_IMAGE_SRC = "/image/小游戏背景图.png";

function getSpriteIndex(size) {
  if (size < 22) return 0;
  if (size < 36) return 1;
  if (size < 55) return 2;
  return 3;
}

export default function FishGame({ onBack }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const bgImageRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [score, setScore] = useState(0);
  const [sizeLevel, setSizeLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const animFrameRef = useRef(null);

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

  // Load all 5 images (4 fish + 1 background)
  useEffect(() => {
    let loaded = 0;
    const totalImages = FISH_SPRITES.length + 1;

    const fishImages = FISH_SPRITES.map((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loaded++;
        if (loaded === totalImages) setImagesLoaded(true);
      };
      img.onerror = () => {
        loaded++;
        if (loaded === totalImages) setImagesLoaded(true);
      };
      return img;
    });
    imagesRef.current = fishImages;

    const bgImg = new Image();
    bgImg.src = BG_IMAGE_SRC;
    bgImg.onload = () => {
      loaded++;
      if (loaded === totalImages) setImagesLoaded(true);
    };
    bgImg.onerror = () => {
      loaded++;
      if (loaded === totalImages) setImagesLoaded(true);
    };
    bgImageRef.current = bgImg;
  }, []);

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

  // CRITICAL FIX: React event handlers for mouse/touch on canvas
  // Using React props (onMouseMove, onTouchMove) instead of addEventListener
  // to avoid event capture issues inside Modal components
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    gameState.current.mouse = { x, y };
  }, []);

  const handleTouchMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const x = ((t.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((t.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    gameState.current.mouse = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    gameState.current.mouse = null;
  }, []);

  const handleTouchStart = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const x = ((t.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((t.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    gameState.current.mouse = { x, y };
  }, []);

  // Keyboard events (these are fine on window)
  useEffect(() => {
    const gs = gameState.current;
    gs.lastSpawn = performance.now();

    const handleKeyDown = (e) => {
      gs.keys[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e) => {
      gs.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Draw a fish sprite with scaling and horizontal flip (preserves transparency)
  function drawSpriteFish(ctx, img, x, y, size, facingRight, isPlayer) {
    const w = size * 2.5;
    const h = size * 2;
    ctx.save();
    ctx.translate(x, y);
    if (!facingRight) ctx.scale(-1, 1);
    if (isPlayer) {
      ctx.shadowColor = "rgba(180, 130, 255, 0.7)";
      ctx.shadowBlur = 16;
    } else {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    // Reset shadow to avoid bleeding onto other draws
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  }

  // Game loop
  useEffect(() => {
    if (!imagesLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const gs = gameState.current;
    const images = imagesRef.current;
    const bgImg = bgImageRef.current;
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!gs.gameOver) {
        // Movement
        const speed = 180;
        let dx = 0;
        let dy = 0;

        if (gs.keys["arrowleft"] || gs.keys["a"]) dx -= 1;
        if (gs.keys["arrowright"] || gs.keys["d"]) dx += 1;
        if (gs.keys["arrowup"] || gs.keys["w"]) dy -= 1;
        if (gs.keys["arrowdown"] || gs.keys["s"]) dy += 1;

        // Mouse/touch following (primary control)
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

        // Clamp to canvas bounds
        gs.player.x = Math.max(
          gs.player.size,
          Math.min(CANVAS_WIDTH - gs.player.size, gs.player.x)
        );
        gs.player.y = Math.max(
          gs.player.size,
          Math.min(CANVAS_HEIGHT - gs.player.size, gs.player.y)
        );

        // Spawn enemy fish
        if (now - gs.lastSpawn > gs.nextSpawnDelay) {
          gs.lastSpawn = now;
          gs.nextSpawnDelay =
            SPAWN_INTERVAL_MIN +
            Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN);
          const fromLeft = Math.random() < 0.5;
          const enemySize = gs.player.size * (0.35 + Math.random() * 1.3);
          gs.enemies.push({
            x: fromLeft ? -enemySize * 3 : CANVAS_WIDTH + enemySize * 3,
            y: enemySize + Math.random() * (CANVAS_HEIGHT - enemySize * 2),
            size: enemySize,
            speed: 50 + Math.random() * 90,
            facingRight: fromLeft,
            spriteIdx: getSpriteIndex(enemySize),
          });
        }

        // Move enemies and check collisions
        for (let i = gs.enemies.length - 1; i >= 0; i--) {
          const e = gs.enemies[i];
          e.x += (e.facingRight ? 1 : -1) * e.speed * dt;

          // Remove off-screen fish
          if (e.x < -e.size * 5 || e.x > CANVAS_WIDTH + e.size * 5) {
            gs.enemies.splice(i, 1);
            continue;
          }

          // Collision detection
          const cdx = gs.player.x - e.x;
          const cdy = gs.player.y - e.y;
          const dist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (dist < gs.player.size + e.size * 0.6) {
            if (gs.player.size > e.size * 1.1) {
              // Eat smaller fish
              gs.enemies.splice(i, 1);
              gs.score += Math.ceil(e.size);
              gs.player.size += e.size * 0.07;
              setScore(gs.score);
              setSizeLevel(
                Math.floor((gs.player.size - PLAYER_INITIAL_SIZE) / 10) + 1
              );
            } else if (e.size > gs.player.size * 1.1) {
              // Game over - eaten by bigger fish
              gs.gameOver = true;
              setGameOver(true);
            }
          }
        }
        gs.waveOffset += dt * 30;
      }

      // === RENDER ===

      // Background image (纯背景图，无遮罩)
      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        ctx.fillStyle = "#f5f0fa";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // Draw enemy fish
      for (const e of gs.enemies) {
        drawSpriteFish(
          ctx,
          images[e.spriteIdx],
          e.x,
          e.y,
          e.size,
          e.facingRight,
          false
        );
      }

      // Draw player fish
      const playerSpriteIdx = getSpriteIndex(gs.player.size);
      drawSpriteFish(
        ctx,
        images[playerSpriteIdx],
        gs.player.x,
        gs.player.y,
        gs.player.size,
        gs.player.facingRight,
        true
      );

      // UI text - score and level
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#4a1d8a";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`分数: ${gs.score}`, 14, 14);
      ctx.textAlign = "right";
      ctx.fillText(
        `等级: ${Math.floor((gs.player.size - PLAYER_INITIAL_SIZE) / 10) + 1}`,
        CANVAS_WIDTH - 14,
        14
      );

      // Game over overlay
      if (gs.gameOver) {
        ctx.fillStyle = "rgba(10, 5, 32, 0.85)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 32px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("游戏结束!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        ctx.fillStyle = "#4a1d8a";
        ctx.font = "bold 20px monospace";
        ctx.fillText(
          `最终分数: ${gs.score}`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 5
        );
        ctx.fillStyle = "#a78bfa";
        ctx.font = "bold 18px monospace";
        ctx.fillText("再来一局", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [imagesLoaded]);

  // Handle click on canvas for "再来一局" button in game over state
  const handleCanvasClick = useCallback(
    (e) => {
      if (!gameOver) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
      const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

      // Check if click is near the "再来一局" text area
      const btnCenterX = CANVAS_WIDTH / 2;
      const btnCenterY = CANVAS_HEIGHT / 2 + 50;
      if (
        Math.abs(x - btnCenterX) < 80 &&
        Math.abs(y - btnCenterY) < 20
      ) {
        resetGame();
      }
    },
    [gameOver, resetGame]
  );

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-[600px] mb-2">
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
      {!imagesLoaded ? (
        <div className="w-full max-w-[600px] aspect-[4/3] flex items-center justify-center rounded-lg border border-purple-500/30" style={{ backgroundImage: "url('/image/小游戏背景图.png')", backgroundSize: "cover" }}>
          <p className="text-purple-300/60 text-sm">加载中...</p>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg border border-purple-500/30 cursor-none"
          style={{
            width: "100%",
            maxWidth: "600px",
            aspectRatio: "4 / 3",
            touchAction: "none",
            background: "transparent",
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onClick={handleCanvasClick}
        />
      )}
      <p className="text-xs text-purple-400/60 mt-2">
        方向键/WASD/鼠标控制移动 · 吃掉比你小的鱼
      </p>
    </div>
  );
}
