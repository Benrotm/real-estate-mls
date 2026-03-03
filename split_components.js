const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'app/dashboard/admin/imofluxmls/ImoFluxMLSClient.tsx');
let content = fs.readFileSync(srcPath, 'utf8');

// The easiest way is to modify the AST or do block replacements.

// ==============================
// 1. Build ImoFluxClient.tsx (Keep Immoflux, Remove FluxMLS)
// ==============================
let imo = content.replace('ImoFluxMLSClient', 'ImofluxClient');

// Strip FluxMLS States
imo = imo.replace(/\/\/ FluxMLS Auto-Scraper State[\s\S]*?\/\/ FluxMLS Watcher State[\s\S]*?\/\/ Terminal State/, '// Terminal State');
imo = imo.replace(/\/\/ FluxMLS Terminal State[\s\S]*?\/\/ Historical Auto-Scrape interval/, '// Historical Auto-Scrape interval');

// Strip FluxMLS Effects
imo = imo.replace(/\/\/ FluxMLS Historical Auto-Scrape interval[\s\S]*?\/\/ FluxMLS Watcher Auto-Scrape interval[\s\S]*?\/\/ Handle Realtime Terminal Subscription/, '// Handle Realtime Terminal Subscription');
imo = imo.replace(/\/\/ FluxMLS Terminal Subscriptions[\s\S]*?const handleImmofluxChange =/m, 'const handleImmofluxChange =');

// Strip FluxMLS Handlers
imo = imo.replace(/const handleFluxMLSChange =[\s\S]*?const toggleAutoScrape =/m, 'const toggleAutoScrape =');
imo = imo.replace(/const toggleFluxAutoScrape =[\s\S]*?if \(isLoading\) \{/m, 'if (isLoading) {');

// Strip FluxMLS UI Panel
const fluxUIStart = imo.indexOf('{/* FluxMLS Settings Panel */}');
const terminalUIStart = imo.indexOf('{/* VISUAL FLUX TERMINAL PANEL */}');
if (fluxUIStart !== -1 && terminalUIStart !== -1) {
    // Find where the flux section ends. Usually it ends with a closing div before the main wrapper closes.
    // It's safer to just replace from the UI Start up to the end of the return block and reconstruct.
    // Actually, both panels are identical root blocks.
}
// Let's use string operations based on exact comments.
imo = imo.replace(/\{\/\* FluxMLS Settings Panel \*\/\}[\s\S]*?\{\/\* VISUAL FLUX TERMINAL PANEL \*\/\}[\s\S]*?<\/div>(\s*)<\/div>(\s*)<\/div>(\s*)<\/div>/, '</div>\n        </div>');

fs.writeFileSync('imo_clean_test.tsx', imo);

// ==============================
// 2. Build FluxMLSClient.tsx (Keep FluxMLS, Remove Immoflux)
// ==============================
let flux = content.replace('ImoFluxMLSClient', 'FluxMLSClient');

// Strip Immoflux States
flux = flux.replace(/\/\/ Historical Auto-Scraper State[\s\S]*?\/\/ Watcher Auto-Scraper State[\s\S]*?\/\/ FluxMLS Auto-Scraper State/, '// FluxMLS Auto-Scraper State');
flux = flux.replace(/\/\/ Terminal State[\s\S]*?\/\/ FluxMLS Terminal State/, '// FluxMLS Terminal State');

// Strip Immoflux Effects
flux = flux.replace(/\/\/ Historical Auto-Scrape interval[\s\S]*?\/\/ Watcher Auto-Scrape interval[\s\S]*?\/\/ FluxMLS Historical Auto-Scrape interval/, '// FluxMLS Historical Auto-Scrape interval');
flux = flux.replace(/\/\/ Handle Realtime Terminal Subscription[\s\S]*?\/\/ FluxMLS Terminal Subscriptions/, '// FluxMLS Terminal Subscriptions');

// Strip Immoflux Handlers
flux = flux.replace(/const handleImmofluxChange =[\s\S]*?const handleFluxMLSChange =/m, 'const handleFluxMLSChange =');
flux = flux.replace(/const toggleAutoScrape =[\s\S]*?const toggleFluxAutoScrape =/m, 'const toggleFluxAutoScrape =');

// Strip Immoflux UI
flux = flux.replace(/\{\/\* Immoflux Settings Panel \*\/\}[\s\S]*?\{\/\* VISUAL TERMINAL PANEL \*\/\}[\s\S]*?\{\/\* FluxMLS Settings Panel \*\/}/, '{/* FluxMLS Settings Panel */}');

fs.writeFileSync('flux_clean_test.tsx', flux);

console.log("Written imo_clean_test.tsx and flux_clean_test.tsx");
