# OpenAA Marketplace - Setup Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

## 1. Clone and Install

```bash
git clone https://github.com/your-org/openaa-marketplace.git
cd openaa-marketplace
npm install
```

## 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Initialize Database

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the contents of `docs/supabase-init.sql`

## 4. Configure Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. In Supabase: **Authentication > Providers > Google**, enable and add credentials

## 5. Set Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
