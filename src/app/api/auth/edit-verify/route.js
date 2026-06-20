import { NextResponse } from "next/server";
import { verifyPassword, signEditToken } from "@/lib/auth";

// 验证编辑密码，签发编辑令牌
export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "请输入密码" },
        { status: 400 }
      );
    }

    const hash = process.env.EDIT_PASSWORD_HASH;
    if (!hash) {
      return NextResponse.json(
        { error: "服务器配置错误" },
        { status: 500 }
      );
    }

    const isValid = await verifyPassword(password, hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "密码错误" },
        { status: 403 }
      );
    }

    const editToken = signEditToken();
    return NextResponse.json({ editToken });
  } catch (error) {
    console.error("验证编辑密码错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
