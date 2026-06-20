"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ===== 调试开关 =====
const DEBUG_HOTSPOTS = false;

// ===== 交互物件配置 =====
// ★ 书架、画板、人物由用户鼠标实测校准；其余按同比例修正
const ITEMS = [
  {
    id: "bookshelf",
    label: "书架",
    description: "博客日记 · 笔记",
    emoji: "📚",
    color: "rgba(255,0,0,0.3)",
    // 实测：右上(27.2,15.3) 右下(26.4,48.6) → right≈27, top=15.3, bottom=48.6
    left: 9, top: 15, width: 18, height: 34,
  },
  {
    id: "wardrobe",
    label: "衣橱",
    description: "衣服商城",
    emoji: "👗",
    color: "rgba(0,255,0,0.3)",
    // 实测：左上(6.4,57.7) 右上(21.7,57.8)
    left: 6.4, top: 57.7, width: 15.3, height: 27,
  },
  {
    id: "door",
    label: "门",
    description: "门外的世界",
    emoji: "🚪",
    color: "rgba(0,0,255,0.3)",
    // 按校准比例修正
    left: 36, top: 15, width: 16, height: 27,
  },
  {
    id: "board",
    label: "画板",
    description: "访客留言板",
    emoji: "🖼️",
    color: "rgba(255,255,0,0.3)",
    // 实测：左上(76.8,18.6) 左下(76.8,29.5) 右下(89.2,29.5)
    left: 76.8, top: 18.6, width: 12.4, height: 10.9,
  },
  {
    id: "character",
    label: "小屋主人",
    description: "个人信息",
    emoji: "🧙‍♀️",
    color: "rgba(255,0,255,0.3)",
    // 实测：左上(44.2,49.5) 右下(53.3,73.1)
    left: 44.2, top: 49.5, width: 9.1, height: 23.6,
  },
  {
    id: "cat",
    label: "小猫",
    description: "喵~ 关于我",
    emoji: "🐱",
    color: "rgba(0,255,255,0.3)",
    // 按校准比例修正
    left: 72, top: 76, width: 14, height: 12,
  },
  {
    id: "window",
    label: "窗户",
    description: "窗外的风景",
    emoji: "🪟",
    color: "rgba(255,128,0,0.3)",
    // 按校准比例修正
    left: 57, top: 18, width: 13, height: 17,
  },
  {
    id: "bed",
    label: "床铺",
    description: "日历",
    emoji: "🛏️",
    color: "rgba(128,0,255,0.3)",
    // 右侧紫色月亮床：实测左上(72.0,33.5) 右下(90.8,72.0)
    left: 72, top: 33.5, width: 18.8, height: 38.5,
  },
];

const SHORTCUT_ITEMS = ["bookshelf", "wardrobe", "board", "character", "door", "bed"];

