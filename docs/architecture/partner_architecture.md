# Partner Integrations Architecture & Objectives

This document explains the architecture and operational flow of the **Partner Integrations** scraper. This module is built for flexibility, allowing the system to ingest properties from any arbitrary real estate website (e.g., local agencies, smaller listing sites) without writing custom code for each one.

---

## 1. Core Objectives
- Provide a generic, UI-driven way to define new scrapers on the fly.
- Allow administrators to map CSS selectors (Title, Price, Features, Images) visually.
- Reuse the heavy-lifting headless cluster to extract the DOM from any defined partner site safely and push findings back to the main app.

---

## 2. Component Architecture Overview

### A. The User Interface (PartnerManager & Runner)
*   **Path:** `app/components/admin/import/PartnerManager.tsx`
*   **Role:** The dashboard where admins configure "Partners". Each Partner is stored in the Supabase database as a JSON object containing a Base URL, pagination logic, and the exact DOM mapping targets. The `Runner` tab allows the admin to select a Partner from a dropdown and execute the scrape.

### B. The API Bridge
*   **Path:** `app/api/admin/start-dynamic-import/route.ts`
*   **Role:** Identical to the Immoflux API bridge. It accepts the dynamic `extractSelectors` configuration from the UI payload rather than hardcoding them. It passes this custom blueprint to the Render microservice.

### C. The Dedicated Scraping Microservice (Render)
*   **Path:** `scraper-api-microservice/index.js` `(Route: POST /api/run-dynamic-scrape)`
*   **Role:** 
    1. Functions as a generic "Headless Drone".
    2. Receives the `categoryUrl` and the `extractSelectors` JSON.
    3. Navigates to the generic URL. Unlike OLX or Immoflux, no specific "Auth Bypass" or "Phone Number Clicker" logic is executed unless explicitly programmed.
    4. Evaluates every selector mapping against the page via DOM queries.
    5. Formats the unstructured internet data into a clean JSON Property Object and Webhooks it back.

### D. The Ingestion Webhook Handler
*   **Path:** `app/api/admin/headless-dynamic-import/route.ts`
*   **Role:** Receives the fully formatted JSON from the generic partner scrape, downloads any referenced images, and creates regular `properties` rows.

---

## 3. Crucial Rules for Future Development
> [!CAUTION]
> **1. CSS Selector Fragility.** Generic partner scrapers rely entirely on the exact CSS layout of the target website. If a partner website redesigns their UI, the DOM selectors saved in the database will return `null`. The microservice will NOT crash, but the imported properties will be empty.
> [!WARNING]
> **2. No Automated Captcha Solving.** The generic partner engine does not have sophisticated OCR (like Publi24) or Auto-Login logic (like Immoflux). If a partner site adds Cloudflare or reCAPTCHA to their search pages, the proxy IP must handle the reputation check, or the dynamic scrape will fail.
