# OpenAA 华人生活 Marketplace

美国华人综合服务平台 - 二手交易 + 招聘信息

## Features

- 🛍️ **二手交易** - Browse and post secondhand items with categories, search, and filtering
- 💼 **招聘信息** - Job postings with salary info, location, and job type filters
- 👤 **用户系统** - Email/password and Google OAuth registration and login
- 📱 **移动端优化** - Mobile-first design with bottom navigation
- 🔒 **安全** - Row Level Security via Supabase, protected routes
- 📢 **广告系统** - Banner ads on home/jobs/secondhand pages, managed via admin panel

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

## Ads Feature Setup

1. **Database** – Run `supabase/ads.sql` in your Supabase SQL Editor to create the `ads` table, index, RLS policies, and the `ads` storage bucket.

2. **Environment variables** – Add these to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # from Supabase Settings > API
   ADMIN_TOKEN=your_strong_random_token              # any secret string you choose
   ```

3. **Storage bucket** – The SQL script creates the `ads` bucket automatically. If you need to create it manually, go to Supabase Storage → New bucket → name `ads` → check **Public**.

4. **Admin panel** – Visit `/admin/ads` in your browser, enter your `ADMIN_TOKEN`, and you can upload ad images, set links, choose positions (home / jobs / secondhand), and toggle active status.

5. **Fallback** – If no active ads exist for the `home` position the `BannerCarousel` automatically falls back to the built-in gradient slides.

## Documentation

- [Setup Guide](docs/SETUP.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Database Schema](docs/DATABASE.md)
- [API Reference](docs/API.md)

## Project Structure

```
app/                    # Next.js App Router pages and API routes
  admin/ads/            # Admin panel for managing ads
  auth/                 # Login, signup, OAuth callback
  secondhand/           # Secondhand marketplace pages
  jobs/                 # Job listings pages
  profile/              # User profile pages
  api/
    ads/                # GET /api/ads?position=home|jobs|secondhand
    admin/ads/          # POST/GET (admin), PATCH/DELETE by id, upload
components/             # Reusable React components
lib/                    # Utility functions and Supabase client
types/                  # TypeScript type definitions
docs/                   # Documentation and SQL schema
supabase/               # SQL migrations/scripts
```
OpenAA 华人生活网站 - 二手交易 + 招聘平台
