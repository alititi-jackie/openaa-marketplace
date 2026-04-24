# OpenAA 华人生活 Marketplace

美国华人综合服务平台 - 二手交易 + 招聘信息

## Features

- 🛍️ **二手交易** - Browse and post secondhand items with categories, search, and filtering
- 💼 **招聘信息** - Job postings with salary info, location, and job type filters
- 👤 **用户系统** - Email/password and Google OAuth registration and login
- 📱 **移动端优化** - Mobile-first design with bottom navigation
- 🔒 **安全** - Row Level Security via Supabase, protected routes
- 📢 **广告系统** - Position-based banner ads with date range, admin management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth + Database + Storage)
- **Deployment**: Vercel

## Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local
npm run dev
```

See [docs/SETUP.md](docs/SETUP.md) for full setup instructions.

## Ads Feature

### Setup
1. Run `supabase/create_ads.sql` in your Supabase SQL Editor to create the `ads` table, index, and RLS policy.
2. Create a public Storage bucket named **`ads`** in Supabase → Storage.
3. Add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ADMIN_TOKEN=your-secret-admin-token
   ```

### Admin UI
Visit `/admin/ads` — enter your `ADMIN_TOKEN` to upload ads, toggle active/inactive, and delete.

### API
- `GET /api/ads?position=home` — public, returns up to 5 active ads within date range.
- `GET /api/admin/ads` — admin list (requires `x-admin-token` header).
- `POST /api/admin/ads` — admin create (multipart/form-data: `image`, `link_url`, `position`, `is_active`, `start_date`, `end_date`).
- `PATCH /api/admin/ads/:id` — admin update (e.g. `{ "is_active": false }`).
- `DELETE /api/admin/ads/:id` — admin delete.

## Documentation

- [Setup Guide](docs/SETUP.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Database Schema](docs/DATABASE.md)
- [API Reference](docs/API.md)

## Project Structure

```
app/                    # Next.js App Router pages and API routes
  auth/                 # Login, signup, OAuth callback
  secondhand/           # Secondhand marketplace pages
  jobs/                 # Job listings pages
  profile/              # User profile pages
  api/                  # REST API endpoints
components/             # Reusable React components
lib/                    # Utility functions and Supabase client
types/                  # TypeScript type definitions
docs/                   # Documentation and SQL schema
```
OpenAA 华人生活网站 - 二手交易 + 招聘平台
