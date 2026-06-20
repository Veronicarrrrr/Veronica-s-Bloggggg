"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PixelRoom from "@/components/PixelRoom";
import Modal from "@/components/Modal";
import GameLobby from "@/components/games/GameLobby";
import Game2048 from "@/components/games/Game2048";
import MatchGame from "@/components/games/MatchGame";
import FishGame from "@/components/games/FishGame";

// 博主信息
const BLOG_OWNER = {
  name: "dr",
  bio: "欢迎来到我的像素小屋 🏠\n一个喜欢写代码和记录生活的人 ✨",
  avatar: "🧙‍♀️",
};

// ===== 游戏面板 =====
function GamesPanel({ onClose }) {
  const [currentGame, setCurrentGame] = useState(null);

  if (currentGame === "2048") return <Game2048 onBack={() => setCurrentGame(null)} />;
  if (currentGame === "match") return <MatchGame onBack={() => setCurrentGame(null)} />;
  if (currentGame === "fish") return <FishGame onBack={() => setCurrentGame(null)} />;

  return <GameLobby onSelectGame={setCurrentGame} onClose={onClose} />;
}

// ===== 衣柜热区映射（图片从左到右的衣服位置 → outfit id）=====
const WARDROBE_ZONES = [
  { id: "adventurer", left: 7, top: 24, width: 21, height: 50 },   // 冒险者斗篷（左1）
  { id: "witch-robe", left: 27, top: 22, width: 21, height: 54 },  // 女巫魔法袍（左2）
  { id: "default",    left: 48, top: 22, width: 21, height: 54 },  // 学院校服（左3）
  { id: "pajama",     left: 69, top: 24, width: 22, height: 48 },  // 睡衣（右1）
];

