This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 ZTO Arena: Professional Sport Hub (Commercial Edition)

**Status:** Live ✅  
**Version:** 1.0.0 (ZTO Commercial Flagship)  
**Date:** 2026-02-13

## 🏆 Overview
ZTO Arena is a professional sports management module integrated into Event-OS. It features autonomous tournament management, real-time scoreboards, and broadcast-quality visual effects.

### ✨ Key Features
- **Branding:** Gold/Black Premium Aesthetics with "ZTO ARENA" dynamic header.
- **Display Engine:** `/display/sports` - Multi-court grid, Auto-Portrait Mode for Finals, Winner Reveal Celebration.
- **Referee Console:** `/admin/sports` - Mobile-first virtual court interface, Realtime score updates.
- **Core Rules:** Supports Badminton (21pts) & Pickleball scoring logic.
- **Commercial:** Sponsor Ad slots (Video/Image) & QR Code integration (ready).

## 🛠 Setup & Migration
To activate the storage and database for ZTO Arena:

1.  **Database Migration:**
    Apply the new schema to your Supabase project:
    ```bash
    npx supabase db reset # CAUTION: Resets DB
    # OR apply manually using content from: 
    # supabase/schema_sports.sql
    ```
2.  **Environment:**
    Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`.

## 📱 Routes
- **Public Display:** [http://localhost:3000/display/sports](http://localhost:3000/display/sports)
- **Admin Console:** [http://localhost:3000/admin/sports](http://localhost:3000/admin/sports)

---

# Event-OS

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
