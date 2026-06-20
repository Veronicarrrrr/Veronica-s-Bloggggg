# 🔧 开发指南

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16 | 全栈框架（App Router） |
| React | 19 | UI 库 |
| Prisma | 6 | ORM 数据库操作 |
| SQLite | - | 本地数据库 |
| Tailwind CSS | 4 | 原子化 CSS 样式 |
| bcryptjs | 3 | 密码加密 |
| jsonwebtoken | 9 | JWT 认证 |

## 架构概览

```
┌─────────────────────────────────────────────┐
│                  前端 (React 19)              │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │PixelRoom│  │  Modal   │  │  Pages    │  │
│  │ (主场景) │  │ (弹窗组件)│  │(文章/登录) │  │
│  └─────────┘  └──────────┘  └───────────┘  │
├─────────────────────────────────────────────┤
│              API Routes (Next.js)            │
│  /api/auth/*  /api/posts/*  /api/guestbook  │
├─────────────────────────────────────────────┤
│              Prisma ORM + SQLite             │
│  User | Post | Comment | Like | Guestbook   │
└─────────────────────────────────────────────┘
```

## 目录结构详解

```
src/
├── app/
│   ├── page.js              # 主页：像素小屋 + 所有弹窗交互
│   ├── layout.js            # 全局布局（字体、meta）
│   ├── globals.css          # 全局样式 + 动画
│   ├── (pages)/
│   │   ├── login/page.js    # 登录页
│   │   ├── register/page.js # 注册页
│   │   └── posts/
│   │       ├── page.js      # 文章列表
│   │       ├── new/page.js  # 新建文章
│   │       └── [id]/
│   │           ├── page.js  # 文章详情
│   │           └── edit/page.js  # 编辑文章
│   └── api/
│       ├── auth/
│       │   ├── login/route.js       # POST 登录
│       │   ├── register/route.js    # POST 注册
│       │   ├── me/route.js          # GET 当前用户
│       │   └── edit-verify/route.js # POST 编辑权限验证
│       ├── posts/
│       │   ├── route.js             # GET 列表 / POST 新建
│       │   └── [id]/
│       │       ├── route.js         # GET/PUT/DELETE 文章
│       │       ├── comments/route.js # GET/POST 评论
│       │       └── likes/route.js    # POST 点赞/取消
│       └── guestbook/
│           └── route.js             # GET/POST 留言板
├── components/
│   ├── PixelRoom.js         # 像素小屋热区组件
│   └── Modal.js             # 通用弹窗组件
└── lib/
    ├── prisma.js            # Prisma 客户端单例
    ├── auth.js              # JWT 工具函数
    └── getUser.js           # 从请求获取用户信息
```

## API 路由总结

### 认证相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册（username + password） |
| POST | `/api/auth/login` | 用户登录，返回 JWT |
| GET | `/api/auth/me` | 获取当前登录用户信息 |
| POST | `/api/auth/edit-verify` | 验证编辑密码，获取编辑权限 |

### 文章相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/posts` | 获取文章列表（含评论/点赞计数） |
| POST | `/api/posts` | 新建文章（需认证） |
| GET | `/api/posts/[id]` | 获取文章详情 |
| PUT | `/api/posts/[id]` | 更新文章（需编辑权限） |
| DELETE | `/api/posts/[id]` | 删除文章（需编辑权限） |
| GET | `/api/posts/[id]/comments` | 获取文章评论 |
| POST | `/api/posts/[id]/comments` | 发表评论（需认证） |
| POST | `/api/posts/[id]/likes` | 点赞/取消点赞（需认证） |

### 留言板

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/guestbook` | 获取留言列表 |
| POST | `/api/guestbook` | 发布留言（需认证） |

## 如何添加新游戏

### 步骤 1：创建游戏组件

在 `src/components/games/` 目录下创建游戏组件：

```jsx
// src/components/games/MyNewGame.js
"use client";
import { useState } from "react";

export default function MyNewGame({ onClose }) {
  const [score, setScore] = useState(0);

  return (
    <div className="p-4">
      <h2 className="text-white font-bold mb-4">🎮 我的新游戏</h2>
      {/* 游戏内容 */}
      <p className="text-purple-200">得分: {score}</p>
      <button onClick={onClose} className="mt-4 px-4 py-2 bg-purple-600 rounded-lg text-white">
        返回
      </button>
    </div>
  );
}
```

### 步骤 2：注册到床铺/游戏入口

在 `src/app/page.js` 中的床铺 Modal 里添加游戏入口按钮。

### 步骤 3：添加游戏状态

在主页组件中添加对应的 state 控制游戏显示/隐藏。

### 设计建议

- 保持像素风格美术方向
- 使用紫色系配色（与主题统一）
- 游戏尺寸适配弹窗大小
- 提供「返回小屋」按钮

## 数据库操作

### 修改数据模型

1. 编辑 `prisma/schema.prisma`
2. 运行迁移：

```bash
npx prisma migrate dev --name your_migration_name
```

3. Prisma Client 会自动重新生成

### 查看数据库

```bash
npx prisma studio
```

## 开发注意事项

- 环境变量：复制 `.env.example` 为 `.env` 并填写实际值
- 数据库文件 `*.db` 已在 `.gitignore` 中忽略
- 像素风图片建议使用 `image-rendering: pixelated` CSS 属性
- 组件内使用 `"use client"` 指令标记客户端组件
- API 路由通过 `src/lib/auth.js` 验证 JWT token
