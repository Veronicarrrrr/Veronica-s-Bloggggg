"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/lib/leaderboard";

const GRID_SIZE = 4;

const TILE_COLORS = {
  0: "transparent",
  2: "#f3e8ff",
  4: "#e9d5ff",
  8: "#d8b4fe",
  16: "#c084fc",
  32: "#a855f7",
  64: "#9333ea",
  128: "#7e22ce",
  256: "#6b21a8",
  512: "#581c87",
  1024: "#3b0764",
  2048: "#FFD700",
};

function getTextColor(value) {
  if (value === 0) return "transparent";
  if (value <= 4) return "#4a1d8a";
  if (value === 2048) return "#4a1d8a";
  return "#ffffff";
}

function getFontSize(value) {
  if (value >= 1024) return "1.1rem";
  if (value >= 128) return "1.3rem";
  return "1.6rem";
}

function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function addRandomTile(grid) {
  const empty = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) empty.push({ r, c });
    }
  }
  if (empty.length === 0) return;
  const cell = empty[Math.floor(Math.random() * empty.length)];
  grid[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
}

function initGrid() {
  const g = createEmptyGrid();
  addRandomTile(g);
  addRandomTile(g);
  return g;
}

function checkGameOver(grid) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return false;
      if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

function slideRow(row) {
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

export default function Game2048({ onBack }) {
  const [grid, setGrid] = useState(() => initGrid());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const containerRef = useRef(null);
  const touchStart = useRef({ x: 0, y: 0 });

  const move = useCallback(
    (direction) => {
      if (gameOver) return;

      const newGrid = grid.map((row) => [...row]);
      let totalScored = 0;
      let moved = false;

      if (direction === "left") {
        for (let r = 0; r < GRID_SIZE; r++) {
          const { result, scored } = slideRow(newGrid[r]);
          if (newGrid[r].join(",") !== result.join(",")) moved = true;
          newGrid[r] = result;
          totalScored += scored;
        }
      } else if (direction === "right") {
        for (let r = 0; r < GRID_SIZE; r++) {
          const reversed = [...newGrid[r]].reverse();
          const { result, scored } = slideRow(reversed);
          const final = result.reverse();
          if (newGrid[r].join(",") !== final.join(",")) moved = true;
          newGrid[r] = final;
          totalScored += scored;
        }
      } else if (direction === "up") {
        for (let c = 0; c < GRID_SIZE; c++) {
          const col = newGrid.map((row) => row[c]);
          const { result, scored } = slideRow(col);
          if (col.join(",") !== result.join(",")) moved = true;
          for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = result[r];
          totalScored += scored;
        }
      } else if (direction === "down") {
        for (let c = 0; c < GRID_SIZE; c++) {
          const col = newGrid.map((row) => row[c]).reverse();
          const { result, scored } = slideRow(col);
          const final = result.reverse();
          const origCol = newGrid.map((row) => row[c]);
          if (origCol.join(",") !== final.join(",")) moved = true;
          for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = final[r];
          totalScored += scored;
        }
      }

      if (moved) {
        addRandomTile(newGrid);
        setGrid(newGrid);
        const newScore = score + totalScored;
        setScore(newScore);
        if (checkGameOver(newGrid)) {
          setGameOver(true);
          saveScore("2048", newScore);
        }
      }
    },
    [grid, score, gameOver]
  );

  // Keyboard handler on the container div
  const handleKeyDown = useCallback(
    (e) => {
      const keyMap = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };
      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        e.stopPropagation();
        move(dir);
      }
    },
    [move]
  );

  // Touch swipe handlers
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
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
    },
    [move]
  );

  // Auto-focus on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  function resetGame() {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
    setTimeout(() => {
      if (containerRef.current) containerRef.current.focus();
    }, 0);
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      autoFocus
      onKeyDown={handleKeyDown}
      style={{
        backgroundImage: "url('/image/小游戏背景图.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        outline: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px",
        minHeight: "100%",
        fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        userSelect: "none",
      }}
    >
      {/* Top bar: back button + score */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          maxWidth: 400,
          marginBottom: 12,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          style={{
            background: "none",
            border: "none",
            color: "#d8b4fe",
            fontSize: "0.95rem",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: 6,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#f3e8ff")}
          onMouseLeave={(e) => (e.target.style.color = "#d8b4fe")}
        >
          ← 返回
        </button>

        <div
          style={{
            background: "rgba(30,18,51,0.45)",
            color: "#f3e8ff",
            fontWeight: "bold",
            fontSize: "1.1rem",
            padding: "6px 18px",
            borderRadius: 10,
            letterSpacing: 1,
          }}
        >
          分数：{score}
        </div>
      </div>

      {/* Grid */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          background: "rgba(30,18,51,0.85)",
          borderRadius: 14,
          padding: 10,
          width: "100%",
          maxWidth: 400,
          aspectRatio: "1 / 1",
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gap: 8,
          touchAction: "none",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {grid.flat().map((value, idx) => {
          const bg = TILE_COLORS[value] || TILE_COLORS[2048];
          const color = getTextColor(value);
          const fontSize = getFontSize(value);
          return (
            <div
              key={idx}
              style={{
                background: value === 0 ? "rgba(80,50,120,0.35)" : bg,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize,
                color,
                aspectRatio: "1 / 1",
                transition: "background 0.15s ease",
                boxShadow:
                  value > 0
                    ? "0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)"
                    : "none",
              }}
            >
              {value > 0 ? value : ""}
            </div>
          );
        })}

        {/* Game over overlay */}
        {gameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(30,18,51,0.9)",
              borderRadius: 14,
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
                fontWeight: "bold",
                fontSize: "1.7rem",
              }}
            >
              游戏结束!
            </div>
            <div
              style={{
                color: "#f3e8ff",
                fontSize: "1.1rem",
              }}
            >
              最终分数：{score}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetGame();
              }}
              style={{
                marginTop: 8,
                padding: "8px 24px",
                borderRadius: 8,
                border: "none",
                background: "#a855f7",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#9333ea")}
              onMouseLeave={(e) => (e.target.style.background = "#a855f7")}
            >
              再来一局
            </button>
          </div>
        )}
      </div>

      {/* Directional buttons */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            move("up");
            containerRef.current?.focus();
          }}
          style={btnStyle}
          onMouseEnter={btnHoverIn}
          onMouseLeave={btnHoverOut}
        >
          ↑
        </button>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              move("left");
              containerRef.current?.focus();
            }}
            style={btnStyle}
            onMouseEnter={btnHoverIn}
            onMouseLeave={btnHoverOut}
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              move("down");
              containerRef.current?.focus();
            }}
            style={btnStyle}
            onMouseEnter={btnHoverIn}
            onMouseLeave={btnHoverOut}
          >
            ↓
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              move("right");
              containerRef.current?.focus();
            }}
            style={btnStyle}
            onMouseEnter={btnHoverIn}
            onMouseLeave={btnHoverOut}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

const btnStyle = {
  width: 52,
  height: 52,
  borderRadius: 10,
  border: "none",
  background: "rgba(168,85,247,0.7)",
  color: "#fff",
  fontWeight: "bold",
  fontSize: "1.3rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.2s",
  userSelect: "none",
  WebkitTapHighlightColor: "transparent",
};

function btnHoverIn(e) {
  e.currentTarget.style.background = "rgba(147,51,234,0.9)";
}

function btnHoverOut(e) {
  e.currentTarget.style.background = "rgba(168,85,247,0.7)";
}
