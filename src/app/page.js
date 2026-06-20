"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PixelRoom from "@/components/PixelRoom";
import Modal from "@/components/Modal";

// 博主信息
const BLOG_OWNER = {
  name: "dr",
  bio: "欢迎来到我的像素小屋 🏠\n一个喜欢写代码和记录生活的人 ✨",
  avatar: "🧙‍♀️",
};

// ===== 日历组件 =====
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function CalendarView() {
  const [viewDate, setViewDate] = useState(() => new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // 当月第一天是星期几、当月天数
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 判断是否是"今天"
  const today = new Date();
  const isToday = (d) =>
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => setViewDate(new Date());

  // 构建日历格子
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-800/40 text-purple-300 transition"
        >
          ‹
        </button>
        <div className="text-center">
          <span className="text-white font-bold text-lg">
            {year}年{month + 1}月
          </span>
          <button
            onClick={goToday}
            className="ml-2 text-purple-400 text-xs hover:text-purple-300 transition"
          >
            今天
          </button>
        </div>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-800/40 text-purple-300 transition"
        >
          ›
        </button>
      </div>

      {/* 星期表头 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-purple-400/60 text-xs font-bold py-1"
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => (
          <div
            key={i}
            className={`aspect-square flex items-center justify-center rounded-lg text-sm transition ${
              day === null
                ? ""
                : isToday(day)
                ? "bg-purple-600 text-white font-bold shadow-lg shadow-purple-500/30"
                : "text-gray-300 hover:bg-purple-900/40"
            }`}
          >
            {day && (
              <span>
                {day}
                {isToday(day) && (
                  <span className="block text-[10px] font-normal -mt-0.5">
                    今天
                  </span>
                )}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 底部装饰 */}
      <p className="text-center text-purple-400/30 text-xs mt-4">
        🌙 今晚也要早点休息哦~
      </p>
    </div>
  );
}

// ===== 衣橱商品 =====
const OUTFITS = [
  {
    id: "default",
    name: "学院校服",
    emoji: "🎓",
    price: 0,
    description: "入学时发放的标准制服，紫色系魔法少女风",
    defaultOwned: true,
  },
  {
    id: "adventurer",
    name: "冒险者斗篷",
    emoji: "⚔️",
    price: 100,
    description: "厚实的旅行斗篷，适合踏上未知的冒险旅途",
  },
  {
    id: "pajama",
    name: "睡衣",
    emoji: "🌙",
    price: 60,
    description: "柔软舒适的居家睡衣，带星星图案",
  },
  {
    id: "witch-robe",
    name: "女巫魔法袍",
    emoji: "🔮",
    price: 150,
    description: "传说中高阶女巫才能穿的华丽法袍",
  },
];

