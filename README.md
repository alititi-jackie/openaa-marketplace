# OpenAA 华人生活 Marketplace

美国华人综合服务平台 - 二手交易 + 招聘信息

## Features

- 🛍️ **二手交易** - Browse and post secondhand items with categories, search, and filtering
- 💼 **招聘信息** - Job postings with salary info, location, and job type filters
- 👤 **用户系统** - Email/password and Google OAuth registration and login
- 📱 **移动端优化** - Mobile-first design with bottom navigation
- 🔒 **安全** - Row Level Security via Supabase, protected routes

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
