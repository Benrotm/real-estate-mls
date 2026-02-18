
import * as cheerio from 'cheerio';

interface AttributeCandidate {
    id: string;
    label: string;
    value: string;
    selector: string;
    confidence: number;
    sourceType: 'table' | 'dl' | 'label-value' | 'meta' | 'json-ld' | 'id-class';
}

async function analyzePropertyPage(url: string) {
    console.log(`Analyzing: ${url}`);
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch URL: ${response.statusText}`);
            return;
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const candidates: AttributeCandidate[] = [];
        let candidateId = 0;

        const addCandidate = (label: string, value: string, selector: string, sourceType: AttributeCandidate['sourceType'], confidence = 0.8) => {
            const cleanLabel = label.replace(/[:]/g, '').trim();
            const cleanValue = value.trim();

            if (cleanLabel && cleanValue && cleanLabel.length < 50 && cleanValue.length < 200) {
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

        // 1. Meta Tags
        $('meta[property="og:title"]').each((_, el) => addCandidate('og:title', $(el).attr('content') || '', 'meta[property="og:title"]', 'meta', 0.9));
        $('meta[property="og:price:amount"]').each((_, el) => addCandidate('og:price', $(el).attr('content') || '', 'meta[property="og:price:amount"]', 'meta', 0.9));

        // 2. Headings
        $('h1').each((_, el) => {
            addCandidate('Page Title (h1)', $(el).text(), 'h1', 'id-class', 0.9);
        });

        // 3. Definition Lists
        $('dl').each((_, dl) => {
            $(dl).find('dt').each((_, dt) => {
                const $dt = $(dt);
                const $dd = $dt.next('dd');
                if ($dd.length) {
                    const label = $dt.text();
                    const value = $dd.text();
                    const selector = `dt:contains("${label.trim()}") + dd`;
                    addCandidate(label, value, selector, 'dl');
                }
            });
        });

        // 4. Tables
        $('table').each((_, table) => {
            $(table).find('tr').each((_, tr) => {
                const tds = $(tr).find('td, th');
                if (tds.length === 2) {
                    const label = $(tds[0]).text();
                    const value = $(tds[1]).text();
                    const selector = `td:contains("${label.trim()}") + td`;
                    addCandidate(label, value, selector, 'table');
                }
            });
        });

        // 5. Generic Label-Value Pairs
        const labelSelectors = ['.label', '.key', '.property', '.attribute-label', 'strong', 'b', '.name'];
        $(labelSelectors.join(', ')).each((_, el) => {
            const $label = $(el);
            const labelText = $label.text().trim();

            if (!labelText || labelText.length > 40 || labelText.includes('\n') || labelText.length < 2) return;

            let $value = $label.next();
            if ($value.length) {
                let selector = '';
                const tag = ($label.prop('tagName') || 'div').toLowerCase();
                const parent = $label.parent();

                if ($value.attr('class')) {
                    if (parent.text().length < 200) {
                        const parentTag = (parent.prop('tagName') || 'div').toLowerCase();
                        const valueClass = $value.attr('class')?.split(' ')[0];
                        if (valueClass) {
                            selector = `${parentTag}:contains("${labelText}") .${valueClass}`;
                        }
                    }
                }

                if (!selector) {
                    const valueTag = ($value.prop('tagName') || 'span').toLowerCase();
                    selector = `${tag}:contains("${labelText}") + ${valueTag}`;
                }

                addCandidate(labelText, $value.text(), selector, 'label-value');
            }
        });

        // 6. Price Patterns
        $('.price, .amount, .value, [class*="price"]').each((_, el) => {
            const text = $(el).text().trim();
            if (text.match(/[0-9]/) && text.length < 20) {
                const className = $(el).attr('class');
                if (className) {
                    let selector = `.${className.split(' ').join('.')}`;
                    addCandidate('Price Candidate', text, selector, 'id-class', 0.6);
                }
            }
        });

        // Deduplicate
        const uniqueCandidates: AttributeCandidate[] = [];
        const seenSelectors = new Set<string>();
        candidates.forEach(c => {
            if (!seenSelectors.has(c.selector)) {
                seenSelectors.add(c.selector);
                uniqueCandidates.push(c);
            }
        });

        console.log('--- Discovered Candidates ---');
        uniqueCandidates.forEach(c => {
            console.log(`[${c.sourceType}] ${c.label}: ${c.value.substring(0, 50)}...`);
            console.log(`   Selector: ${c.selector}`);
        });

    } catch (error: any) {
        console.error('Analysis Error:', error);
    }
}

// target url
const url = 'https://www.publi24.ro/anunturi/imobiliare/de-vanzare/apartamente/apartamente-2-camere/anunt/apartament-decomandat-cu-2-camere-si-bucatarie-inchisa-in-giroc/fefg2he7d5g1722i177ih1912d540g6f.html';
analyzePropertyPage(url);
