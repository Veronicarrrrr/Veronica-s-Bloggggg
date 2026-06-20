"use client";

import React, { useState } from "react";
import { getScores } from "@/lib/leaderboard";

const TABS = [
  { id: "2048", label: "2048" },
  { id: "match", label: "消消乐" },
  { id: "fish", label: "大鱼吃小鱼" },
];

function getRankDisplay(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `${index + 1}`;
}

export default function Leaderboard({ onBack }) {
  const [activeTab, setActiveTab] = useState("2048");
  const scores = getScores(activeTab);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        backgroundImage: "url('/image/小游戏背景图.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 12,
        padding: "16px 20px 20px",
        minHeight: 400,
        fontFamily: "monospace",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          marginBottom: 16,
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
            fontSize: 18,
            fontWeight: "bold",
            color: "#FFD700",
            fontFamily: "monospace",
          }}
        >
          🏆 排行榜
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          width: "100%",
          justifyContent: "center",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "none",
              fontFamily: "monospace",
              fontSize: 13,
              fontWeight: "bold",
              cursor: "pointer",
              background:
                activeTab === tab.id
                  ? "rgba(124, 58, 237, 0.85)"
                  : "rgba(50, 30, 80, 0.5)",
              color: activeTab === tab.id ? "#fff" : "#c4b5fd",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scores list */}
      <div
        style={{
          width: "100%",
          background: "rgba(30, 18, 51, 0.6)",
          borderRadius: 10,
          padding: "12px 16px",
          minHeight: 200,
        }}
      >
        {scores.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#c4b5fd",
              fontSize: 14,
              padding: "40px 0",
            }}
          >
            还没有记录，快去挑战吧！
          </div>
        ) : (
          scores.map((entry, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 4px",
                borderBottom:
                  index < scores.length - 1
                    ? "1px solid rgba(124, 58, 237, 0.2)"
                    : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontSize: index < 3 ? 20 : 14,
                    fontWeight: "bold",
                    color: index < 3 ? "#FFD700" : "#c4b5fd",
                    width: 32,
                    textAlign: "center",
                  }}
                >
                  {getRankDisplay(index)}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: "bold",
                    color: "#e8d5f5",
                  }}
                >
                  {entry.score}
                </span>
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: "#a78bfa",
                }}
              >
                {entry.date}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
