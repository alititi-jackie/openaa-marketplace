# OpenAA 华人生活 Marketplace

美国华人综合服务平台 - 二手交易 + 招聘信息

## Features

- 🛍️ **二手交易** - Browse and post secondhand items with categories, search, and filtering
- 💼 **招聘信息** - Job postings with salary info, location, and job type filters
- 👤 **用户系统** - Email/password and Google OAuth registration and login
- 📱 **移动端优化** - Mobile-first design with bottom navigation
- 🔒 **安全** - Row Level Security via Supabase, protected routes
- 📢 **广告系统** - Banner ads with position targeting and admin management

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

## Ads System Setup

### 1. Database

Run `docs/supabase-init.sql` in your Supabase SQL Editor (the `ads` table and policies are included).

### 2. Environment Variables

Add these to `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # from Supabase Settings > API
ADMIN_TOKEN=change_me_to_a_strong_secret           # any strong secret you choose
```

The `SUPABASE_SERVICE_ROLE_KEY` is used by the admin API to bypass Row Level Security for write operations. Keep it server-side only (no `NEXT_PUBLIC_` prefix).

### 3. Admin UI

Visit `/admin/ads` and enter your `ADMIN_TOKEN` to manage ads.

- **Upload image**: select a file → saved to `public/uploads/ads/<uuid>.<ext>` → URL stored as `/uploads/ads/<filename>`
- **Set position**: `home` | `jobs` | `housing` | `marketplace`
- **Set dates**: leave blank for immediate / indefinite
- **Toggle active / delete** existing ads

### 4. Public API

```
GET /api/ads?position=home
```

Returns up to 5 active ads for the given position (filtered by date range).

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
  admin/ads/            # Ads admin UI
  api/                  # REST API endpoints
    ads/                # Public ads GET endpoint
    admin/ads/          # Admin ads CRUD (requires ADMIN_TOKEN)
    admin/upload/       # Image upload endpoint (requires ADMIN_TOKEN)
components/             # Reusable React components
lib/                    # Utility functions and Supabase client
types/                  # TypeScript type definitions
docs/                   # Documentation and SQL schema
public/uploads/ads/     # Uploaded ad images (local dev)
```
OpenAA 华人生活网站 - 二手交易 + 招聘平台
