"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // 有编辑令牌或已登录用户均可访问
    const editToken = sessionStorage.getItem("editToken");
    const token = localStorage.getItem("token");
    if (editToken || token) setHasAccess(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const editToken = sessionStorage.getItem("editToken");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (editToken) headers["x-edit-token"] = editToken;

      const res = await fetch("/api/posts", {
        method: "POST",
        headers,
        body: JSON.stringify({ title, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push(`/posts/${data.post.id}`);
    } catch (err) {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#1a0e2e] text-white flex flex-col items-center justify-center">
        <p className="text-purple-300/60 text-lg mb-4">需要编辑权限才能写文章</p>
        <Link href="/" className="text-purple-400 hover:text-purple-300 hover:underline">
          返回小屋
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a0e2e] text-white">
      <nav className="bg-[#1e1233] border-b border-purple-500/15 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-lg font-bold text-purple-200 hover:text-white transition">
            🏠 返回小屋
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">✏️ 写笔记</h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-purple-300 mb-2 text-lg">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-purple-900/20 border border-purple-500/15 rounded-xl text-white text-lg focus:outline-none focus:border-purple-400/40"
              placeholder="输入文章标题"
              required
            />
          </div>

          <div>
            <label className="block text-purple-300 mb-2 text-lg">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 bg-purple-900/20 border border-purple-500/15 rounded-xl text-white focus:outline-none focus:border-purple-400/40 min-h-[400px] resize-y"
              placeholder="写下你的想法..."
              required
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-purple-600/70 hover:bg-purple-600 text-white font-bold rounded-xl transition disabled:opacity-50"
            >
              {loading ? "发布中..." : "发布笔记"}
            </button>
            <Link
              href="/"
              className="px-8 py-3 bg-purple-900/30 hover:bg-purple-800/40 text-purple-200 rounded-xl transition border border-purple-500/15"
            >
              取消
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
