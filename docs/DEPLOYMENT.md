# OpenAA Marketplace - Deployment Guide

## Deploy to Vercel (Recommended)

### Option 1: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel deployment URL)

### Configure Supabase for Production

1. In Supabase **Authentication > URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

2. Update Google OAuth redirect URI if using Google login

## Build Locally

```bash
npm run build
npm start
```

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL for OAuth redirects |

> **Note:** Google OAuth is configured directly in the Supabase Dashboard under
> Authentication > Providers > Google. No additional environment variables are needed
> in this app for Google login.
