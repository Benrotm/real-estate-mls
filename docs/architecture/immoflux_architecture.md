# Immoflux Scraper Architecture & Objectives

This document serves as the master blueprint for the **Immoflux Dynamic Scraper** module. It explicitly details the objectives, architecture, logic flow, and crucial differences from other scrapers (OLX/Publi24) to ensure context is never lost during continuous development, bug fixing, or feature scaling.

---

## 1. Core Objectives
The primary objective of the Immoflux Scraper is to autonomously monitor, extract, and ingest exclusively targeted property listings (usually under "Anunturi Particulari") directly into the Real Estate MLS platform without manual intervention.

To achieve this, the system must:
1. **Bypass the Immoflux Firewall:** Successfully negotiate the mandatory authentication wall whenever session cookies expire.
2. **Stateful Iteration (Loop History):** Autonomously track which pages have already been scraped and resume pagination perfectly without rescraping old pages.
3. **Dynamic Data Extraction:** Use highly configurable CSS selectors to accommodate Immoflux DOM changes without hardcoded string parsing.
4. **Asynchronous Webhook Ingestion:** Push properties one by one backwards to the Next.js server to prevent Edge Function timeouts and Vercel limits.

---

## 2. Component Architecture Overview

The Immoflux scraper operates across **four distinct abstraction layers** to guarantee scalability and avoid browser quota issues on the main deployment server.

### A. The User Interface (SettingsClient)
*   **Path:** `app/dashboard/admin/settings/SettingsClient.tsx`
*   **Role:** The visual control center for the administrator. It allows configuration of the targeting Base URL, mapping selectors (Title, Price, Description, Images), and delay thresholds. 
*   **Unique Feature:** Contains an embedded **Realtime Terminal Widget** that subscribes directly to Supabase `scrape_logs`.

### B. The API Bridge (Next.js Edge)
*   **Path:** `app/api/admin/start-dynamic-import/route.ts`
*   **Role:** An authenticated Next.js API route that acts like a proxy. It validates the user is a `super_admin` or `admin`, securely extracts configured proxy settings and Immoflux server credentials from `.env`, constructs a JSON payload, and HTTP POSTs the payload to the Render Microservice.

### C. The Dedicated Scraping Microservice (Render)
*   **Path:** `scraper-api-microservice/index.js` `(Route: POST /scrape/dynamic)`
*   **Role:** The heavy-lifting headless browser cluster. 
*   **Differences from OLX:**
    1.  **Authentication Interceptor:** If the scraper navigates to Immoflux and the DOM URL changes to `/login` or `/password/reset`, the script pauses extraction, identifies password fields, types `benoni.silion@blitz-timisoara.ro` and the password, clicks submit, waits for redirection, and *then* resumes scanning.
    2.  **`data-url` Link Harvesting:** Immoflux hides links behind `href="javascript:void(0)"`. The core engine overrides this completely by scanning for `data-url` attributes exclusively on `.avatar-ap, a` element blocks.
    3.  **URL Sanitization:** Resolves relative paths automatically to `https://blitz.immoflux.ro` absolute paths.
    4.  **Loop History Memory:** Communicates with `admin_settings` row in Supabase to read `last_page_scraped`. It increments it dynamically, iterating through page after page until 0 links are found.

### D. The Ingestion Webhook Handler
*   **Path:** `app/api/admin/headless-dynamic-import/route.ts` (or similar webhook listener)
*   **Role:** Receives structured JSON from the Render microservice, processes image blobs to Supabase Storage, and commits rows directly to the `properties` table.

---

## 3. Crucial Rules for Future Development

Whenever updating, debugging, or fixing the Immoflux logic, adhere to these strict bounds to avoid regressions:

> [!WARNING]
> **1. Do not append pagination manually in the database settings.**
> The underlying URL saved in `admin_settings` MUST NEVER contain `?page=x`. The microservice handles `?page=` appends automatically. If the base URL is saved with `.approperties?page=11`, the microservice evaluates `.approperties?page=11&page=1` resulting in 0 links.

> [!CAUTION]
> **2. Never hardcode OLX/Publi24 logic into the Dynamic Scraper route.**
> The `/scrape/dynamic` POST route on the microservice is a generic headless bridge designed primarily for Immoflux. Do NOT introduce OCR phone number image solving into this file, as Immoflux renders numbers via React/DOM text elements, unlike Publi24.

> [!IMPORTANT]
> **3. Terminal Debugging is tied to `activeJobId`.**
> If logs suddenly disappear from the UI Terminal widget, check the `SettingsClient.tsx` state variable for `activeJobId`. The logs are filtered strictly in Realtime via `job_id=eq.[activeJobId]`. If the API bridge doesn't create a `scrape_jobs` entry properly, the logs will sink to the backend unseen.
