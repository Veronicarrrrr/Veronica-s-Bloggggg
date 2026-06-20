import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getUser";
import { verifyEditToken } from "@/lib/auth";

// 从请求头获取编辑令牌并验证
function hasEditPermission(request) {
  const editToken = request.headers.get("x-edit-token");
  if (!editToken) return false;
  return verifyEditToken(editToken);
}

// 获取单篇文章详情
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, avatar: true, bio: true },
        },
        comments: {
          where: { parentId: null }, // only top-level
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, username: true, avatar: true } },
            replies: {
              orderBy: { createdAt: "asc" },
              include: {
                author: { select: { id: true, username: true, avatar: true } },
                replies: {
                  orderBy: { createdAt: "asc" },
                  include: {
                    author: { select: { id: true, username: true, avatar: true } },
                    replies: {
                      orderBy: { createdAt: "asc" },
                      include: {
                        author: { select: { id: true, username: true, avatar: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        likes: {
          select: { userId: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "文章不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("获取文章详情错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

// 更新文章
export async function PUT(request, { params }) {
  try {
    const isEditor = hasEditPermission(request);
    const user = await getCurrentUser(request);

    if (!user && !isEditor) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { title, content } = await request.json();

    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "文章不存在" },
        { status: 404 }
      );
    }

    // 编辑令牌可以编辑任何文章；普通用户只能编辑自己的
    if (!isEditor && existingPost.authorId !== user.id) {
      return NextResponse.json(
        { error: "只能编辑自己的文章" },
        { status: 403 }
      );
    }

    const post = await prisma.post.update({
      where: { id },
      data: { title, content },
    });

    return NextResponse.json({ message: "更新成功", post });
  } catch (error) {
    console.error("更新文章错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

// 删除文章
export async function DELETE(request, { params }) {
  try {
    const isEditor = hasEditPermission(request);
    const user = await getCurrentUser(request);

    if (!user && !isEditor) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "文章不存在" },
        { status: 404 }
      );
    }

    // 编辑令牌可以删除任何文章；普通用户只能删除自己的
    if (!isEditor && existingPost.authorId !== user.id) {
      return NextResponse.json(
        { error: "只能删除自己的文章" },
        { status: 403 }
      );
    }

    // 先删除关联的评论和点赞
    await prisma.comment.deleteMany({ where: { postId: id } });
    await prisma.like.deleteMany({ where: { postId: id } });
    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除文章错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
