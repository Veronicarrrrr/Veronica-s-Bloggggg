"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    } catch (err) {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    // 游客模式：不存token，只存一个临时身份
    const guestUser = {
      id: "guest_" + Date.now(),
      username: "游客" + Math.floor(Math.random() * 10000),
      isGuest: true,
    };
    sessionStorage.setItem("guestUser", JSON.stringify(guestUser));
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a0e2e]">
      <div className="bg-[#1e1233] p-8 rounded-xl shadow-lg w-full max-w-md border border-purple-500/20">
        <h1 className="text-2xl font-bold text-white text-center mb-6">
          🏠 登录 - 像素小屋
        </h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-purple-200 mb-1 text-sm">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-purple-900/30 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-400/50 placeholder-purple-300/40"
              placeholder="输入用户名"
              required
            />
          </div>

          <div>
            <label className="block text-purple-200 mb-1 text-sm">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-purple-900/30 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-400/50 placeholder-purple-300/40"
              placeholder="输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        {/* GitHub 登录 */}
        <div className="mt-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-500/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#1e1233] px-3 text-purple-400/60">或</span>
            </div>
          </div>
          <a
            href="/api/auth/github"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            使用 GitHub 登录
          </a>
        </div>

        {/* 游客登录 */}
        <div className="mt-4">
          <button
            onClick={handleGuestLogin}
            className="w-full py-2.5 bg-purple-900/40 hover:bg-purple-800/50 text-purple-200 rounded-lg transition border border-purple-500/20"
          >
            👻 游客登录
          </button>
          <p className="text-purple-400/40 text-center text-xs mt-2">
            你的浏览将无痕处理，关闭页面后数据不保留
          </p>
        </div>

        <p className="text-purple-300/60 text-center mt-5">
          没有账号？{" "}
          <Link href="/register" className="text-purple-400 hover:text-purple-300 hover:underline">
            去注册
          </Link>
        </p>
      </div>
    </div>
  );
}
