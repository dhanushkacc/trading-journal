# Trading Journal — Web Application

A premium Next.js web application for tracking and analyzing your trades, with Supabase for data persistence and image storage.

## Features

- **All Trades** — Card-based trade list with filters (Pair, Direction, Type, Outcome, Date Range)
- **Trade Details** — Full trade analysis: stats, notes, confirmations, screenshots by timeframe
- **New / Edit Trade** — Comprehensive form with image upload (file picker + clipboard paste)
- **Scenarios** — Create inspection scenarios with multiple screenshots and bullet-point notes
- **Image Viewer** — Click any screenshot for fullscreen view with scroll-to-zoom

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (image uploads)
- **Styling**: Tailwind CSS + Custom CSS design system
- **Icons**: Lucide React

## Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase-setup.sql`
3. Go to **Storage** and verify the `screenshots` bucket exists (the SQL creates it)

### 2. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in: Supabase Dashboard → Settings → API

### 3. Install & Run

```bash
cd webapp
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to GitHub Pages / Vercel

### Option A: Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Set the **Root Directory** to `webapp`
4. Add Environment Variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy! Vercel handles everything automatically

### Option B: GitHub Pages (Static Export)

Add to `next.config.ts`:

```ts
const nextConfig = {
  output: 'export',
  basePath: '/your-repo-name',
};
```

Then build and deploy:

```bash
npm run build
# Push the `out/` folder to gh-pages branch
```

## Project Structure

```
webapp/
├── app/
│   ├── globals.css        # Premium dark theme design system
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page with tab navigation
│   └── tabs/
│       ├── AllTradesTab.tsx    # Trade list + filters
│       ├── TradeDetailTab.tsx  # Read-only trade view
│       ├── TradeFormTab.tsx    # Create/edit trade form
│       └── ScenariosTab.tsx   # Scenarios CRUD
├── components/
│   ├── ImageGallery.tsx    # Upload/view/delete images
│   ├── ImageViewer.tsx     # Fullscreen zoom overlay
│   └── Toast.tsx           # Animated notifications
├── lib/
│   ├── api.ts              # Supabase CRUD + image upload
│   ├── config.ts           # Trade configuration (pairs, etc.)
│   ├── supabase.ts         # Supabase client singleton
│   └── types.ts            # TypeScript interfaces
├── supabase-setup.sql      # Database migration script
└── .env.local.example      # Environment template
```
