# OLX Scraper Architecture & Objectives

This document outlines the architecture and specific flow for the **OLX Bulk Scraper**. Unlike the stateful Immoflux scraper, the OLX integration is designed to ingest large batches of URLs sequentially without worrying about login firewalls.

---

## 1. Core Objectives
- Autonomously traverse user-provided OLX search pages (e.g., apartments for sale in Timisoara).
- Explicitly **filter out Promoted (Promovat) ads** to avoid duplicate scraping at the top of every page.
- Safely extract the owner's phone number, which OLX hides behind a "Suna Vanzatorul" JavaScript button.

---

## 2. Component Architecture Overview

### A. The User Interface (BulkImportClient)
*   **Path:** `app/dashboard/admin/bulk-import/page.tsx`
*   **Role:** Allows the admin to input a starting OLX URL, set delays, and start the job. Contains a realtime terminal logging the ingestion of individual properties.

### B. The API Bridge
*   **Path:** `app/api/admin/start-bulk-import/route.ts`
*   **Role:** Authenticates the admin and dispatches the base URL to the Render microservice (`/api/run-bulk-scrape`).

### C. The Dedicated Scraping Microservice (Render)
*   **Path:** `scraper-api-microservice/index.js`
*   **Role:** Handles two distinct OLX APIs.
    1.  **Iterative Link Discovery (`/api/run-bulk-scrape`):** Navigates to the search page. Scans for property links. Includes logic to explicitly skip promoted ads. Dispatches each individual property link backwards as a webhook.
    2.  **Phone Number Decoding (`/api/scrape-advanced`):** Navigates to a single OLX property URL. Uses Playwright to simulate a human click on the "Suna Vanzatorul" (Show Number) button. Waits for the DOM text to populate, reads it, and returns the clean string.

### D. The Ingestion Webhook Handler
*   **Path:** `app/api/admin/bulk-scrape-item/route.ts` -> `app/lib/actions/scrape.ts`
*   **Role:** 
    1. Receives the single property URL.
    2. Uses Cheerio (fast static HTML parser) to extract Title, Price, Description, and Images.
    3. Calls `scrapeAdvanced.ts` seamlessly if the phone number is missing, pinging the microservice to execute the JS click.
    4. Downloads the main image to Supabase Storage and inserts the DB row.

---

## 3. Crucial Rules for Future Development
> [!WARNING]
> **1. Do not break the Promoted Ad Filter.** OLX injects the same 3-5 promoted ads onto every single page. If the filter is bypassed, the database will fill with dozens of duplicate entries.
> [!IMPORTANT]
> **2. The Phone Number Clicker is Fragile.** The microservice relies on the exact CSS identifier for the "Suna Vanzatorul" button on OLX. If OLX updates their UI design, the microservice `scrape-advanced` route must be strictly updated.
