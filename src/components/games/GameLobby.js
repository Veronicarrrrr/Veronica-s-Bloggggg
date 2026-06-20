"use client";

import React from "react";

const games = [
  {
    id: "2048",
    emoji: "🧩",
    name: "2048",
    desc: "合并方块，挑战最高分",
  },
  {
    id: "match",
    emoji: "💎",
    name: "消消乐",
    desc: "消除同色宝石，连击得分",
  },
  {
    id: "fish",
    emoji: "🐟",
    name: "大鱼吃小鱼",
    desc: "吃掉小鱼，避开大鱼",
  },
];

export default function GameLobby({ onSelectGame, onClose }) {
  return (
    <div className="flex flex-col items-center w-full p-4">
      <h2 className="text-2xl font-bold text-purple-200 mb-6 tracking-wider">
        🎮 像素游戏厅
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
        {games.map((game) => (
          <div
            key={game.id}
            className="flex flex-col items-center p-4 rounded-xl bg-purple-900/30 border border-purple-500/20 hover:border-purple-400/50 hover:bg-purple-800/40 transition-all duration-200"
          >
            <span className="text-4xl mb-2">{game.emoji}</span>
            <h3 className="text-lg font-bold text-purple-100 mb-1">
              {game.name}
            </h3>
            <p className="text-xs text-purple-300/70 text-center mb-3">
              {game.desc}
            </p>
            <button
              onClick={() => onSelectGame(game.id)}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors duration-150"
            >
              开始游戏
            </button>
          </div>
        ))}
      </div>

      {/* Leaderboard button */}
      <button
        onClick={() => onSelectGame("leaderboard")}
        className="mt-4 px-6 py-2.5 rounded-xl bg-yellow-600/30 border border-yellow-500/40 hover:border-yellow-400/60 hover:bg-yellow-600/40 text-yellow-200 text-sm font-bold transition-all duration-200"
      >
        🏆 排行榜
      </button>

      <button
        onClick={onClose}
        className="mt-6 px-5 py-2 rounded-lg bg-purple-900/40 border border-purple-500/20 hover:bg-purple-800/50 text-purple-200 text-sm font-medium transition-colors duration-150"
      >
        🏠 返回小屋
      </button>
    </div>
  );
}
