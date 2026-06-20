"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/lib/leaderboard";

const GRID_SIZE = 6;
const CELL_SIZE = 56;
const CELL_GAP = 4;
const GEM_IMG_SIZE = 48;
const GAME_TIME = 180; // 3 minutes in seconds
const NUM_GEM_TYPES = 5;

const GEM_SPRITES = [
  "/image/消消乐1-药水.png",
  "/image/消消乐2-女巫帽.png",
  "/image/消消乐3-水晶球.png",
  "/image/消消乐4-魔法棒.png",
  "/image/消消乐5-糖果.png",
];

// --- Pure logic helpers (no React state) ---

function randomGem() {
  return Math.floor(Math.random() * NUM_GEM_TYPES);
}

function cloneGrid(g) {
  return g.map((row) => [...row]);
}

function findMatches(grid) {
  const matched = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => false)
  );

  // Horizontal runs of 3+
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE - 2; c++) {
      const v = grid[r][c];
      if (v < 0) continue;
      if (v === grid[r][c + 1] && v === grid[r][c + 2]) {
        matched[r][c] = true;
        matched[r][c + 1] = true;
        matched[r][c + 2] = true;
      }
    }
  }

  // Vertical runs of 3+
  for (let r = 0; r < GRID_SIZE - 2; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const v = grid[r][c];
      if (v < 0) continue;
      if (v === grid[r + 1][c] && v === grid[r + 2][c]) {
        matched[r][c] = true;
        matched[r + 1][c] = true;
        matched[r + 2][c] = true;
      }
    }
  }

  const result = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (matched[r][c]) result.push({ r, c });
    }
  }
  return result;
}

function hasMatches(grid) {
  return findMatches(grid).length > 0;
}

/** Remove matched gems, cascade columns down, fill new gems from top.
 *  Repeats until no more matches. Returns { grid, removed }. */
function removeAndCascade(grid) {
  let g = cloneGrid(grid);
  let totalRemoved = 0;

  while (true) {
    const matches = findMatches(g);
    if (matches.length === 0) break;

    totalRemoved += matches.length;

    // Mark matched cells as empty (-1)
    for (const { r, c } of matches) {
      g[r][c] = -1;
    }

    // Gravity: compact each column downward
    for (let c = 0; c < GRID_SIZE; c++) {
      let writeRow = GRID_SIZE - 1;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (g[r][c] !== -1) {
          g[writeRow][c] = g[r][c];
          if (writeRow !== r) g[r][c] = -1;
          writeRow--;
        }
      }
      // Fill empty cells at the top with new random gems
      for (let r = writeRow; r >= 0; r--) {
        g[r][c] = randomGem();
      }
    }
  }

  return { grid: g, removed: totalRemoved };
}

/** Generate a grid guaranteed to have zero initial matches. */
function createCleanGrid() {
  let g;
  let attempts = 0;
  do {
    g = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => randomGem())
    );
    attempts++;
    if (attempts > 500) break; // safety valve
  } while (hasMatches(g));
  return g;
}

function isAdjacent(a, b) {
  return (
    (Math.abs(a.r - b.r) === 1 && a.c === b.c) ||
    (Math.abs(a.c - b.c) === 1 && a.r === b.r)
  );
}

// --- Component ---

