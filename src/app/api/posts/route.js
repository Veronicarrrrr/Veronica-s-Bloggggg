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

// 获取文章列表
export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("获取文章列表错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

// 创建文章
export async function POST(request) {
  try {
    const isEditor = hasEditPermission(request);
    const user = await getCurrentUser(request);

    if (!user && !isEditor) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "标题和内容不能为空" },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: "标题不能超过100个字符" },
        { status: 400 }
      );
    }

    // 编辑令牌创建文章时，使用第一个用户作为作者（博主）；或 user 自身
    let authorId;
    if (user) {
      authorId = user.id;
    } else if (isEditor) {
      // 查找博主账号（第一个创建的用户）
      const owner = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
      if (!owner) {
        return NextResponse.json(
          { error: "需要至少一个用户账号" },
          { status: 400 }
        );
      }
      authorId = owner.id;
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId,
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ message: "发布成功", post });
  } catch (error) {
    console.error("创建文章错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
