"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

const GRID_SIZE = 4;
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 370; // extra space for score
const TILE_GAP = 8;
const GRID_PADDING = 10;
const GRID_TOP = 50;
const TILE_SIZE =
  (CANVAS_WIDTH - GRID_PADDING * 2 - TILE_GAP * (GRID_SIZE + 1)) / GRID_SIZE;

const TILE_COLORS = {
  0: "#2d1b4e",
  2: "#e8d5f5",
  4: "#d4b3ed",
  8: "#bb8fe0",
  16: "#a66bd4",
  32: "#8e47c7",
  64: "#7623ba",
  128: "#5e0fa6",
  256: "#4a0b85",
  512: "#360764",
  1024: "#220343",
  2048: "#FFD700",
};

function getTextColor(value) {
  if (value <= 4) return "#1a0a2e";
  if (value === 2048) return "#1a0a2e";
  return "#ffffff";
}

export default function Game2048({ onBack }) {
  const canvasRef = useRef(null);
  const [grid, setGrid] = useState(() => initGrid());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const touchStart = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef(null);

  function initGrid() {
    const g = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(0)
    );
    addRandom(g);
    addRandom(g);
    return g;
  }

  function addRandom(g) {
    const empty = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length === 0) return;
    const cell = empty[Math.floor(Math.random() * empty.length)];
    g[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
  }

  function checkGameOver(g) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g[r][c] === 0) return false;
        if (c < GRID_SIZE - 1 && g[r][c] === g[r][c + 1]) return false;
        if (r < GRID_SIZE - 1 && g[r][c] === g[r + 1][c]) return false;
      }
    }
    return true;
  }

  function slide(row) {
    let arr = row.filter((v) => v !== 0);
    let scored = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        scored += arr[i];
        arr.splice(i + 1, 1);
      }
    }
    while (arr.length < GRID_SIZE) arr.push(0);
    return { result: arr, scored };
  }

  const move = useCallback(
    (direction) => {
      if (gameOver) return;

      let newGrid = grid.map((row) => [...row]);
      let totalScored = 0;
      let moved = false;

      if (direction === "left") {
        for (let r = 0; r < GRID_SIZE; r++) {
          const { result, scored } = slide(newGrid[r]);
          if (newGrid[r].join(",") !== result.join(",")) moved = true;
          newGrid[r] = result;
          totalScored += scored;
        }
      } else if (direction === "right") {
        for (let r = 0; r < GRID_SIZE; r++) {
          const reversed = [...newGrid[r]].reverse();
          const { result, scored } = slide(reversed);
          const final = result.reverse();
          if (newGrid[r].join(",") !== final.join(",")) moved = true;
          newGrid[r] = final;
          totalScored += scored;
        }
      } else if (direction === "up") {
        for (let c = 0; c < GRID_SIZE; c++) {
          const col = newGrid.map((row) => row[c]);
          const { result, scored } = slide(col);
          if (col.join(",") !== result.join(",")) moved = true;
          for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = result[r];
          totalScored += scored;
        }
      } else if (direction === "down") {
        for (let c = 0; c < GRID_SIZE; c++) {
          const col = newGrid.map((row) => row[c]).reverse();
          const { result, scored } = slide(col);
          const final = result.reverse();
          const origCol = newGrid.map((row) => row[c]);
          if (origCol.join(",") !== final.join(",")) moved = true;
          for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = final[r];
          totalScored += scored;
        }
      }

      if (moved) {
        addRandom(newGrid);
        setGrid(newGrid);
        setScore((s) => s + totalScored);
        if (checkGameOver(newGrid)) {
          setGameOver(true);
        }
      }
    },
    [grid, gameOver]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        const dir = e.key.replace("Arrow", "").toLowerCase();
        move(dir);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [move]);

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e) => {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      const minSwipe = 30;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > minSwipe) {
          move(dx > 0 ? "right" : "left");
        }
      } else {
        if (Math.abs(dy) > minSwipe) {
          move(dy > 0 ? "down" : "up");
        }
      }
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [move]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background
      ctx.fillStyle = "#1a0a2e";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Score
      ctx.fillStyle = "#e8d5f5";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`分数: ${score}`, CANVAS_WIDTH / 2, 30);

      // Grid background
      ctx.fillStyle = "#2d1b4e";
      const gridW = CANVAS_WIDTH - GRID_PADDING * 2;
      const gridH = gridW;
      ctx.beginPath();
      ctx.roundRect(GRID_PADDING, GRID_TOP, gridW, gridH, 8);
      ctx.fill();

      // Tiles
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const value = grid[r][c];
          const x = GRID_PADDING + TILE_GAP + c * (TILE_SIZE + TILE_GAP);
          const y = GRID_TOP + TILE_GAP + r * (TILE_SIZE + TILE_GAP);

          ctx.fillStyle = TILE_COLORS[value] || TILE_COLORS[2048];
          ctx.beginPath();
          ctx.roundRect(x, y, TILE_SIZE, TILE_SIZE, 6);
          ctx.fill();

          if (value !== 0) {
            ctx.fillStyle = getTextColor(value);
            const fontSize = value >= 1024 ? 14 : value >= 128 ? 18 : 22;
            ctx.font = `bold ${fontSize}px monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              String(value),
              x + TILE_SIZE / 2,
              y + TILE_SIZE / 2
            );
          }
        }
      }

      // Game over overlay
      if (gameOver) {
        ctx.fillStyle = "rgba(26, 10, 46, 0.85)";
        ctx.fillRect(0, GRID_TOP, CANVAS_WIDTH, gridH);
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("游戏结束!", CANVAS_WIDTH / 2, GRID_TOP + gridH / 2 - 20);
        ctx.fillStyle = "#e8d5f5";
        ctx.font = "bold 16px monospace";
        ctx.fillText(
          `最终分数: ${score}`,
          CANVAS_WIDTH / 2,
          GRID_TOP + gridH / 2 + 15
        );
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [grid, score, gameOver]);

  function resetGame() {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-[320px] mb-2">
        <button
          onClick={onBack}
          className="text-sm text-purple-300 hover:text-purple-100 transition-colors"
        >
          ← 返回
        </button>
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
        className="rounded-lg border border-purple-500/30"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}
