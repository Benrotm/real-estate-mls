---
description: Instructions on how to safely debug, fix, or modify any of the property scrapers (Immoflux, OLX, Publi24, Partner, Single Link)
---

# Scraper Modification Workflow

**CRITICAL INSTRUCTION:** Do NOT modify any scraper logic, NextJS API routes, or the Render microservice (`scraper-api-microservice`) without FIRST reading the designated architecture master file.

The scrapers in this platform interact with complex external systems. Overwriting logic in one place often breaks another (e.g., mixing Publi24 OCR logic with Immoflux DOM logic).

## Step 1: Read the Blueprint
Before writing ANY code, use the `view_file` tool to read the architecture document corresponding to the scraper you are working on. These documents are permanently stored in:
`docs/architecture/`

- `immoflux_architecture.md` (Stateful, Auto-Login Firewall Bypass)
- `olx_architecture.md` (Bulk, JS Clicker)
- `publi24_architecture.md` (Bulk, Tesseract Image OCR)
- `partner_architecture.md` (Generic Selector Configuration)
- `single_link_architecture.md` (Synchronous Fast Cheerio)

## Step 2: Formulate & Present Your Fix
Match your proposed changes against the "Crucial Rules for Future Development" section at the bottom of the architecture document. 
Use the `notify_user` tool to present your plan to the user. Explain exactly what you are modifying and confirm it does not violate the architecture bounds.

## Step 3: Git Version Control & Deployment
Once the user confirms your plan:
1. Make your code modifications.
2. Run a git commit and push the changes, which will automatically trigger the deployment to Render or Vercel.

```bash
git add .
git commit -m "chore: [Brief description of the fix for ScraperName]"
git push
```
// turbo

## Step 4: Update Docs
If your changes alter the fundamental behavior of the scraper (e.g., adding a new abstraction layer or changing the auth flow), you MUST update the corresponding `docs/architecture/*.md` file to reflect the new state.
