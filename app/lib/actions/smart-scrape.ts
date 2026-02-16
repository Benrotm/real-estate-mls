'use server';

import * as cheerio from 'cheerio';

export interface AttributeCandidate {
    id: string; // unique identifier for the candidate
    label: string; // The "key" found on the page (e.g. "Suprafata utila")
    value: string; // The "value" associated with the key (e.g. "54 mp")
    selector: string; // The generated CSS selector to find this value
    confidence: number; // 0-1 score indicating how likely this is a good match
    sourceType: 'table' | 'dl' | 'label-value' | 'meta' | 'json-ld' | 'id-class';
}

export async function analyzePropertyPage(url: string): Promise<{ success: boolean; candidates: AttributeCandidate[]; error?: string }> {
    try {
        if (!url || !url.startsWith('http')) {
            return { success: false, candidates: [], error: 'Invalid URL provided' };
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            }
        });

        if (!response.ok) {
            return { success: false, candidates: [], error: `Failed to fetch URL: ${response.statusText}` };
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const candidates: AttributeCandidate[] = [];
        let candidateId = 0;

        // Helper to add candidate
        const addCandidate = (label: string, value: string, selector: string, sourceType: AttributeCandidate['sourceType'], confidence = 0.8) => {
            const cleanLabel = label.replace(/[:]/g, '').trim();
            const cleanValue = value.trim();

            if (cleanLabel && cleanValue && cleanLabel.length < 50 && cleanValue.length < 200) {
                // Check specifically for unwanted label chars or too long values
                candidates.push({
                    id: `cand_${++candidateId}`,
                    label: cleanLabel,
                    value: cleanValue,
                    selector,
                    sourceType,
                    confidence
                });
            }
        };

        // 1. Meta Tags (High Confidence for basic info)
        $('meta[property="og:title"]').each((_, el) => addCandidate('og:title', $(el).attr('content') || '', 'meta[property="og:title"]', 'meta', 0.9));
        $('meta[property="og:price:amount"]').each((_, el) => addCandidate('og:price', $(el).attr('content') || '', 'meta[property="og:price:amount"]', 'meta', 0.9));

        // 2. Headings (Title candidates)
        $('h1').each((_, el) => {
            addCandidate('Page Title (h1)', $(el).text(), 'h1', 'id-class', 0.9);
        });

        // 3. Definition Lists (dl > dt + dd)
        $('dl').each((_, dl) => {
            $(dl).find('dt').each((_, dt) => {
                const $dt = $(dt);
                const $dd = $dt.next('dd');
                if ($dd.length) {
                    const label = $dt.text();
                    const value = $dd.text();
                    // Generate robust selector
                    // Strategy: dt:contains("Label") + dd
                    const selector = `dt:contains("${label.trim()}") + dd`;
                    addCandidate(label, value, selector, 'dl');
                }
            });
        });

        // 4. Tables (tr > td:first-child (label) + td:last-child (value))
        $('table').each((_, table) => {
            $(table).find('tr').each((_, tr) => {
                const tds = $(tr).find('td, th');
                if (tds.length === 2) {
                    const label = $(tds[0]).text();
                    const value = $(tds[1]).text();
                    // Strategy: tr:has(td:contains("Label")) td:nth-child(2)
                    // Better: td:contains("Label") + td
                    const selector = `td:contains("${label.trim()}") + td`;
                    addCandidate(label, value, selector, 'table');
                }
            });
        });

        // 5. Generic Label-Value Pairs (div > label + span/div)
        // Common pattern: <div class="row"><div class="label">Key</div><div class="value">Val</div></div>

        // Strategy A: Find elements with "label" in class or tag, then find next sibling
        const labelSelectors = ['.label', '.key', '.property', '.attribute-label', 'strong', 'b', '.name'];
        $(labelSelectors.join(', ')).each((_, el) => {
            const $label = $(el);
            const labelText = $label.text().trim();

            // Avoid empty labels or very long text (likely not a label)
            if (!labelText || labelText.length > 40 || labelText.includes('\n') || labelText.length < 2) return;

            // Look for value in next sibling
            let $value = $label.next();
            if ($value.length) {
                // Strategy: .parent-class .label-class:contains("Label") + .value-element
                // Simplified for user: element:contains("Label") + *

                // Construct a robust selector
                let selector = '';
                // Safer access to tagName
                const tag = ($label.prop('tagName') || 'div').toLowerCase();
                const parent = $label.parent();

                // Case 1: Publi24 style - specialized parent container
                // <div class="attribute-item"><div class="label">...</div><div class="value">...</div></div>
                // Selector: .attribute-item:contains("Label") .attribute-value (if value class exists)

                // Try to find a class on the value
                if ($value.attr('class')) {
                    // If value has a class, target that class within a parent that contains the label text
                    // This is safer than Next Sibling sometimes
                    // Check if parent is small enough to be a container
                    if (parent.text().length < 200) {
                        const parentTag = (parent.prop('tagName') || 'div').toLowerCase();
                        const valueClass = $value.attr('class')?.split(' ')[0];
                        if (valueClass) {
                            selector = `${parentTag}:contains("${labelText}") .${valueClass}`;
                        }
                    }
                }

                if (!selector) {
                    // Default to adjacent sibling
                    const valueTag = ($value.prop('tagName') || 'span').toLowerCase();
                    selector = `${tag}:contains("${labelText}") + ${valueTag}`;
                }

                addCandidate(labelText, $value.text(), selector, 'label-value');
            }
        });

        // 6. Price Patterns
        // Look for common price classes
        $('.price, .amount, .value, [class*="price"]').each((_, el) => {
            const text = $(el).text().trim();
            if (text.match(/[0-9]/) && text.length < 20) {
                // Try to get a specific selector
                // Safe access to class
                const className = $(el).attr('class');
                if (className) {
                    let selector = `.${className.split(' ').join('.')}`;
                    // If multiple elements have this class, this selector is risky.
                    // But for price, it's often the first one or unique.
                    // We pass it as a candidate.
                    addCandidate('Price Candidate', text, selector, 'id-class', 0.6);
                }
            }
        });

        // Deduplicate candidates by selector (keep first/best)
        const uniqueCandidates: AttributeCandidate[] = [];
        const seenSelectors = new Set<string>();

        candidates.forEach(c => {
            if (!seenSelectors.has(c.selector)) {
                seenSelectors.add(c.selector);
                uniqueCandidates.push(c);
            }
        });

        return { success: true, candidates: uniqueCandidates };

    } catch (error: any) {
        console.error('Analysis Error:', error);
        return { success: false, candidates: [], error: error.message };
    }
}
