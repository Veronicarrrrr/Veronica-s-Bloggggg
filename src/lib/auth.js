import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "pixel-blog-secret-key-2024";

// 加密密码
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// 验证密码
export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// 生成登录令牌
export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

// 验证登录令牌
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// 生成编辑令牌（密码验证通过后签发）
export function signEditToken() {
  return jwt.sign({ role: "editor" }, JWT_SECRET, { expiresIn: "24h" });
}

// 验证编辑令牌
export function verifyEditToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload && payload.role === "editor";
  } catch {
    return false;
  }
}
