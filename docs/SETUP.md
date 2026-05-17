# OpenAA · 本地开发与环境配置

## 系统要求

- Node.js 18+
- npm 9+
- [Supabase](https://supabase.com) 帐号（免费套餐即可）

## 1. 克隆与安装依赖

```bash
git clone https://github.com/alititi-jackie/openaa-ny.git
cd openaa-ny
npm install
```

## 2. 配置环境变量

复制示例文件并按说明填写：

```bash
cp .env.example .env.local
```

### 必填变量

| 变量名 | 说明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL（格式：`https://xxxx.supabase.co`） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key（仅服务端使用，**不要暴露给前端**） |
| `ADMIN_TOKEN` | 自定义管理员令牌，用于后台 API 鉴权 |
| `NEXT_PUBLIC_SITE_URL` | 站点主 URL，用于 canonical / sitemap / robots（本地填 `http://localhost:3000`） |
| `NEXT_PUBLIC_APP_URL` | 应用 URL，用于 OAuth redirect 等（本地填 `http://localhost:3000`） |

### 可选变量（Google OAuth）

Google OAuth 通过 Supabase Authentication Dashboard 配置，应用层不直接处理密钥。但如需本地调试 OAuth 流程，可在 `.env.local` 中添加：

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 变量来源（Supabase Dashboard）

1. 登录 [supabase.com](https://supabase.com)，进入你的项目
2. 点击左侧 **Settings → API**
3. 复制：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`（需展开 "Reveal" 查看）

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` 拥有完全数据库访问权限，**只用于服务端 API 路由**，绝不能暴露给浏览器端。

## 3. 初始化 Supabase 数据库

### 方式一：手动运行 SQL（推荐新手）

在 Supabase Dashboard → **SQL Editor** 中，按以下顺序运行：

```
supabase/create_ads.sql
supabase/create_housing_posts.sql
supabase/create_news_posts.sql
supabase/create_service_posts.sql
supabase/create_site_settings.sql
supabase/create_news_covers_bucket_policy.sql
supabase/update_ads_position_check.sql
```

再按时间戳顺序运行 `supabase/migrations/` 下的所有 `.sql` 文件：

```
20260509183054_create_feedback_posts.sql
20260510011500_add_contact_fields_to_posts.sql
20260510162000_add_visitor_id_to_feedback_posts.sql
20260510195000_add_pinning_fields_to_business_posts.sql
20260510220000_add_hidden_deleted_status_to_posts.sql
20260511004000_create_top_quick_links.sql
20260511020000_create_home_latest_sections.sql
20260512000000_create_navigation_tables.sql
20260512160000_create_user_navigation_links_and_settings.sql
20260513001500_create_latest_ticker_settings.sql
20260513090000_add_user_management_fields.sql
20260514211000_add_is_posting_exempt_to_users.sql
```

### 方式二：Supabase CLI

如果你已安装 Supabase CLI 并完成本地链接（`supabase link`），可运行：

```bash
supabase db push
```

详见 [Supabase CLI 文档](https://supabase.com/docs/guides/cli)。

## 4. 配置 Storage Buckets

在 Supabase Dashboard → **Storage** 中创建以下 **Public** bucket：

| Bucket 名称 | 用途 |
|---|---|
| `ads` | 广告图片（管理后台上传） |
| `news-covers` | 新闻封面图（管理后台上传） |
| `avatars` | 用户头像 |
| `post-images` | 用户发帖图片（招聘、房屋、二手、服务等） |

创建后请参照 `supabase/create_news_covers_bucket_policy.sql` 中的示例为各 bucket 添加合适的 RLS Storage Policy。

## 5. 配置 Google OAuth（可选）

1. 进入 [Google Cloud Console](https://console.cloud.google.com) 创建 OAuth 2.0 Client ID
2. Authorized redirect URIs 填写：
   ```
   https://<your-project>.supabase.co/auth/v1/callback
   ```
3. 在 Supabase Dashboard → **Authentication → Providers → Google** 中启用并填入 Client ID / Secret

## 6. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

## 7. 管理后台本地调试

管理后台路径为 `/admin`，所有后台 API 路由通过 `x-admin-token` 请求头鉴权。

本地调试时，在 `.env.local` 中设置任意字符串作为 `ADMIN_TOKEN`，然后在浏览器访问 `/admin` 时输入相同的值即可进入。

```
ADMIN_TOKEN=my-local-dev-token
```

## 8. 构建验证

```bash
npm run build
```

构建成功后可通过 `npm start` 以生产模式本地启动。
