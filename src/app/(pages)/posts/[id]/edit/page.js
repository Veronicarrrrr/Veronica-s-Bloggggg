"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EditPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchPost();
  }, []);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${id}`);
      const data = await res.json();
      if (res.ok) {
        setTitle(data.post.title);
        setContent(data.post.content);
      }
    } catch (err) {
      console.error("获取文章失败:", err);
    } finally {
      setFetching(false);
    }
  };

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

      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ title, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push(`/posts/${id}`);
    } catch (err) {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#1a0e2e] text-white flex items-center justify-center">
        <p className="text-purple-300/60">加载中...</p>
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
        <h1 className="text-3xl font-bold mb-8">📝 编辑文章</h1>

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
              required
            />
          </div>

          <div>
            <label className="block text-purple-300 mb-2 text-lg">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 bg-purple-900/20 border border-purple-500/15 rounded-xl text-white focus:outline-none focus:border-purple-400/40 min-h-[400px] resize-y"
              required
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-purple-600/70 hover:bg-purple-600 text-white font-bold rounded-xl transition disabled:opacity-50"
            >
              {loading ? "保存中..." : "保存修改"}
            </button>
            <Link
              href={`/posts/${id}`}
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
