"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

const GRID_SIZE = 6;
const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 360; // extra for UI
const GEM_GAP = 4;
const GRID_PADDING = 6;
const GRID_TOP = 60;
const GEM_SIZE =
  (CANVAS_WIDTH - GRID_PADDING * 2 - GEM_GAP * (GRID_SIZE + 1)) / GRID_SIZE;

const GEM_COLORS = [
  { fill: "#e74c3c", light: "#ff7675" }, // red
  { fill: "#3498db", light: "#74b9ff" }, // blue
  { fill: "#27ae60", light: "#55efc4" }, // green
  { fill: "#f1c40f", light: "#ffeaa7" }, // yellow
  { fill: "#9b59b6", light: "#dda0dd" }, // purple
];

const MAX_MOVES = 30;

function createGrid() {
  let g;
  do {
    g = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () =>
        Math.floor(Math.random() * GEM_COLORS.length)
      )
    );
  } while (findMatches(g).length > 0);
  return g;
}

function findMatches(grid) {
  const matches = new Set();

  // Horizontal
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE - 2; c++) {
      if (
        grid[r][c] !== -1 &&
        grid[r][c] === grid[r][c + 1] &&
        grid[r][c] === grid[r][c + 2]
      ) {
        matches.add(`${r},${c}`);
        matches.add(`${r},${c + 1}`);
        matches.add(`${r},${c + 2}`);
      }
    }
  }

  // Vertical
  for (let r = 0; r < GRID_SIZE - 2; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (
        grid[r][c] !== -1 &&
        grid[r][c] === grid[r + 1][c] &&
        grid[r][c] === grid[r + 2][c]
      ) {
        matches.add(`${r},${c}`);
        matches.add(`${r + 1},${c}`);
        matches.add(`${r + 2},${c}`);
      }
    }
  }

  return Array.from(matches).map((s) => {
    const [r, c] = s.split(",").map(Number);
    return { r, c };
  });
}

function removeAndCascade(grid) {
  let totalRemoved = 0;
  let g = grid.map((row) => [...row]);

  while (true) {
    const matches = findMatches(g);
    if (matches.length === 0) break;

    totalRemoved += matches.length;
    for (const { r, c } of matches) {
      g[r][c] = -1;
    }

    // Cascade: drop gems down
    for (let c = 0; c < GRID_SIZE; c++) {
      let writeRow = GRID_SIZE - 1;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (g[r][c] !== -1) {
          g[writeRow][c] = g[r][c];
          if (writeRow !== r) g[r][c] = -1;
          writeRow--;
        }
      }
      // Fill top with new gems
      for (let r = writeRow; r >= 0; r--) {
        g[r][c] = Math.floor(Math.random() * GEM_COLORS.length);
      }
    }
  }

  return { grid: g, removed: totalRemoved };
}

export default function MatchGame({ onBack }) {
  const canvasRef = useRef(null);
  const [grid, setGrid] = useState(() => createGrid());
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(MAX_MOVES);
  const [selected, setSelected] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const animFrameRef = useRef(null);

  function getGemPos(row, col) {
    const x = GRID_PADDING + GEM_GAP + col * (GEM_SIZE + GEM_GAP);
    const y = GRID_TOP + GEM_GAP + row * (GEM_SIZE + GEM_GAP);
    return { x, y };
  }

  function getCellFromPixel(px, py) {
    const col = Math.floor(
      (px - GRID_PADDING - GEM_GAP) / (GEM_SIZE + GEM_GAP)
    );
    const row = Math.floor(
      (py - GRID_TOP - GEM_GAP) / (GEM_SIZE + GEM_GAP)
    );
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      return { r: row, c: col };
    }
    return null;
  }

  function isAdjacent(a, b) {
    return (
      (Math.abs(a.r - b.r) === 1 && a.c === b.c) ||
      (Math.abs(a.c - b.c) === 1 && a.r === b.r)
    );
  }

  const handleClick = useCallback(
    (e) => {
      if (gameOver) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;

      const cell = getCellFromPixel(px, py);
      if (!cell) return;

      if (!selected) {
        setSelected(cell);
      } else {
        if (isAdjacent(selected, cell)) {
          // Try swap
          const newGrid = grid.map((row) => [...row]);
          const temp = newGrid[selected.r][selected.c];
          newGrid[selected.r][selected.c] = newGrid[cell.r][cell.c];
          newGrid[cell.r][cell.c] = temp;

          const matches = findMatches(newGrid);
          if (matches.length > 0) {
            const { grid: resolved, removed } = removeAndCascade(newGrid);
            setGrid(resolved);
            setScore((s) => s + removed * 10);
            const newMoves = moves - 1;
            setMoves(newMoves);
            if (newMoves <= 0) setGameOver(true);
          }
          // else: invalid swap, do nothing (swap back implicitly by not updating)
        }
        setSelected(null);
      }
    },
    [grid, selected, moves, gameOver]
  );

  // Canvas click handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [handleClick]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background
      ctx.fillStyle = "#1a0a2e";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // UI: Score + Moves
      ctx.fillStyle = "#e8d5f5";
      ctx.font = "bold 15px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`分数: ${score}`, 10, 25);
      ctx.textAlign = "right";
      ctx.fillText(`剩余: ${moves}步`, CANVAS_WIDTH - 10, 25);

      // Grid background
      ctx.fillStyle = "#2d1b4e";
      const gridW = CANVAS_WIDTH - GRID_PADDING * 2;
      const gridH = gridW;
      ctx.beginPath();
      ctx.roundRect(GRID_PADDING, GRID_TOP, gridW, gridH, 8);
      ctx.fill();

      // Gems
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const gemType = grid[r][c];
          if (gemType < 0 || gemType >= GEM_COLORS.length) continue;
          const { x, y } = getGemPos(r, c);
          const color = GEM_COLORS[gemType];

          // Selection highlight
          if (selected && selected.r === r && selected.c === c) {
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x - 2, y - 2, GEM_SIZE + 4, GEM_SIZE + 4, 6);
            ctx.stroke();
          }

          // Gem body
          ctx.fillStyle = color.fill;
          ctx.beginPath();
          ctx.roundRect(x, y, GEM_SIZE, GEM_SIZE, 5);
          ctx.fill();

          // Pixel highlight (top-left lighter corner)
          ctx.fillStyle = color.light;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, GEM_SIZE * 0.4, GEM_SIZE * 0.4, 3);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }

      // Game over overlay
      if (gameOver) {
        ctx.fillStyle = "rgba(26, 10, 46, 0.88)";
        ctx.fillRect(0, GRID_TOP, CANVAS_WIDTH, gridH);
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "游戏结束!",
          CANVAS_WIDTH / 2,
          GRID_TOP + gridH / 2 - 20
        );
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
  }, [grid, score, moves, selected, gameOver]);

  function resetGame() {
    setGrid(createGrid());
    setScore(0);
    setMoves(MAX_MOVES);
    setSelected(null);
    setGameOver(false);
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-[300px] mb-2">
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
        className="rounded-lg border border-purple-500/30 cursor-pointer"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}
