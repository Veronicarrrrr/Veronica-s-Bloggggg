import { verifyToken } from "./auth";
import prisma from "./prisma";

// 从请求中获取当前登录用户
export async function getCurrentUser(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      avatar: true,
      bio: true,
    },
  });

  return user;
}
