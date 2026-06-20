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
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center mb-6">
          🏠 登录 - 像素小屋
        </h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              placeholder="输入用户名"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              placeholder="输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        {/* 分隔线 */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-gray-600" />
          <span className="px-3 text-gray-500 text-sm">或</span>
          <div className="flex-1 border-t border-gray-600" />
        </div>

        {/* 游客登录 */}
        <button
          onClick={handleGuestLogin}
          className="w-full py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition"
        >
          👻 游客登录
        </button>
        <p className="text-gray-500 text-center text-xs mt-2">
          你的浏览将无痕处理，关闭页面后数据不保留
        </p>

        <p className="text-gray-400 text-center mt-4">
          没有账号？{" "}
          <Link href="/register" className="text-blue-400 hover:underline">
            去注册
          </Link>
        </p>
      </div>
    </div>
  );
}