export default function MatchGame({ onBack }) {
  const [grid, setGrid] = useState(() => createCleanGrid());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [selected, setSelected] = useState(null); // { r, c } | null
  const [gameOver, setGameOver] = useState(false);
  const [flashing, setFlashing] = useState(null); // Set of "r,c" strings briefly shown white
  const flashTimerRef = useRef(null);
  const scoreRef = useRef(0);

  // Keep scoreRef in sync
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Countdown timer
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setGameOver(true);
          saveScore("match", scoreRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver]);

  // Cleanup flash timer on unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const resetGame = useCallback(() => {
    setGrid(createCleanGrid());
    setScore(0);
    setTimeLeft(GAME_TIME);
    setSelected(null);
    setGameOver(false);
    setFlashing(null);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
  }, []);

  const handleCellClick = useCallback(
    (r, c) => {
      if (gameOver) return;
      if (flashing) return; // ignore clicks during flash animation

      if (!selected) {
        // First selection
        setSelected({ r, c });
        return;
      }

      // Clicking the same cell again → deselect
      if (selected.r === r && selected.c === c) {
        setSelected(null);
        return;
      }

      // Clicking a non-adjacent cell → select the new one instead
      if (!isAdjacent(selected, { r, c })) {
        setSelected({ r, c });
        return;
      }

      // Adjacent cell clicked → attempt swap
      const newGrid = cloneGrid(grid);
      // Swap
      const temp = newGrid[selected.r][selected.c];
      newGrid[selected.r][selected.c] = newGrid[r][c];
      newGrid[r][c] = temp;

      const matches = findMatches(newGrid);

      if (matches.length > 0) {
        // Valid move: flash matched cells, then resolve cascade
        const flashSet = new Set(matches.map((m) => `${m.r},${m.c}`));
        setFlashing(flashSet);
        setGrid(newGrid); // show the swapped state immediately
        setSelected(null);

        flashTimerRef.current = setTimeout(() => {
          const { grid: resolved, removed } = removeAndCascade(newGrid);
          setGrid(resolved);
          setScore((s) => s + removed * 10);
          setFlashing(null);
        }, 200);
      } else {
        // No match → swap back (instant), deselect
        setSelected(null);
      }
    },
    [grid, selected, gameOver, flashing]
  );

  // Computed grid dimensions
  const gridPx = GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * CELL_GAP;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: gridPx + 40,
        margin: "0 auto",
        backgroundImage: "url('/image/小游戏背景图.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 12,
        padding: "16px 20px 20px",
        position: "relative",
        minHeight: gridPx + 140,
      }}
    >
      {/* Top bar: back button + score + moves */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          marginBottom: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#c4b5fd",
            cursor: "pointer",
            fontSize: 14,
            fontFamily: "monospace",
            padding: "4px 8px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e9d5ff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#c4b5fd")}
        >
          ← 返回
        </button>
        <div
          style={{
            display: "flex",
            gap: 20,
            fontSize: 15,
            fontWeight: "bold",
            fontFamily: "monospace",
            color: "#e8d5f5",
          }}
        >
          <span>分数: {score}</span>
          <span>时间: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gap: CELL_GAP,
          background: "rgba(30, 18, 51, 0.4)",
          borderRadius: 10,
          padding: CELL_GAP,
          position: "relative",
        }}
      >
        {grid.map((row, r) =>
          row.map((gemType, c) => {
            const isSelected =
              selected && selected.r === r && selected.c === c;
            const isFlashing = flashing && flashing.has(`${r},${c}`);
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  borderRadius: 6,
                  background: isFlashing
                    ? "rgba(255, 255, 255, 0.85)"
                    : "rgba(50, 30, 80, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: gameOver ? "default" : "pointer",
                  boxSizing: "border-box",
                  border: isSelected
                    ? "2.5px solid #FFD700"
                    : "2.5px solid transparent",
                  boxShadow: isSelected
                    ? "0 0 8px 2px rgba(255, 215, 0, 0.5)"
                    : "none",
                  transition: "border 0.1s, box-shadow 0.1s, background 0.15s",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              >
                {gemType >= 0 && gemType < NUM_GEM_TYPES && !isFlashing && (
                  <img
                    src={GEM_SPRITES[gemType]}
                    alt=""
                    draggable={false}
                    style={{
                      width: GEM_IMG_SIZE,
                      height: GEM_IMG_SIZE,
                      objectFit: "contain",
                      pointerEvents: "none",
                      imageRendering: "pixelated",
                    }}
                  />
                )}
              </div>
            );
          })
        )}

        {/* Game over overlay on grid */}
        {gameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(26, 10, 46, 0.88)",
              borderRadius: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              zIndex: 10,
            }}
          >
            <div
              style={{
                color: "#FFD700",
                fontSize: 24,
                fontWeight: "bold",
                fontFamily: "monospace",
              }}
            >
              游戏结束!
            </div>
            <div
              style={{
                color: "#e8d5f5",
                fontSize: 16,
                fontWeight: "bold",
                fontFamily: "monospace",
              }}
            >
              最终分数: {score}
            </div>
            <button
              onClick={resetGame}
              style={{
                marginTop: 8,
                padding: "8px 24px",
                borderRadius: 6,
                border: "none",
                background: "#7c3aed",
                color: "#fff",
                fontSize: 15,
                fontFamily: "monospace",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#6d28d9")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#7c3aed")
              }
            >
              再来一局
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
