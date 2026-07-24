# 同频播放

一个偏赛博朋克风格的双人音乐合拍测试 H5。两位参与者在同一音乐频道完成 16 道题，系统根据答案、六维音乐侧写和可选 MBTI 生成双人匹配报告。

## 功能

- 华语、欧美、KPOP、二次元四个音乐频道
- 每个频道 16 道题、每题 6 个选项
- 单人音乐侧写与个人称号
- 双人房间、24 小时邀请有效期和等待状态
- 双人匹配算法与完整结果页
- 邀请二维码海报和结果分享海报
- 横屏手机体验及频道差异化视觉

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Neon Serverless Postgres
- Vercel

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

在 `.env.local` 中填写 Neon 提供的池化连接地址：

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
WECHAT_APP_ID=wx_your_official_account_app_id
WECHAT_APP_SECRET=your_official_account_app_secret
```

微信环境变量为可选配置。未配置时，微信内仍可通过长按海报保存，并使用右上角菜单分享当前页面；配置后会使用微信 JS-SDK 设置好友分享卡片。公众号后台的“JS 接口安全域名”必须包含当前生产域名，且页面必须通过 HTTPS 访问。

首次调用房间 API 时会自动创建数据库表。也可以在 Neon SQL Editor 中执行 [`db/schema.sql`](db/schema.sql)。

## 部署到 Vercel

1. 在 Neon 创建数据库，区域建议选择新加坡。
2. 在 Vercel 导入此 GitHub 仓库。
3. 在 Vercel 项目环境变量中添加 `DATABASE_URL`；如需微信好友分享卡片，同时添加 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`。
4. 重新部署项目。

## 数据规则

- 房间码为 8 位，不使用容易混淆的字符。
- 房间邀请 24 小时有效。
- 创建新房间时会顺带清理已经过期超过 24 小时的旧记录。
- 等待页采用 5～15 秒自适应轮询，并在页面进入后台时降低查询频率。

## 命令

```bash
npm run dev
npm run build
npm run test
npm run lint
```
