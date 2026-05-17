# OpenAA · 数据库结构说明

本文档描述项目当前的主要数据表、RLS 策略、Storage buckets 及 schema 管理方式。数据库由 Supabase（PostgreSQL）托管。

---

## 主要数据表

### `users`
继承自 Supabase 内置 `auth.users`，存储扩展的用户信息。

| 列名 | 类型 | 说明 |
|---|---|---|
| `id` | UUID | 主键，引用 auth.users.id |
| `email` | TEXT | 用户邮箱 |
| `username` | TEXT | 显示名称 |
| `avatar_url` | TEXT | 头像 URL |
| `bio` | TEXT | 个人简介 |
| `phone` | TEXT | 联系电话 |
| `status` | TEXT | 账号状态（`active` / `restricted` / `banned`） |
| `admin_note` | TEXT | 管理员备注 |
| `banned_reason` | TEXT | 封禁原因 |
| `banned_at` | TIMESTAMPTZ | 封禁时间 |
| `is_posting_exempt` | BOOLEAN | 是否豁免发帖限额 |
| `created_at` | TIMESTAMPTZ | 注册时间 |
| `updated_at` | TIMESTAMPTZ | 最后更新时间 |

---

### `job_postings`
招聘信息。

| 列名 | 类型 | 说明 |
|---|---|---|
| `id` | BIGSERIAL | 自增主键 |
| `user_id` | UUID | 发帖用户，引用 users.id |
| `title` | TEXT | 职位标题 |
| `company` | TEXT | 公司名称 |
| `description` | TEXT | 职位描述 |
| `salary_min` | NUMERIC | 最低薪资（USD/年） |
| `salary_max` | NUMERIC | 最高薪资（USD/年） |
| `location` | TEXT | 工作地点 |
| `job_type` | TEXT | 工作类型（全职、兼职等） |
| `category` | TEXT | 职位分类 |
| `status` | TEXT | `published` / `unpublished` / `hidden` / `deleted` |
| `contact_*` | TEXT | 联系方式字段 |
| `is_pinned` | BOOLEAN | 是否置顶 |
| `views` | INTEGER | 浏览量 |
| `created_at` | TIMESTAMPTZ | 发布时间 |
| `updated_at` | TIMESTAMPTZ | 最后更新时间 |

---

### `housing_posts`
房屋租售信息，结构与 `job_postings` 类似，含地址、价格、房型等字段。

---

### `secondhand_items`
二手物品。

| 列名 | 类型 | 说明 |
|---|---|---|
| `id` | BIGSERIAL | 自增主键 |
| `user_id` | UUID | 发帖用户 |
| `title` | TEXT | 商品标题 |
| `description` | TEXT | 商品描述 |
| `price` | NUMERIC(10,2) | 价格（USD） |
| `category` | TEXT | 分类 |
| `images` | TEXT[] | 图片 URL 数组 |
| `status` | TEXT | `published` / `unpublished` / `hidden` / `deleted` |
| `is_pinned` | BOOLEAN | 是否置顶 |
| `views` | INTEGER | 浏览量 |
| `created_at` | TIMESTAMPTZ | 发布时间 |
| `updated_at` | TIMESTAMPTZ | 最后更新时间 |

---

### `service_posts`
本地服务信息，结构与二手/招聘帖子类似，含服务类型、地点、联系方式等字段。

---

### `news_posts`
新闻资讯，由管理员发布。

| 列名 | 类型 | 说明 |
|---|---|---|
| `id` | UUID | 主键 |
| `title` | TEXT | 标题 |
| `slug` | TEXT | URL 标识符，唯一 |
| `category` | TEXT | 分类（新手指南 / 平台公告 / 本地新闻 / DMV教程 / 生活指南） |
| `summary` | TEXT | 摘要 |
| `cover_image_url` | TEXT | 封面图 URL |
| `content` | TEXT | 正文（Markdown） |
| `seo_title` | TEXT | SEO 标题 |
| `seo_description` | TEXT | SEO 描述 |
| `is_published` | BOOLEAN | 是否已发布 |
| `published_at` | TIMESTAMPTZ | 发布时间 |
| `created_at` | TIMESTAMPTZ | 创建时间 |
| `updated_at` | TIMESTAMPTZ | 最后更新时间 |

---

### `ads`
广告系统。

| 列名 | 类型 | 说明 |
|---|---|---|
| `id` | UUID | 主键 |
| `image_url` | TEXT | 广告图片 URL |
| `link_type` | TEXT | `external`（外链）或 `internal`（站内） |
| `external_url` | TEXT | 外链地址 |
| `slug` | TEXT | 站内页面 slug（内链广告时使用） |
| `content` | TEXT | 内链广告内容 |
| `position` | TEXT | 投放位置（`home` / `jobs` / `housing` / `secondhand` / `services` / `news` / `navigation` / `dmv` 等） |
| `open_mode` | TEXT | 打开方式（`internal` / `external_new` / `external_same`） |
| `start_date` | TIMESTAMPTZ | 生效起始时间 |
| `end_date` | TIMESTAMPTZ | 生效结束时间 |
| `is_active` | BOOLEAN | 是否激活 |
| `created_at` | TIMESTAMPTZ | 创建时间 |

---

### `feedback_posts`
用户反馈与举报。

