"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import MarkdownRenderer from "@/components/MarkdownRenderer";

function CommentItem({ comment, depth = 0, user, onReply, onDelete, formatDate }) {
  if (depth > 3) return null; // max 3 levels
  return (
    <div style={{ marginLeft: depth > 0 ? 24 : 0 }}>
      <div className={`bg-purple-900/20 rounded-xl p-3 border border-purple-500/10 ${depth > 0 ? 'border-l-2 border-l-purple-500/30' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-sm text-purple-300/60">
            <span>👤 {comment.author.username}</span>
            <span className="mx-2">·</span>
            <span>{formatDate(comment.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onReply(comment)} className="text-purple-400/60 hover:text-purple-300 text-xs">回复</button>
            {user && user.id === comment.authorId && (
              <button onClick={() => onDelete(comment.id)} className="text-red-400/60 hover:text-red-400 text-xs">删除</button>
            )}
          </div>
        </div>
        <p className="text-gray-200 text-sm">{comment.content}</p>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} user={user} onReply={onReply} onDelete={onDelete} formatDate={formatDate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // 编辑模式
  const [editMode, setEditMode] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // 评论相关
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // { id, username }

  // 点赞相关
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    // 检查是否已有编辑令牌
    const editToken = sessionStorage.getItem("editToken");
    if (editToken) setEditMode(true);

    fetchPost();
  }, []);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${id}`);
      const data = await res.json();
      if (res.ok) {
        setPost(data.post);
        setLikeCount(data.post._count.likes);

        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const u = JSON.parse(savedUser);
          const hasLiked = data.post.likes.some((l) => l.userId === u.id);
          setLiked(hasLiked);
        }
      }
    } catch (err) {
      console.error("获取文章失败:", err);
    } finally {
      setLoading(false);
    }
  };

  // 验证编辑密码
  const handleVerifyPassword = async () => {
    if (!passwordInput.trim()) return;
    setPasswordError("");

    try {
      const res = await fetch("/api/auth/edit-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem("editToken", data.editToken);
        setEditMode(true);
        setShowPasswordInput(false);
        setPasswordInput("");
      } else {
        setPasswordError(data.error || "密码错误");
      }
    } catch {
      setPasswordError("网络错误");
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这篇文章吗？")) return;

    try {
      const token = localStorage.getItem("token");
      const editToken = sessionStorage.getItem("editToken");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (editToken) headers["x-edit-token"] = editToken;

      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        router.push("/");
      }
    } catch (err) {
      console.error("删除失败:", err);
    }
  };

  // 发表评论
  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setCommentLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: commentText, parentId: replyTo?.id || null }),
      });

      const data = await res.json();
      if (res.ok) {
        // Refresh post to get updated nested comments
        fetchPost();
        setCommentText("");
        setReplyTo(null);
      }
    } catch (err) {
      console.error("评论失败:", err);
    } finally {
      setCommentLoading(false);
    }
  };

  // 删除评论
  const handleDeleteComment = async (commentId) => {
    if (!confirm("确定删除这条评论吗？")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/posts/${id}/comments?commentId=${commentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        fetchPost();
      }
    } catch (err) {
      console.error("删除评论失败:", err);
    }
  };

  // 点赞
  const handleLike = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setLikeLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/posts/${id}/likes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setLiked(data.liked);
        setLikeCount(data.count);
      }
    } catch (err) {
      console.error("点赞失败:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a0e2e] text-white flex items-center justify-center">
        <p className="text-purple-300/60">加载中...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#1a0e2e] text-white flex flex-col items-center justify-center">
        <p className="text-gray-400 text-lg mb-4">文章不存在</p>
        <Link href="/" className="text-purple-400 hover:underline">
          返回小屋
        </Link>
      </div>
    );
  }

  const isAuthor = user && user.id === post.authorId;
  const canEdit = editMode || isAuthor;

  return (
    <div className="min-h-screen bg-[#1a0e2e] text-white">
      {/* 顶部导航 */}
      <nav className="bg-[#1e1233] border-b border-purple-500/15 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-lg font-bold text-purple-200 hover:text-white transition">
            🏠 返回小屋
          </Link>
          <div className="flex items-center gap-3">
            {/* 编辑模式按钮 */}
            {!editMode && (
              <button
                onClick={() => setShowPasswordInput(!showPasswordInput)}
                className="text-purple-400/60 hover:text-purple-300 text-sm transition"
                title="编辑模式"
              >
                🔐
              </button>
            )}
            {editMode && (
              <span className="text-purple-400 text-xs bg-purple-900/50 px-2 py-1 rounded-full">
                ✏️ 编辑模式
              </span>
            )}
          </div>
        </div>

        {/* 密码输入框 */}
        {showPasswordInput && (
          <div className="max-w-4xl mx-auto mt-3 flex items-center gap-2">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
              placeholder="输入编辑密码..."
              className="flex-1 px-3 py-2 bg-purple-900/30 border border-purple-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400/50"
              autoFocus
            />
            <button
              onClick={handleVerifyPassword}
              className="px-3 py-2 bg-purple-600/70 hover:bg-purple-600 text-white text-sm rounded-lg transition"
            >
              验证
            </button>
            {passwordError && (
              <span className="text-red-400 text-xs">{passwordError}</span>
            )}
          </div>
        )}
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* 文章 */}
        <article>
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center text-purple-300/60 mb-4 space-x-4 text-sm">
            <span>👤 {post.author.username}</span>
            <span>📅 {formatDate(post.createdAt)}</span>
          </div>

          {/* 编辑/删除操作 */}
          {canEdit && (
            <div className="flex space-x-3 mb-6">
              <Link
                href={`/posts/${post.id}/edit`}
                className="px-4 py-2 bg-purple-600/70 hover:bg-purple-600 rounded-lg transition text-sm"
              >
                ✏️ 编辑
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600/70 hover:bg-red-600 rounded-lg transition text-sm"
              >
                🗑️ 删除
              </button>
            </div>
          )}

          {/* 文章内容 */}
          <div className="bg-[#1e1233] rounded-xl p-6 border border-purple-500/10 mb-6">
            <MarkdownRenderer content={post.content} />
          </div>

          {/* 点赞按钮 */}
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition font-bold text-lg ${
                liked
                  ? "bg-pink-600/70 hover:bg-pink-600 text-white"
                  : "bg-purple-900/30 hover:bg-purple-800/40 text-purple-300 border border-purple-500/20"
              }`}
            >
              <span>{liked ? "❤️" : "🤍"}</span>
              <span>{likeCount}</span>
              <span className="text-sm font-normal">
                {liked ? "已点赞" : "点赞"}
              </span>
            </button>
            <span className="text-purple-300/50">
              💬 {post._count.comments} 条评论
            </span>
          </div>
        </article>

        {/* 评论区 */}
        <section>
          <h2 className="text-2xl font-bold mb-6">💬 评论</h2>

          {/* 评论输入框 */}
          {user ? (
            <form onSubmit={handleComment} className="mb-6">
              {replyTo && (
                <div className="flex items-center gap-2 mb-2 text-sm text-purple-300/60">
                  <span>回复 @{replyTo.username}</span>
                  <button onClick={() => setReplyTo(null)} className="text-red-400/60 hover:text-red-300">✕ 取消</button>
                </div>
              )}
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full px-4 py-3 bg-purple-900/20 border border-purple-500/15 rounded-xl text-white focus:outline-none focus:border-purple-400/40 resize-y min-h-[100px]"
                placeholder={replyTo ? `回复 @${replyTo.username}...` : "写下你的评论..."}
                required
              />
              <button
                type="submit"
                disabled={commentLoading || !commentText.trim()}
                className="mt-2 px-6 py-2 bg-purple-600/70 hover:bg-purple-600 text-white rounded-lg transition disabled:opacity-50 text-sm"
              >
                {commentLoading ? "发送中..." : "发表评论"}
              </button>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-purple-900/20 rounded-xl border border-purple-500/10 text-center">
              <Link href="/login" className="text-purple-400 hover:text-purple-300 hover:underline">
                登录后可以发表评论
              </Link>
            </div>
          )}

          {/* 评论列表 */}
          {post.comments.length === 0 ? (
            <p className="text-purple-300/40">还没有评论，来说点什么吧</p>
          ) : (
            <div className="space-y-4">
              {post.comments
                .filter((comment) => comment.parentId === null || comment.parentId === undefined)
                .map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    depth={0}
                    user={user}
                    onReply={(c) => setReplyTo({ id: c.id, username: c.author.username })}
                    onDelete={handleDeleteComment}
                    formatDate={formatDate}
                  />
                ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
