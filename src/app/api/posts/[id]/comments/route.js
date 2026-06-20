import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getUser";

// 发表评论
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const { content, parentId } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 });
    }

    // 检查文章是否存在
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId: id,
        authorId: user.id,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ message: "评论成功", comment });
  } catch (error) {
    console.error("评论错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// 删除评论
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "缺少评论ID" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    }

    if (comment.authorId !== user.id) {
      return NextResponse.json({ error: "只能删除自己的评论" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除评论错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