function WardrobeHotspots({ outfits, selected, onSelect, ownedOutfits, equippedOutfit, coins, onBuy, onEquip }) {
  const imgRef = useRef(null);
  const [overlay, setOverlay] = useState(null);

  const measure = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const parent = img.parentElement;
    const pW = parent.clientWidth, pH = parent.clientHeight;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const parentRatio = pW / pH;
    let rW, rH, oX, oY;
    if (parentRatio > imgRatio) {
      rH = pH; rW = pH * imgRatio; oX = (pW - rW) / 2; oY = 0;
    } else {
      rW = pW; rH = pW / imgRatio; oX = 0; oY = (pH - rH) / 2;
    }
    setOverlay({ left: oX, top: oY, width: rW, height: rH });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // 隐藏的图片仅用于测量
  const selectedOutfit = selected ? outfits.find(o => o.id === selected) : null;
  const isOwned = selectedOutfit && (selectedOutfit.defaultOwned || ownedOutfits.includes(selectedOutfit.id));
  const isEquipped = selectedOutfit && equippedOutfit === selectedOutfit.id;
  const canAfford = selectedOutfit && coins >= selectedOutfit.price;

  return (
    <>
      {/* 隐藏测量用图片 */}
      <img
        ref={imgRef}
        src="/image/衣柜-敞开.png"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-0"
        onLoad={measure}
        alt=""
      />

      {overlay && (
        <div className="absolute pointer-events-none" style={{ left: overlay.left, top: overlay.top, width: overlay.width, height: overlay.height }}>
          {/* 4 个衣服热区 */}
          {WARDROBE_ZONES.map(zone => (
            <button
              key={zone.id}
              className="absolute pointer-events-auto transition-all duration-200 rounded-lg"
              style={{
                left: `${zone.left}%`, top: `${zone.top}%`,
                width: `${zone.width}%`, height: `${zone.height}%`,
                background: selected === zone.id ? "rgba(200,170,255,0.2)" : "transparent",
                boxShadow: selected === zone.id ? "0 0 24px rgba(200,170,255,0.5), inset 0 0 16px rgba(200,170,255,0.15)" : "none",
                border: selected === zone.id ? "2px solid rgba(200,170,255,0.6)" : "2px solid transparent",
                cursor: "pointer",
              }}
              onClick={(e) => { e.stopPropagation(); onSelect(selected === zone.id ? null : zone.id); }}
            />
          ))}

          {/* 选中衣服时弹出信息卡 */}
          {selectedOutfit && (() => {
            const zone = WARDROBE_ZONES.find(z => z.id === selected);
            if (!zone) return null;
            const cardLeft = zone.left + zone.width / 2;
            return (
              <div
                className="absolute z-20 pointer-events-auto"
                style={{ left: `${cardLeft}%`, top: `${zone.top - 2}%`, transform: "translate(-50%, -100%)" }}
                onClick={e => e.stopPropagation()}
              >
                <div className="bg-[#1e1233]/95 backdrop-blur-sm text-white px-5 py-4 rounded-xl border border-purple-400/40 shadow-2xl min-w-[180px] text-center">
                  <p className="font-bold text-base mb-1">{selectedOutfit.emoji} {selectedOutfit.name}</p>
                  <p className="text-purple-300/70 text-xs mb-2">{selectedOutfit.description}</p>
                  {selectedOutfit.price > 0 && (
                    <p className="text-yellow-400 text-sm font-bold mb-2">🪙 {selectedOutfit.price} 金币</p>
                  )}
                  {selectedOutfit.price === 0 && (
                    <p className="text-green-400 text-sm font-bold mb-2">✨ 免费</p>
                  )}
                  {/* 操作按钮 */}
                  {isEquipped ? (
                    <span className="text-purple-300 text-xs">✨ 穿戴中</span>
                  ) : isOwned ? (
                    <button
                      onClick={() => onEquip(selectedOutfit.id)}
                      className="px-4 py-1.5 bg-purple-600/80 hover:bg-purple-500 text-white text-xs rounded-full transition"
                    >
                      换上
                    </button>
                  ) : canAfford ? (
                    <button
                      onClick={() => onBuy(selectedOutfit)}
                      className="px-4 py-1.5 bg-yellow-600/80 hover:bg-yellow-500 text-white text-xs rounded-full transition"
                    >
                      🪙 购买
                    </button>
                  ) : (
                    <span className="text-gray-500 text-xs">金币不足</span>
                  )}
                </div>
                <div className="w-3 h-3 bg-[#1e1233]/95 rotate-45 mx-auto -mt-1.5 border-r border-b border-purple-400/40" />
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}

// ===== 衣橱商品 =====
const OUTFITS = [
  {
    id: "default",
    name: "学院校服",
    emoji: "🎓",
    image: "/image/衣服-学院制服.png",
    price: 0,
    description: "入学时发放的标准制服，紫色系魔法少女风",
    defaultOwned: true,
  },
  {
    id: "adventurer",
    name: "冒险者斗篷",
    emoji: "⚔️",
    image: "/image/衣服-冒险者斗篷.png",
    price: 100,
    description: "厚实的旅行斗篷，适合踏上未知的冒险旅途",
  },
  {
    id: "pajama",
    name: "睡衣",
    emoji: "🌙",
    image: "/image/衣服-睡衣.png",
    price: 60,
    description: "柔软舒适的居家睡衣，带星星图案",
  },
  {
    id: "witch-robe",
    name: "女巫魔法袍",
    emoji: "🔮",
    image: "/image/衣服-女巫魔法袍.png",
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
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [wardrobeSelected, setWardrobeSelected] = useState(null); // outfit id or null

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

    // Handle GitHub OAuth callback
    const params = new URLSearchParams(window.location.search);
    const callbackToken = params.get("token");
    const callbackUser = params.get("user");
    if (callbackToken && callbackUser) {
      localStorage.setItem("token", callbackToken);
      localStorage.setItem("user", callbackUser);
      setVisitor(JSON.parse(callbackUser));
      // Clean URL
      window.history.replaceState({}, "", "/");
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
          setWardrobeOpen(true);
          setWardrobeSelected(null);
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
          setModal({ open: true, type: "games" });
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
      {/*         👗 衣橱 — 全屏衣柜交互页面            */}
      {/* ========================================== */}
      {wardrobeOpen && (
        <div className="fixed inset-0 z-[100] bg-[#1a0e2e] flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* 衣柜敞开图 */}
            <img
              src="/image/衣柜-敞开.png"
              className="w-full h-full object-contain"
              alt="衣柜"
              draggable={false}
              onClick={() => setWardrobeSelected(null)}
            />

            {/* 4个衣服热区叠层 — 需要 JS 测量图片实际渲染区域 */}
            <WardrobeHotspots
              outfits={OUTFITS}
              selected={wardrobeSelected}
              onSelect={setWardrobeSelected}
              ownedOutfits={ownedOutfits}
              equippedOutfit={equippedOutfit}
              coins={coins}
              onBuy={buyOutfit}
              onEquip={equipOutfit}
            />

            {/* 返回按钮 */}
            <button
              onClick={() => { setWardrobeOpen(false); setWardrobeSelected(null); }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-6 py-2.5 bg-purple-600/80 hover:bg-purple-500 text-white rounded-full font-bold transition-all backdrop-blur-sm border border-purple-400/30 shadow-lg hover:shadow-purple-500/30"
            >
              🏠 返回小屋
            </button>
          </div>
        </div>
      )}

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
      {/*              🛏️ 床铺 — 小游戏               */}
      {/* ========================================== */}
      <Modal
        isOpen={modal.open && modal.type === "games"}
        onClose={closeModal}
        title="🎮 游戏大厅"
      >
        <GamesPanel onClose={closeModal} />
      </Modal>
    </div>
  );
}
