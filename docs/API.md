# OpenAA · API 参考

本文档为代表性接口总览，并非穷举全部路由。接口按鉴权方式与功能类别组织。

---

## 鉴权方式

### 用户接口
需要 Supabase 用户 Token：

```
Authorization: Bearer <supabase_access_token>
```

Token 来自 `supabase.auth.getSession()` 返回的 `session.access_token`。

### 管理员接口
需要 Admin Token：

```
x-admin-token: <ADMIN_TOKEN>
```

`ADMIN_TOKEN` 为服务端环境变量，由部署者自定义设置。后台 API 路由在服务端验证此 Header，验证通过后使用 `SUPABASE_SERVICE_ROLE_KEY` 执行数据库操作。

---

## 响应格式与常见错误

**成功响应示例：**
```json
{ "data": [...] }
```
或直接返回数组/对象。

**常见错误：**

| HTTP 状态码 | 说明 |
|---|---|
| `400` | 请求参数错误 |
| `401` | 未提供或无效的鉴权信息 |
| `403` | 权限不足 |
| `404` | 资源不存在 |
| `500` | 服务端内部错误 |

---

## 公开 API（无需鉴权）

### 广告

#### `GET /api/ads`
获取当前有效广告。

**Query 参数：**
- `position`（必填）：广告位置，可选值：`home` / `jobs` / `housing` / `secondhand` / `services` / `news` / `navigation` / `dmv`

**示例：**
```
GET /api/ads?position=home
```

---

### 顶部快捷导航

#### `GET /api/top-links`
获取所有已启用的顶部快捷导航链接（按排序返回）。使用 service role 读取，不受 RLS 限制。

---

### Latest Ticker（滚动条）

#### `GET /api/latest-ticker`
获取首页顶部动态滚动条数据，包含各板块最新内容摘要与全局/板块启用设置。

---

### 内容查询（公开帖子）

各板块公开内容通过以下路径查询（均返回已发布内容）：

- `GET /api/jobs` — 招聘列表，支持 `category`、`job_type`、`page`、`pageSize` 参数
- `GET /api/jobs/[id]` — 单个招聘帖详情
- `GET /api/housing` — 房屋列表
- `GET /api/housing/[id]` — 单个房屋帖详情
- `GET /api/secondhand` — 二手列表，支持 `category`、`page`、`pageSize` 参数
- `GET /api/secondhand/[id]` — 单个二手帖详情
- `GET /api/services` — 本地服务列表
- `GET /api/services/[id]` — 单个服务帖详情
- `GET /api/news` — 新闻列表，支持 `category` 参数
- `GET /api/news/[slug]` — 单篇新闻详情（按 slug 查询）

---

### 导航

- `GET /api/navigation` — 公共导航分类与链接列表（已激活）
- `GET /api/search` — 全站搜索（跨板块）

---

## 用户 API（需要 Bearer Token）

### 用户资料

#### `GET /api/user/profile`
获取当前用户个人资料。

#### `PUT /api/user/profile`
更新个人资料。

**Body：**
```json
{
  "username": "新用户名",
  "bio": "个人简介",
  "phone": "123-456-7890"
}
```

---

### 我的导航

- `GET /api/user/navigation` — 获取当前用户自定义导航链接
- `POST /api/user/navigation` — 新增自定义链接
- `PATCH /api/user/navigation/[id]` — 更新链接
- `DELETE /api/user/navigation/[id]` — 删除链接

---

### 发帖（需登录）

各板块发帖路由（multipart/form-data 或 JSON，含图片时使用 multipart）：

- `POST /api/jobs` — 发布招聘
- `PUT /api/jobs/[id]` — 更新自己的招聘帖
- `DELETE /api/jobs/[id]` — 删除自己的招聘帖

同理适用于 `housing`、`secondhand`、`services`。

---

### 反馈提交

#### `POST /api/feedback`
提交反馈或举报（登录用户和匿名用户均可提交）。

**Body：**
```json
{
  "type": "反馈类型",
  "content": "内容",
  "contact": "联系方式（可选）",
  "related_url": "相关页面（可选）"
}
```

---

## 后台 API（需要 x-admin-token）

所有 `/api/admin/*` 路由均需要：

```
x-admin-token: <ADMIN_TOKEN>
```

### 广告管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/ads` | 列出所有广告 |
| `POST` | `/api/admin/ads` | 新建广告（multipart/form-data：`image`、`link_url`、`position`、`is_active`、`start_date`、`end_date` 等） |
| `PATCH` | `/api/admin/ads/[id]` | 更新广告（如切换 `is_active`） |
| `DELETE` | `/api/admin/ads/[id]` | 删除广告及其图片 |

---

### 新闻管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/news` | 列出所有新闻（含未发布） |
| `POST` | `/api/admin/news` | 新建新闻（含封面图上传） |
| `PATCH` | `/api/admin/news/[id]` | 更新新闻内容 |
| `DELETE` | `/api/admin/news/[id]` | 删除新闻及封面图 |

---

### 反馈管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/feedback` | 列出所有反馈 |
| `PATCH` | `/api/admin/feedback/[id]` | 更新反馈状态（`pending` / `processing` / `resolved` / `ignored`）与管理员备注 |

---

### 用户管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/users` | 列出所有用户 |
| `PATCH` | `/api/admin/users/[id]` | 更新用户状态（`active` / `restricted` / `banned`）、备注等 |

---

### 帖子管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/posts` | 列出所有帖子（跨板块） |
| `PATCH` | `/api/admin/posts/[id]` | 更新帖子状态（置顶、隐藏、删除等） |

---

### 导航管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/navigation` | 获取导航分类与链接 |
| `POST` | `/api/admin/navigation` | 新建分类或链接 |
| `PATCH` | `/api/admin/navigation/[id]` | 更新分类或链接 |
| `DELETE` | `/api/admin/navigation/[id]` | 删除分类或链接 |

---

### 顶部快捷导航管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/top-links` | 获取所有顶部快捷链接 |
| `POST` | `/api/admin/top-links` | 新建链接 |
| `PATCH` | `/api/admin/top-links/[id]` | 更新链接 |
| `DELETE` | `/api/admin/top-links/[id]` | 删除链接 |

---

### 首页板块配置

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/home-sections` | 获取首页各板块配置 |
| `PATCH` | `/api/admin/home-sections/[id]` | 更新板块可见性、排序、展示条数 |

---

### 服务管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/services` | 列出本地服务帖子 |
| `PATCH` | `/api/admin/services/[id]` | 更新服务状态 |

---

### 站点设置

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/settings` | 读取站点设置（如每日发帖限额） |
| `POST` | `/api/admin/settings` | 更新站点设置 |

---

### 图片清理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/image-cleanup` | 扫描 Storage 中无引用的孤立图片 |
| `DELETE` | `/api/admin/image-cleanup` | 删除指定孤立图片 |
