import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getUser";

// 获取访客留言列表
export async function GET() {
  try {
    const entries = await prisma.guestbookEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("获取留言列表错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

// 发布访客留言
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "请先登录才能留言哦" },
        { status: 401 }
      );
    }

    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "留言内容不能为空" },
        { status: 400 }
      );
    }

    if (content.length > 200) {
      return NextResponse.json(
        { error: "留言不能超过200个字符" },
        { status: 400 }
      );
    }

    const entry = await prisma.guestbookEntry.create({
      data: {
        content: content.trim(),
        authorId: user.id,
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ message: "留言成功", entry });
  } catch (error) {
    console.error("发布留言错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
