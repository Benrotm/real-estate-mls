# Single Link Scraper Architecture & Objectives

This document explains the architecture and logic flow for the **Single Link Scraper** (also known as "Import from Link"). Unlike the bulk scrapers or dynamic background iterators, this scraper is designed for immediate, synchronous, on-demand execution initiated directly by an agent or user through the UI.

---

## 1. Core Objectives
- Allow users to paste a single URL (e.g., from OLX, Publi24, or a designated Partner) and immediately extract the property metadata into their draft inventory.
- Ensure the extraction happens **synchronously**, returning data directly to the UI without relying on background webhooks (so the user sees the result instantly).
- Provide an optional "Deep Scrape" fallback for sites with heavy bot protection or hidden phone numbers.

---

## 2. Component Architecture Overview

### A. The User Interface (ImportPropertiesModal)
*   **Path:** `app/components/properties/ImportPropertiesModal.tsx`
*   **Role:** The frontend modal where users paste a `linkUrl`. It checks the domain against the active `partner_integrations` via `getScraperConfigs()`. It includes an option to force a "Deep Scrape" if the standard extraction fails. Once data is retrieved, it conditionally triggers an OTP ownership verification before saving.

### B. Fast Extraction Layer (Server Action)
*   **Path:** `app/lib/actions/scrape.ts` (`scrapeProperty`)
*   **Role:** The first line of defense. Uses **Cheerio**, a fast, static HTML parser. Instead of booting up an entire browser, the Server Action simply `fetch`es the DOM HTML directly on the Next.js server and extracts Title, Price, Description, Images, etc., based on the matching configuration mapping. It is lightning fast but cannot execute JavaScript.

### C. Deep Extraction Layer / Microservice Bridge
*   **Path:** `app/lib/actions/scrapeAdvanced.ts` (`scrapeAdvanced`)
*   **Role:** If the user checks "Deep Scrape", or if `scrapeProperty` recognizes missing encrypted fields (like Publi24 phone numbers), this script triggers. 
    1. It delegates the heavy lifting to the Render microservice (`/api/scrape-advanced`).
    2. The Microservice boots a Playwright browser instance just for this one link.
    3. If it's a Publi24 link, the Microservice intercepts the phone number image and executes the Tesseract OCR engine to solve it.
    4. The Microservice returns a JSON response straight back to the waiting Server Action.

### D. Final Processing
*   The raw data is returned to the React frontend.
*   The UI asks the user to confirm via OTP (if configured in Admin settings).
*   The UI fires the `onScrapeSuccess` callback to permanently save the listing locally.

---

## 3. Crucial Rules for Future Development
> [!IMPORTANT]
> **1. Synchronous Latency Risks.** Because the Single Link scraper blocks the UI while waiting for the Server Action, "Deep Scrapes" that rely on the Render microservice booting Chrome can take 10-15 seconds. Ensure the frontend `isLoading` state is robust, otherwise users will double-click and fire multiple duplicate microservice requests.
> [!WARNING]
> **2. No Webhooks Used Here.** The OLX and Immoflux background scrapers use webhooks to slowly insert data to avoid Lambda timeouts. The Single Link scraper does NOT use webhooks. It relies entirely on returning inline JSON execution. Vercel Serverless Functions have a strict 10s-60s timeout limit. Heavy Single Link scrapes MUST stay under this timeout.