| 列名 | 类型 | 说明 |
|---|---|---|
| `id` | UUID | 主键 |
| `user_id` | UUID | 提交用户（可为空，支持匿名） |
| `type` | TEXT | 反馈类型 |
| `contact` | TEXT | 联系方式（可选） |
| `related_url` | TEXT | 相关页面 URL |
| `content` | TEXT | 反馈内容 |
| `status` | TEXT | `pending` / `processing` / `resolved` / `ignored` |
| `admin_note` | TEXT | 管理员备注 |
| `visitor_id` | TEXT | 访客标识（匿名追踪） |
| `created_at` | TIMESTAMPTZ | 提交时间 |
| `updated_at` | TIMESTAMPTZ | 最后更新时间 |

---

### `top_quick_links`
顶部快捷导航链接，由管理后台配置。

| 列名 | 类型 | 说明 |
|---|---|---|
| `id` | UUID | 主键 |
| `title` | TEXT | 显示文本 |
| `url` | TEXT | 链接地址 |
| `sort_order` | INTEGER | 排序 |
| `is_active` | BOOLEAN | 是否启用 |
| `open_mode` | TEXT | `same`（当前页）或 `new`（新窗口） |

---

### `navigation_categories` / `navigation_links`
公共导航系统（`/navigation`）。

- **`navigation_categories`**：导航分类（如"热门推荐"、"政府服务"、"银行金融"等）
- **`navigation_links`**：各分类下的具体链接，含标题、URL、描述、排序、打开方式

---

### `user_navigation_links` / `user_settings`
用户自定义导航（`/navigation/my`）。

- **`user_navigation_links`**：用户自建导航书签，受 RLS 保护，只能读写自己的数据
- **`user_settings`**：用户偏好设置，如默认展示公共导航还是我的导航（`navigation_default`）

---

### `home_latest_sections`
首页各版块展示配置（显示/隐藏、排序、条数等）。

| `section_key` | 说明 |
|---|---|
| `latest_jobs` | 最新招聘 |
| `latest_housing` | 最新房屋 |
| `latest_secondhand` | 最新二手 |
| `latest_services` | 本地服务 |
| `latest_news` | 最新新闻（含子分类） |

---

### `latest_ticker_global_settings` / `latest_ticker_sections`
首页顶部滚动条（latest ticker）配置，控制各板块的启用状态、展示条数与轮播间隔。

---

### `site_settings`
键值对形式的站点设置，当前包含 `daily_post_limit`（每日发帖限额）等配置项，由管理后台读写。

---

## DMV 题库（非数据库表）

DMV 题库数据来自本地 JSON 文件：

```
data/openaa-ny-dmv-questions-v1.json
```

共 **150 题**，包含标志题专项。题库不依赖数据库，直接由 Next.js 服务端读取。

---

## Row Level Security（RLS）策略概览

| 表 | 公开读 | 用户写 | 管理员写 |
|---|---|---|---|
| `users` | 否 | 自身记录 | service role |
| `job_postings` | 已发布可读 | 本人帖子 | service role / admin |
| `housing_posts` | 已发布可读 | 本人帖子 | service role / admin |
| `secondhand_items` | 已发布可读 | 本人帖子 | service role / admin |
| `service_posts` | 已发布可读 | 本人帖子 | service role / admin |
| `news_posts` | 已发布可读 | 否 | service role |
| `ads` | 全部可读 | 否 | service role |
| `feedback_posts` | 否（自身可读） | 任何人可提交 | service role |
| `top_quick_links` | 全部可读 | 否 | service role |
| `navigation_categories` | 全部可读 | 否 | service role |
| `navigation_links` | 全部可读 | 否 | service role |
| `user_navigation_links` | 仅本人 | 本人 | service role |
| `user_settings` | 仅本人 | 本人 | — |
| `home_latest_sections` | 全部可读 | 否 | service role |
| `latest_ticker_*` | 全部可读 | 否 | service role |
| `site_settings` | 否（仅服务端） | 否 | service role |

**Service role** 指使用 `SUPABASE_SERVICE_ROLE_KEY` 初始化的 Supabase 客户端，在所有管理员 API 路由中使用，可绕过 RLS。

---

## 管理员与普通用户权限边界

- 普通用户通过 Supabase Auth JWT（Bearer token）访问用户级 API，只能操作自己的数据。
- 管理员通过 `x-admin-token` 请求头（值等于 `ADMIN_TOKEN` 环境变量）访问后台 API，服务端使用 service role key 执行数据库操作，可读写所有数据。
- 后台页面（`/admin/*`）不受 Supabase RLS 约束，由 API 层的 `ADMIN_TOKEN` 验证保护。

---

## Storage Buckets

| Bucket | 用途 | 访问类型 |
|---|---|---|
| `ads` | 广告图片 | Public |
| `news-covers` | 新闻封面图 | Public |
| `avatars` | 用户头像 | Public |
| `post-images` | 用户发帖图片 | Public |

图片上传（广告、新闻封面等）由管理后台 API 路由通过 service role key 执行，普通用户通过客户端直传 Supabase Storage（受 RLS Storage Policy 保护）。

---

## Schema 初始化与 Migration

- 新项目：依次在 Supabase SQL Editor 执行 `supabase/*.sql` 和 `supabase/migrations/*.sql`（按文件名时间戳顺序）。
- 已有项目更新：执行 `supabase/migrations/` 下新增的 migration 文件即可。
- 使用 Supabase CLI 时可运行 `supabase db push` 自动应用 migrations。

详见 [docs/SETUP.md](SETUP.md)。
