# OpenAA · 部署指南

本项目使用 **Vercel** 部署，**Supabase** 作为后端服务。

---

## 1. Vercel 部署

### 方式一：GitHub 集成（推荐）

1. 将代码推送到 GitHub 仓库
2. 登录 [vercel.com](https://vercel.com)，点击 **Add New Project**，导入仓库
3. Framework 选择 **Next.js**（Vercel 会自动检测）
4. 在 **Environment Variables** 中添加以下变量（见下方列表）
5. 点击 **Deploy**

### 方式二：Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 2. 必填环境变量

在 Vercel Project → **Settings → Environment Variables** 中配置：

| 变量名 | 说明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key（仅服务端，**不要**设为 Public） |
| `ADMIN_TOKEN` | 自定义管理员令牌，后台 API 鉴权用 |
| `NEXT_PUBLIC_SITE_URL` | 生产站点主 URL，如 `https://ny.openaa.com`（用于 canonical / sitemap / robots） |
| `NEXT_PUBLIC_APP_URL` | 应用 URL（可与 `NEXT_PUBLIC_SITE_URL` 相同），用于 OAuth redirect 等 |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` 和 `ADMIN_TOKEN` 为机密变量，在 Vercel 中设置时请取消勾选 "Expose to Browser"。

---

## 3. Supabase 生产配置

### Site URL 与 Redirect URL

在 Supabase Dashboard → **Authentication → URL Configuration** 中设置：

- **Site URL**：`https://ny.openaa.com`（或你的实际域名）
- **Redirect URLs**（允许的 OAuth 回调地址）：
  ```
  https://ny.openaa.com/auth/callback
  https://ny.openaa.com/**
  ```

如需同时支持预览部署，可在 Redirect URLs 追加 Vercel 预览域名格式：
```
https://*.vercel.app/auth/callback
```

### Google OAuth 生产配置

在 Google Cloud Console → OAuth 2.0 Client → **Authorized redirect URIs** 中添加：
```
https://<your-project>.supabase.co/auth/v1/callback
```

---

## 4. 自定义域名

1. 在 Vercel Project → **Settings → Domains** 中绑定自定义域名
2. 同步更新 `NEXT_PUBLIC_SITE_URL` 和 `NEXT_PUBLIC_APP_URL` 为自定义域名
3. 更新 Supabase Site URL 与 Redirect URLs

**注意：** `NEXT_PUBLIC_SITE_URL` 控制以下内容，域名变更后须同步更新并重新部署：
- `<link rel="canonical" ...>` 标签
- `sitemap.xml` 中的 URL
- `robots.txt` 中的 sitemap 地址
- JSON-LD structured data 中的 `url` 字段

---

## 5. 构建命令

Vercel 默认检测 Next.js 并使用：

```
Build Command:  next build
Output Dir:     .next
Install Command: npm install
```

本地构建验证：

```bash
npm run build
npm start
```

构建成功即表示代码无 TypeScript 错误、ESLint 错误。

---

## 6. SEO / robots / sitemap 部署后检查

| 检查项 | URL |
|---|---|
| robots.txt | `https://your-domain.com/robots.txt` |
| sitemap.xml | `https://your-domain.com/sitemap.xml` |
| 首页 canonical | 查看页面源码中 `<link rel="canonical">` |
| JSON-LD structured data | 查看页面源码或 Google Rich Results Test |

**noindex 页面说明：**

以下路径已在 `robots.txt` 中列为 `Disallow`，搜索引擎不会抓取：

- `/admin` / `/admin/*`
- `/api` / `/api/*`
- `/auth` / `/auth/*`
- `/profile` / `/profile/*`
- `/jobs/publish`、`/housing/publish`、`/secondhand/publish`、`/services/publish`
- `/navigation/my`

---

## 7. 部署后验证清单

- [ ] 访问首页，确认内容正常加载
- [ ] 访问 `/robots.txt`，确认格式正确且 sitemap 地址指向实际域名
- [ ] 访问 `/sitemap.xml`，确认包含主要页面 URL
- [ ] 访问 `/admin`，使用 `ADMIN_TOKEN` 登录后台
- [ ] 测试广告接口：`/api/ads?position=home`
- [ ] 测试用户注册 / Google OAuth 登录
- [ ] 查看 Supabase Dashboard → Authentication → Users，确认用户数据同步
