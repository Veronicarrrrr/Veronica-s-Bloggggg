import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getUser";

// 点赞 / 取消点赞
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;

    // 检查文章是否存在
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // 检查是否已点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: user.id,
        },
      },
    });

    if (existingLike) {
      // 取消点赞
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      const count = await prisma.like.count({ where: { postId: id } });
      return NextResponse.json({ message: "已取消点赞", liked: false, count });
    } else {
      // 点赞
      await prisma.like.create({
        data: {
          postId: id,
          userId: user.id,
        },
      });

      const count = await prisma.like.count({ where: { postId: id } });
      return NextResponse.json({ message: "点赞成功", liked: true, count });
    }
  } catch (error) {
    console.error("点赞错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
