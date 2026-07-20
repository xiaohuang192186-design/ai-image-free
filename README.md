# 🎨 AI Free Image Generator

> **AI image generator — Z-Image-Turbo + Vercel + Cloudflare R2**

Turn words into stunning images for free. No sign-up, no limits, no content filtering.

## ⚡ Quick Start

```bash
git clone <your-repo-url>
cd ai-imagefree
cp .env.example .env.local
# Fill in .env.local with your keys (see below)
npm install
npm run dev
```

Open http://localhost:3000 and start generating.

## 🔑 Getting Your API Keys

### HuggingFace (AI Model)
1. Sign up: https://huggingface.co/join
2. Go to Settings → Access Tokens
3. Create token with **Read** permission
4. Copy to `HF_TOKEN` in `.env.local`

### Cloudflare R2 (Image Storage)
1. Sign up: https://dash.cloudflare.com/sign-up
2. Go to R2 → Create Bucket (name it anything)
3. Enable **Public Access** via r2.dev subdomain
4. Go to R2 → Manage API Tokens → Create API Token
   - Permission: **Object Read & Write**
   - Select your bucket
5. Copy credentials:
   - `R2_ACCESS_KEY_ID` — from token details
   - `R2_SECRET_ACCESS_KEY` — from token details
   - `R2_ENDPOINT` — `https://<accountid>.r2.cloudflarestorage.com`
   - `R2_PUBLIC_URL` — `https://pub-<hash>.r2.dev` (from bucket settings)

## 🚀 Deploy to Vercel (1 click)

1. Push to GitHub
2. Go to https://vercel.com/import
3. Import your repo
4. Add all environment variables (same as `.env.local`)
5. Deploy

**Live at**: `https://ai-image-free.vercel.app`

## 💰 Monetization (Optional)

Add Google AdSense:
1. Sign up: https://adsense.google.com
2. Get your publisher ID (`ca-pub-XXXXXXXXXX`)
3. Set `NEXT_PUBLIC_ADSENSE_ID` in env
4. Uncomment the AdSense script in `src/app/layout.tsx`
5. Replace the placeholder banner in `src/app/page.tsx`

## 📊 Cost Breakdown

| Service | Monthly Free Tier | Notes |
|---------|------------------|-------|
| Vercel | 100 GB bandwidth, 1M function calls | ✅ Free |
| Cloudflare R2 | 10 GB storage, 10M reads | ✅ Free |
| **HF Router + fal-ai** | **Free tier + pay-per-use** | ⚠️ Check `huggingface.co/settings/billing` |

> ⚠️ Z-Image-Turbo is NOT on HF's free inference API. It runs through HF Router → fal-ai provider, which has a free tier but may charge after. Check your HF billing page for actual costs.

## 🏗 Architecture

```
Browser → Vercel (Next.js) → HF Router (fal-ai Z-Image-Turbo ~5s)
                                    ↓ image URL
                              Download image bytes
                                    ↓
                           Cloudflare R2 → public URL
                                    ↓
                            Returns to browser
```

- **Sync generation** — no polling, no task queue, no Redis
- Z-Image-Turbo inference takes ~5 seconds
- Vercel free tier has 10s timeout — fits perfectly

## 🛡 Content Policy

This stack has **zero content filtering**:
- Z-Image-Turbo is a raw 6B DiT model with no safety classifier
- fal-ai provider does not censor prompts
- R2 storage does not scan uploaded content
- Vercel does not inspect application payloads

**You are responsible** for what you generate and host. Check local laws.

## 🔧 Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **AI Model**: Tongyi-MAI/Z-Image-Turbo via HF Router → fal-ai (6B S3-DiT, 8-step)
- **Storage**: Cloudflare R2 (S3-compatible, global CDN)
- **Hosting**: Vercel (edge deployment, free tier)

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout + SEO + analytics
│   ├── page.tsx            # Main UI: input, ratios, results
│   ├── globals.css         # Dark theme, glassmorphism
│   └── api/generate/
│       └── route.ts        # POST endpoint: HF → R2 → URL
└── lib/
    ├── dimensions.ts       # Shared image dimensions
    ├── hf.ts               # HF Router + fal-ai inference client
    └── r2.ts               # R2 upload with AWS SigV4
```

## 📝 License

MIT — do whatever you want.
