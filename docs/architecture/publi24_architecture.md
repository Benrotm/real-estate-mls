# Publi24 Scraper Architecture & Objectives

This document outlines the architecture and specific workflow for the **Publi24 Bulk Scraper**. While sharing the same ingestion pipeline as OLX, Publi24 requires a highly specialized Optical Character Recognition (OCR) sub-engine to defeat its anti-bot phone number obfuscation.

---

## 1. Core Objectives
- Traverse paginated Publi24 real estate category links.
- **Solve Image-Based Phone Numbers:** Publi24 explicitly prevents text extraction by rendering the owner's phone number as a dynamically generated image (`.png` / `.jpeg`). The scraper must download, read, and convert this image into raw text.

---

## 2. Component Architecture Overview

### A. The User Interface & API Bridge
*   Shares the exact same UI (`BulkImportClient`) and API Bridge (`start-bulk-import`) as OLX.
*   The system differentiates behavior based purely on analyzing the target URL string (`url.includes('publi24.ro')`).

### B. The Ingestion Handler & Webhook
*   **Path:** `app/api/admin/bulk-scrape-item/route.ts` -> `app/lib/actions/scrapeAdvanced.ts`
*   **Role:** Parses the static DOM. When the backend detects the URL is Publi24, it explicitly halts and passes the URL to the microservice for advanced resolution.

### C. The OCR Solving Microservice (Render)
*   **Path:** `scraper-api-microservice/index.js` `(Route: /api/scrape-advanced)`
*   **Role:** The heavy execution environment.
    1.  Uses Playwright to navigate to the individual Publi24 property page.
    2.  Simulates a click on the "Arata Numarul" (Show Number) prompt.
    3.  Intercepts the subsequent network request that fetches the phone number image.
    4.  **Tesseract.js Engine:** Buffers the image binary and feeds it directly into Tesseract's OCR ML engine to read the pixels and guess the alphanumeric digits.
    5.  Returns the solved text string back to the Next.js API.

---

## 3. Crucial Rules for Future Development
> [!CAUTION]
> **1. Never block Media/Images Universally.**
> To save proxy bandwidth, the system aborts media/image tracking. However, you MUST explicitly whitelist urls containing `PhoneNumberImages` or `Telefon` in the Playwright `page.route` intercepts. If blocked, the Tesseract engine receives a null buffer and the scraper crashes.
> [!IMPORTANT]
> **2. Tesseract OCR is Error-Prone.**
> Sometimes the OCR guesses a number incorrectly (e.g., `8` instead of `B`, or misses a `+40`). Any normalization or trimming logic must be carefully applied to the output received from the microservice.
