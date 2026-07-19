# Style Guidelines

## Typography
- Avoid using overly heavy font weights like `font-extrabold` (800) or `font-black` (900) for primary headings or titles in new UI elements.
- Prefer cleaner, slicker bold weights such as `font-bold` (700) or `font-semibold` (600) to keep titles readable, modern, and visually balanced.

## CSS Styling (Tailwind)
- Do not use custom non-standard Tailwind color suffixes (e.g. 650, 655, 955, 855). Standard Tailwind uses 100-900 increments. To use precise custom colors, specify them inside square brackets (e.g., text-[#ea580c]) to avoid class resolution failures resulting in white-on-white or invisible UI elements.