export default function PixelRoom({ user, onAction }) {
  const [hovered, setHovered] = useState(null);
  const [doorBubble, setDoorBubble] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  // overlay = 图片在屏幕上的真实渲染区域 { left, top, width, height }
  const [overlay, setOverlay] = useState(null);
  const imgRef = useRef(null);
  const bubbleTimer = useRef(null);

  // 测量图片实际渲染区域（object-fit: contain 会留白）
  const measureImage = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;

    const parent = img.parentElement;
    const pW = parent.clientWidth;
    const pH = parent.clientHeight;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const parentRatio = pW / pH;

    let rW, rH, oX, oY;
    if (parentRatio > imgRatio) {
      rH = pH;
      rW = pH * imgRatio;
      oX = (pW - rW) / 2;
      oY = 0;
    } else {
      rW = pW;
      rH = pW / imgRatio;
      oX = 0;
      oY = (pH - rH) / 2;
    }
    setOverlay({ left: oX, top: oY, width: rW, height: rH });
  }, []);

  useEffect(() => {
    measureImage();
    window.addEventListener("resize", measureImage);
    return () => window.removeEventListener("resize", measureImage);
  }, [measureImage]);

  useEffect(() => {
    return () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    };
  }, []);

  const showDoorBubble = useCallback(() => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    setDoorBubble("entering");
    bubbleTimer.current = setTimeout(() => {
      setDoorBubble("exiting");
      bubbleTimer.current = setTimeout(() => setDoorBubble(null), 500);
    }, 2500);
  }, []);

  const handleClick = useCallback(
    (item) => {
      if (item.id === "door") {
        showDoorBubble();
      } else if (onAction) {
        onAction(item.id);
      }
    },
    [onAction, showDoorBubble]
  );

  // 调试：鼠标坐标（相对于图片渲染区域的百分比）
  const handleMouseMove = useCallback(
    (e) => {
      if (!DEBUG_HOTSPOTS || !overlay) return;
      const x = ((e.clientX - overlay.left) / overlay.width) * 100;
      const y = ((e.clientY - overlay.top) / overlay.height) * 100;
      setMousePos({ x: x.toFixed(1), y: y.toFixed(1) });
    },
    [overlay]
  );

  return (
    <div
      className="w-screen h-screen relative bg-[#1a0e2e] select-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos(null)}
    >
      {/* 背景图：用 object-fit:contain 自适应，JS 测量实际渲染位置 */}
      <img
        ref={imgRef}
        src="/image/主场景1.png"
        className="w-full h-full object-contain"
        style={{ imageRendering: "pixelated" }}
        alt="像素小屋"
        draggable={false}
        onLoad={measureImage}
      />

      {/* ===== 热区叠层：精确覆盖在图片渲染区域上 ===== */}
      {overlay && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: overlay.left,
            top: overlay.top,
            width: overlay.width,
            height: overlay.height,
          }}
        >
          {ITEMS.map((item) => (
            <button
              key={item.id}
              className="absolute z-10 transition-all duration-200 rounded-lg pointer-events-auto"
              style={{
                top: `${item.top}%`,
                left: `${item.left}%`,
                width: `${item.width}%`,
                height: `${item.height}%`,
                background: DEBUG_HOTSPOTS
                  ? item.color
                  : hovered === item.id
                  ? "rgba(200, 170, 255, 0.15)"
                  : "transparent",
                boxShadow:
                  hovered === item.id
                    ? "0 0 20px rgba(200,170,255,0.4), inset 0 0 15px rgba(200,170,255,0.1)"
                    : "none",
                border: DEBUG_HOTSPOTS
                  ? `2px solid ${item.color.replace("0.3", "0.9")}`
                  : hovered === item.id
                  ? "2px solid rgba(200,170,255,0.5)"
                  : "2px solid transparent",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleClick(item)}
              aria-label={item.description}
            >
              {DEBUG_HOTSPOTS && (
                <span className="absolute top-0 left-0 bg-black/80 text-white text-xs px-1 rounded-br font-mono">
                  {item.label}
                </span>
              )}
              {hovered === item.id && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 pointer-events-none">
                  <div className="bg-[#2d1b4e]/95 text-purple-100 px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg border border-purple-400/40 backdrop-blur-sm">
                    {item.emoji} {item.description}
                  </div>
                  <div className="w-2 h-2 bg-[#2d1b4e]/95 rotate-45 mx-auto -mt-1 border-r border-b border-purple-400/40" />
                </div>
              )}
            </button>
          ))}

          {/* 门气泡 */}
          {doorBubble && (
            <div
              className={`absolute z-30 pointer-events-none ${
                doorBubble === "entering" ? "bubble-enter" : "bubble-exit"
              }`}
              style={{ left: "43.8%", top: "6%", transform: "translateX(-50%)" }}
            >
              <div className="bg-white/95 text-gray-700 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold backdrop-blur-sm border border-purple-200">
                <span className="inline-block animate-bounce mr-1">🚧</span>
                门外的世界：正在施工中...
              </div>
              <div className="w-3 h-3 bg-white/95 rotate-45 mx-auto -mt-1.5 border-r border-b border-purple-200" />
            </div>
          )}

          {/* 右下角标签 */}
          {user && (
            <div className="absolute bottom-2 right-3 bg-purple-900/70 text-purple-100 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm border border-purple-600/30 z-20 pointer-events-none">
              🏠 天才小钻大将军的异次元空间
            </div>
          )}
        </div>
      )}

      {/* 调试：鼠标坐标 */}
      {DEBUG_HOTSPOTS && mousePos && (
        <div className="fixed top-2 left-2 bg-black/80 text-green-400 font-mono text-sm px-3 py-1.5 rounded-lg z-50 pointer-events-none">
          X: {mousePos.x}% &nbsp; Y: {mousePos.y}%
        </div>
      )}

      {/* 底部快捷按钮 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 z-20">
        {ITEMS.filter((i) => SHORTCUT_ITEMS.includes(i.id)).map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800/80 text-purple-100 rounded-full text-sm transition-all backdrop-blur-sm border border-purple-500/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <span>{item.emoji}</span>
            <span>{item.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
