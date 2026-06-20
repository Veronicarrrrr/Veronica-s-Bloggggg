import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // 检查参数
    if (!username || !password) {
      return NextResponse.json(
        { error: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 401 }
      );
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 401 }
      );
    }

    // 生成令牌
    const token = signToken(user.id);

    return NextResponse.json({
      message: "登录成功",
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error("登录错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
