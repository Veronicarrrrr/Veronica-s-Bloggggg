"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("获取文章失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
        <h1 className="text-3xl font-bold mb-8">📚 所有笔记</h1>

        {loading ? (
          <p className="text-purple-300/60">加载中...</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-purple-300/40 text-lg mb-4">还没有笔记</p>
            <Link
              href="/"
              className="text-purple-400 hover:text-purple-300 hover:underline"
            >
              返回小屋
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="block bg-[#1e1233] rounded-xl p-6 hover:bg-purple-900/30 transition border border-purple-500/10 hover:border-purple-400/20"
              >
                <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                <p className="text-purple-300/50 mb-3 line-clamp-2 text-sm">
                  {post.content.length > 150
                    ? post.content.substring(0, 150) + "..."
                    : post.content}
                </p>
                <div className="flex items-center text-sm text-purple-300/40 space-x-4">
                  <span>👤 {post.author.username}</span>
                  <span>📅 {formatDate(post.createdAt)}</span>
                  <span>💬 {post._count.comments}</span>
                  <span>❤️ {post._count.likes}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
