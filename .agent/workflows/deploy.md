---
description: instructions on how to deploy the Real Estate MLS application to a public domain
---

# Deployment Guide

To present your project to investors on a public domain, the most professional and easiest option for a Next.js project is **Vercel**.

## Option 1: Vercel (Recommended)

1. **Push to a Git Repository**:
   - Create a new repository on [GitHub](https://github.com), [GitLab](https://gitlab.com), or [Bitbucket](https://bitbucket.org).
   - Push your current local code to this repository.

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign up (free for personal/pro hobby).
   - Click **"Add New"** > **"Project"**.
   - Import your Git repository.

3. **Configure Settings**:
   - **Framework Preset**: Should automatically detect `Next.js`.
   - **Environment Variables**: If you eventually get a Google Maps API Key, add it as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` here.
   - Click **"Deploy"**.

4. **Public Domain**:
   - Vercel will give you a default domain like `real-estate-mls.vercel.app`.
   - To use a custom domain (e.g., `yourproject.com`), go to the **"Domains"** tab in your project settings on Vercel.

## Option 2: Netlify

1. **Connect Repository**:
   - Go to [netlify.com](https://netlify.com) and choose **"Import from Git"**.
2. **Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. **Deploy**:
   - Click **"Deploy Site"**.

## Investor Presentation Tips

- **Custom Domain**: For a more premium feel, buy a `.com` domain (via Namecheap or Google Domains) and connect it to Vercel.
- **Demo Mode**: Ensure your mock data is "investor ready" with high-quality images and realistic pricing.
- **SSL**: Both Vercel and Netlify provide free SSL (HTTPS) automatically, which is essential for trust.
