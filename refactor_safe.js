const fs = require('fs');
const file = 'app/dashboard/admin/imofluxmls/ImoFluxMLSClient.tsx';
let txt = fs.readFileSync(file, 'utf8');

// Rename class
txt = txt.replace(/ImoFluxMLSClient/g, 'ImofluxClient');

// Remove State
const s1 = txt.indexOf('// FluxMLS Auto-Scraper State');
const e1 = txt.indexOf('// Terminal State');
txt = txt.slice(0, s1) + txt.slice(e1);

const s2 = txt.indexOf('// FluxMLS Terminal State');
const e2 = txt.indexOf('// Historical Auto-Scrape interval');
txt = txt.slice(0, s2) + txt.slice(e2);

// Remove Effect
const s3 = txt.indexOf('// FluxMLS Historical Auto-Scrape interval');
const e3 = txt.indexOf('// Handle Realtime Terminal Subscription');
txt = txt.slice(0, s3) + txt.slice(e3);

const s4 = txt.indexOf('// FluxMLS Terminal Subscriptions');
const e4 = txt.indexOf('const handleImmofluxChange = ');
txt = txt.slice(0, s4) + txt.slice(e4);

// Remove Handlers
const s5 = txt.indexOf('const handleFluxMLSChange =');
const e5 = txt.indexOf('const toggleAutoScrape = ');
txt = txt.slice(0, s5) + txt.slice(e5);

const s6 = txt.indexOf('const toggleFluxAutoScrape =');
const e6 = txt.indexOf('if (isLoading) {');
txt = txt.slice(0, s6) + txt.slice(e6);

// Remove JSX UI
// Both flux and terminal panels
const s7 = txt.indexOf('{/* FluxMLS Settings Panel */}');
// find the div that ends the Flux panel.
// Actually, I can just slice from { FluxMLS } to the end of the file, then reconstruct the final `</div></div>); }` 
// Because FluxMLS is the LAST element in the wrapper.
// Let's verify: The wrapper is `<div className="max-w-4xl space-y-8 animate-in fade-in duration-500">`
const endFileContent = `
        </div>
    );
}
`;
txt = txt.slice(0, s7) + endFileContent;

fs.writeFileSync(file, txt);

// Now do FluxMLSClient
const file2 = 'app/dashboard/admin/fluxmls/FluxMLSClient.tsx';
let txt2 = fs.readFileSync(file2, 'utf8');

txt2 = txt2.replace(/ImoFluxMLSClient/g, 'FluxMLSClient');
txt2 = txt2.replace(/updateImmofluxSetting, updateFluxMLSSetting/g, 'updateFluxMLSSetting');

// Remove Immoflux states
const f1 = txt2.indexOf('// Historical Auto-Scraper State');
const fe1 = txt2.indexOf('// FluxMLS Auto-Scraper State');
txt2 = txt2.slice(0, f1) + txt2.slice(fe1);

const f2 = txt2.indexOf('// Terminal State');
const fe2 = txt2.indexOf('// FluxMLS Terminal State');
txt2 = txt2.slice(0, f2) + txt2.slice(fe2);

// Remove Effects
const f3 = txt2.indexOf('// Historical Auto-Scrape interval');
const fe3 = txt2.indexOf('// FluxMLS Historical Auto-Scrape interval');
txt2 = txt2.slice(0, f3) + txt2.slice(fe3);

const f4 = txt2.indexOf('// Handle Realtime Terminal Subscription');
const fe4 = txt2.indexOf('// FluxMLS Terminal Subscriptions');
txt2 = txt2.slice(0, f4) + txt2.slice(fe4);

// Remove Handlers
const f5 = txt2.indexOf('const handleImmofluxChange =');
const fe5 = txt2.indexOf('const handleFluxMLSChange =');
txt2 = txt2.slice(0, f5) + txt2.slice(fe5);

const f6 = txt2.indexOf('const toggleAutoScrape =');
const fe6 = txt2.indexOf('const toggleFluxAutoScrape =');
txt2 = txt2.slice(0, f6) + txt2.slice(fe6);

// Remove Ui
const f7 = txt2.indexOf('{/* Immoflux Settings Panel */}');
const fe7 = txt2.indexOf('{/* FluxMLS Settings Panel */}');
txt2 = txt2.slice(0, f7) + txt2.slice(fe7);

fs.writeFileSync(file2, txt2);

console.log("SUCCESS");