export default function Home() {
  const router = useRouter();
  const [visitor, setVisitor] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [modal, setModal] = useState({ open: false, type: null });
  const [posts, setPosts] = useState([]);
  const [catSleeping, setCatSleeping] = useState(false);
  const [characterProfile, setCharacterProfile] = useState(false);

  // 编辑模式
  const [editMode, setEditMode] = useState(false);

  // 访客留言板
  const [guestbookEntries, setGuestbookEntries] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // 衣橱
  const [ownedOutfits, setOwnedOutfits] = useState(["default"]);
  const [equippedOutfit, setEquippedOutfit] = useState("default");
  const [coins, setCoins] = useState(200);

  useEffect(() => {
    // 检查用户登录状态
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setVisitor(user);
      setIsOwner(user.username === "dr");
    } else {
      const guestUser = sessionStorage.getItem("guestUser");
      if (guestUser) {
        setVisitor(JSON.parse(guestUser));
        setIsOwner(false);
      }
    }

    // 加载衣橱数据
    const savedOutfits = localStorage.getItem("ownedOutfits");
    if (savedOutfits) setOwnedOutfits(JSON.parse(savedOutfits));
    const savedEquipped = localStorage.getItem("equippedOutfit");
    if (savedEquipped) setEquippedOutfit(savedEquipped);
    const savedCoins = localStorage.getItem("coins");
    if (savedCoins) setCoins(parseInt(savedCoins, 10));

    // 检查编辑令牌
    const editToken = sessionStorage.getItem("editToken");
    if (editToken) setEditMode(true);

    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGuestbook = async () => {
    try {
      const res = await fetch("/api/guestbook");
      const data = await res.json();
      setGuestbookEntries(data.entries || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("guestUser");
    setVisitor(null);
    setIsOwner(false);
    setModal({ open: false, type: null });
  };

  const handleAction = useCallback(
    (objectId) => {
      switch (objectId) {
        case "bookshelf":
          setModal({ open: true, type: "posts" });
          break;
        case "wardrobe":
          setModal({ open: true, type: "wardrobe" });
          break;
        case "board":
          fetchGuestbook();
          setModal({ open: true, type: "guestbook" });
          break;
        case "character":
          setCharacterProfile(true);
          break;
        case "cat":
          setCatSleeping(true);
          break;
        case "window":
          setModal({ open: true, type: "window" });
          break;
        case "bed":
          setModal({ open: true, type: "calendar" });
          break;
      }
    },
    []
  );

  const closeModal = () => {
    setModal({ open: false, type: null });
    setNewMessage("");
  };

  // ===== 衣橱逻辑 =====
  const buyOutfit = (outfit) => {
    if (outfit.locked || ownedOutfits.includes(outfit.id)) return;
    if (coins < outfit.price) return;

    const newOwned = [...ownedOutfits, outfit.id];
    const newCoins = coins - outfit.price;
    setOwnedOutfits(newOwned);
    setCoins(newCoins);
    localStorage.setItem("ownedOutfits", JSON.stringify(newOwned));
    localStorage.setItem("coins", String(newCoins));
  };

  const equipOutfit = (outfitId) => {
    if (!ownedOutfits.includes(outfitId)) return;
    setEquippedOutfit(outfitId);
    localStorage.setItem("equippedOutfit", outfitId);
  };

  // ===== 留言板逻辑 =====
  const sendGuestbookMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setSendingMessage(true);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (res.ok) {
        setNewMessage("");
        fetchGuestbook();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1a0e2e] flex items-center justify-center">
      {/* ===== 🐱 小猫睡觉 — 全屏覆盖 ===== */}
      {catSleeping && (
        <div className="fixed inset-0 z-[100] bg-[#1a0e2e] flex flex-col items-center justify-center">
          <div className="relative w-full h-full">
            <img
              src="/image/小猫睡觉-放大交互.png"
              className="w-full h-full object-contain"
              style={{ imageRendering: "pixelated" }}
              alt="小猫在睡觉"
              draggable={false}
            />
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-[#1e1233]/80 backdrop-blur-sm text-purple-100 px-6 py-3 rounded-2xl border border-purple-400/30 shadow-xl text-center">
                <p className="text-base font-bold mb-0.5">🐱 小猫正在睡觉</p>
                <p className="text-purple-300/70 text-sm">稍后再来找她玩耍吧~</p>
              </div>
            </div>
            <button
              onClick={() => setCatSleeping(false)}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 px-6 py-2.5 bg-purple-600/80 hover:bg-purple-500 text-white rounded-full font-bold transition-all backdrop-blur-sm border border-purple-400/30 shadow-lg hover:shadow-purple-500/30"
            >
              🏠 返回小屋
            </button>
          </div>
        </div>
      )}

      {/* ===== 🧙‍♀️ 人物身份 — 全屏覆盖 ===== */}
      {characterProfile && (
        <div className="fixed inset-0 z-[100] bg-[#1a0e2e] flex flex-col items-center justify-center">
          <div className="relative w-full h-full">
            <img
              src="/image/身份交互界面.png"
              className="w-full h-full object-contain"
              style={{ imageRendering: "pixelated" }}
              alt="人物身份信息"
              draggable={false}
            />
            <button
              onClick={() => setCharacterProfile(false)}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 px-6 py-2.5 bg-purple-600/80 hover:bg-purple-500 text-white rounded-full font-bold transition-all backdrop-blur-sm border border-purple-400/30 shadow-lg hover:shadow-purple-500/30"
            >
              🏠 返回小屋
            </button>
          </div>
        </div>
      )}

      <PixelRoom
        user={{ username: BLOG_OWNER.name }}
        visitor={visitor}
        onAction={handleAction}
      />

      {/* ===== 右上角访客信息 ===== */}
      <div className="fixed top-3 right-4 z-30 flex items-center gap-3">
        {visitor ? (
          <>
            <span className="text-purple-200 text-sm bg-purple-900/50 px-2 py-1 rounded-full backdrop-blur-sm">
              {visitor.isGuest ? "👻" : "👤"} {visitor.username}
              {isOwner && " (博主)"}
            </span>
            <button
              onClick={handleLogout}
              className="text-purple-300/60 hover:text-purple-100 text-sm transition"
            >
              退出
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1 bg-purple-800/50 hover:bg-purple-700/70 text-purple-200 rounded-full text-sm transition backdrop-blur-sm border border-purple-500/30"
          >
            登录 / 注册
          </Link>
        )}
      </div>

      {/* ========================================== */}
      {/*               📚 书架 — 博客笔记              */}
      {/* ========================================== */}
      <Modal
        isOpen={modal.open && modal.type === "posts"}
        onClose={closeModal}
        title="📚 书架 — 博客日记 · 笔记"
      >
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">📖</p>
            <p className="text-gray-400 mb-4">书架上还是空的，还没有笔记</p>
            {(editMode || isOwner) && (
              <button
                onClick={() => {
                  closeModal();
                  router.push("/posts/new");
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-white"
              >
                ✏️ 写第一篇笔记
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {(editMode || isOwner) && (
              <button
                onClick={() => {
                  closeModal();
                  router.push("/posts/new");
                }}
                className="w-full py-3 border-2 border-dashed border-purple-500/30 rounded-lg text-purple-300 hover:border-purple-400/50 hover:text-purple-200 transition text-sm"
              >
                ✏️ 写新笔记
              </button>
            )}
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                onClick={closeModal}
                className="block bg-purple-900/30 rounded-lg p-4 hover:bg-purple-800/40 transition border border-purple-500/10 hover:border-purple-400/20"
              >
                <h3 className="font-semibold text-white mb-1.5">{post.title}</h3>
                <div className="text-sm text-purple-300/70 flex items-center gap-3">
                  <span>📅 {formatDate(post.createdAt)}</span>
                  <span>💬 {post._count.comments}</span>
                  <span>❤️ {post._count.likes}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Modal>

      {/* ========================================== */}
      {/*              👗 衣橱 — 衣服商城              */}
      {/* ========================================== */}
      <Modal
        isOpen={modal.open && modal.type === "wardrobe"}
        onClose={closeModal}
        title="👗 衣橱 — 衣服商城"
      >
        <div>
          {/* 金币余额 */}
          <div className="flex items-center justify-between mb-4 bg-purple-900/30 rounded-lg px-4 py-2.5 border border-purple-500/20">
            <span className="text-purple-200 text-sm">我的金币</span>
            <span className="text-yellow-400 font-bold text-lg">🪙 {coins}</span>
          </div>

          {/* 当前穿搭 */}
          <div className="mb-4 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-lg px-4 py-3 border border-purple-400/20">
            <p className="text-xs text-purple-400 mb-1">当前穿搭</p>
            <p className="text-white font-bold">
              {OUTFITS.find((o) => o.id === equippedOutfit)?.emoji}{" "}
              {OUTFITS.find((o) => o.id === equippedOutfit)?.name}
            </p>
          </div>

          {/* 商品列表 */}
          <div className="grid grid-cols-2 gap-3">
            {OUTFITS.map((outfit) => {
              const isOwned = outfit.defaultOwned || ownedOutfits.includes(outfit.id);
              const isEquipped = equippedOutfit === outfit.id;
              const canAfford = coins >= outfit.price;

              return (
                <div
                  key={outfit.id}
                  className={`relative rounded-xl p-3 border transition-all ${
                    outfit.locked
                      ? "bg-gray-800/50 border-gray-700/30 opacity-50"
                      : isEquipped
                      ? "bg-purple-800/40 border-purple-400/40 shadow-lg shadow-purple-500/10"
                      : isOwned
                      ? "bg-purple-900/30 border-purple-500/20 hover:border-purple-400/40"
                      : "bg-gray-800/30 border-gray-600/20 hover:border-gray-500/30"
                  }`}
                >
                  {/* 已装备标记 */}
                  {isEquipped && (
                    <div className="absolute -top-1.5 -right-1.5 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                      穿戴中
                    </div>
                  )}

                  {/* 图标 */}
                  <div className="text-3xl text-center mb-2">{outfit.emoji}</div>

                  {/* 名字 */}
                  <p className="text-white text-sm font-bold text-center mb-1">
                    {outfit.name}
                  </p>

                  {/* 描述 */}
                  <p className="text-gray-400 text-xs text-center mb-2 leading-relaxed">
                    {outfit.description}
                  </p>

                  {/* 操作按钮 */}
                  {!outfit.locked && (
                    <div className="text-center">
                      {isOwned ? (
                        isEquipped ? (
                          <span className="text-purple-300 text-xs">✨ 穿戴中</span>
                        ) : (
                          <button
                            onClick={() => equipOutfit(outfit.id)}
                            className="px-3 py-1 bg-purple-600/70 hover:bg-purple-600 text-white text-xs rounded-full transition"
                          >
                            换上
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => buyOutfit(outfit)}
                          disabled={!canAfford}
                          className={`px-3 py-1 text-xs rounded-full transition ${
                            canAfford
                              ? "bg-yellow-600/70 hover:bg-yellow-600 text-white"
                              : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          🪙 {outfit.price} 购买
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center text-purple-400/40 text-xs mt-4">
            💡 更多衣服设计中... 敬请期待！
          </p>
        </div>
      </Modal>

      {/* ========================================== */}
      {/*             🖼️ 画板 — 访客留言板              */}
      {/* ========================================== */}
      <Modal
        isOpen={modal.open && modal.type === "guestbook"}
        onClose={closeModal}
        title="🖼️ 画板 — 访客留言板"
      >
        <div>
          {/* 留言输入框 */}
          {visitor && !visitor.isGuest ? (
            <div className="mb-4 bg-purple-900/20 rounded-lg p-3 border border-purple-500/15">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="在画板上留下你的足迹... ✨"
                maxLength={200}
                rows={2}
                className="w-full bg-transparent text-white placeholder-purple-300/40 text-sm resize-none outline-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-purple-400/40 text-xs">
                  {newMessage.length}/200
                </span>
                <button
                  onClick={sendGuestbookMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-3 py-1 bg-purple-600/70 hover:bg-purple-600 disabled:bg-gray-700/50 disabled:text-gray-500 text-white text-xs rounded-full transition"
                >
                  {sendingMessage ? "发送中..." : "📌 贴上去"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 bg-purple-900/20 rounded-lg p-3 border border-purple-500/15 text-center">
              <p className="text-purple-300/60 text-sm">
                <Link
                  href="/login"
                  onClick={closeModal}
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  登录
                </Link>
                {" "}后才能在画板上留言哦 ✏️
              </p>
            </div>
          )}

          {/* 留言列表 */}
          {guestbookEntries.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-gray-400 text-sm">画板上还没有留言</p>
              <p className="text-gray-500 text-xs mt-1">成为第一个留言的访客吧！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {guestbookEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/10 hover:border-purple-400/20 transition"
                >
                  <div className="flex items-start gap-3">
                    {/* 头像 */}
                    <div className="w-8 h-8 bg-purple-700/50 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                      {entry.author.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-purple-200 text-sm font-bold">
                          {entry.author.username}
                        </span>
                        <span className="text-purple-400/40 text-xs">
                          {formatDateTime(entry.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {entry.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ========================================== */}
      {/*             🪟 窗户 — 窗外风景               */}
      {/* ========================================== */}
      <Modal
        isOpen={modal.open && modal.type === "window"}
        onClose={closeModal}
        title="🪟 窗外的风景"
      >
        <div className="text-center py-6">
          <div className="relative inline-block w-64 h-40 rounded-xl overflow-hidden border-4 border-amber-100/50 shadow-inner mb-4">
            {/* 天空渐变 */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, #4a6fa5 0%, #7fb3d3 40%, #b8d4e3 60%, #e8c99b 85%, #d4956b 100%)",
              }}
            />
            {/* 太阳 */}
            <div className="absolute text-3xl" style={{ top: "55%", left: "65%", filter: "drop-shadow(0 0 8px rgba(255,200,50,0.6))" }}>
              ☀️
            </div>
            {/* 云朵 */}
            <div className="absolute text-2xl opacity-80" style={{ top: "15%", left: "15%", animation: "float-soft 4s ease-in-out infinite" }}>
              ☁️
            </div>
            <div className="absolute text-lg opacity-60" style={{ top: "25%", left: "55%", animation: "float-soft 5s ease-in-out infinite 1s" }}>
              ☁️
            </div>
            {/* 树木 */}
            <div className="absolute bottom-0 left-2 text-2xl">🌳</div>
            <div className="absolute bottom-0 left-12 text-xl">🌲</div>
            <div className="absolute bottom-0 right-4 text-2xl">🌳</div>
          </div>
          <p className="text-gray-400 text-sm">窗外是一片宁静的森林...</p>
          <p className="text-purple-400/40 text-xs mt-1">阳光正好，微风不燥 🍃</p>
        </div>
      </Modal>

      {/* ========================================== */}
      {/*              🛏️ 床铺 — 日历                 */}
      {/* ========================================== */}
      <Modal
        isOpen={modal.open && modal.type === "calendar"}
        onClose={closeModal}
        title="🛏️ 床铺 — 日历"
      >
        <CalendarView />
      </Modal>
    </div>
  );
}
