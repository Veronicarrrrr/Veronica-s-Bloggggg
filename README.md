# 天才小钻大将军的异次元空间 🏠✨

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-green)

## 🏠 项目简介

这是一个**像素风个人博客**，融合了互动小游戏与像素小屋主题。

进入网站后，你会看到一间精心绘制的像素小屋——点击房间里的不同物件，即可开启对应功能。书架存放着博客日记，衣橱可以换装打扮，画板是访客留言板，床铺里藏着小游戏……一切都在这间温馨的小屋中展开。

## ✨ 功能特性

- 🔐 GitHub 登录 / 本地注册登录
- 📝 Markdown 渲染博客文章
- 💬 楼中楼评论系统
- 🎮 3 个像素风小游戏
- 👗 衣橱换装系统（金币购买 + 装备切换）
- 📋 访客留言板（画板）

## 🎮 小游戏

| 游戏 | 说明 |
|------|------|
| 🔢 2048 | 经典数字合并，像素风格 |
| 💎 消消乐 | 三消益智，收集宝石 |
| 🐟 大鱼吃小鱼 | 吞噬成长，称霸海洋 |

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
npx prisma migrate dev

# 3. 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可访问。

## 📁 项目结构

```
pixel-blog/
├── prisma/              # Prisma 数据库 schema
├── public/image/        # 像素风素材图片
├── src/
│   ├── app/
│   │   ├── (pages)/     # 页面路由（登录、注册、文章）
│   │   ├── api/         # API 路由（auth、posts、guestbook）
│   │   ├── page.js      # 主页（像素小屋）
│   │   └── layout.js    # 全局布局
│   ├── components/      # 组件（PixelRoom、Modal）
│   └── lib/             # 工具库（prisma、auth、getUser）
├── docs/                # 项目文档
├── .env                 # 环境变量（不提交）
└── package.json
```

## 🔧 环境变量

在项目根目录创建 `.env` 文件：

```env
# 数据库连接（SQLite）
DATABASE_URL="file:./dev.db"

# JWT 密钥
JWT_SECRET="your-jwt-secret-here"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# 编辑密码哈希（博主编辑验证）
EDIT_PASSWORD_HASH="your-bcrypt-hash"
```

## 📸 项目截图

> 像素风小屋主界面 — 点击房间物件开启对应功能

## 📚 项目文档

- [开发指南](docs/DEVELOPMENT.md) — 技术架构、API 路由、目录结构
- [交互指南](docs/GAMEPLAY.md) — 物件交互说明、游戏玩法

## 👩‍💻 作者

**Veronica** — [GitHub @Veronicarrrrr](https://github.com/Veronicarrrrr)

## 📄 License

[MIT](LICENSE)

---

> 🌙 欢迎来到异次元空间，祝你玩得开心！
