import fs from 'fs';

let content = fs.readFileSync('app/dashboard/admin/settings/SettingsClient.tsx', 'utf8');

content = content.replace('updateImmofluxSetting, updateFluxMLSSetting, AdminSettings, ImmofluxConfig, ProxyConfig', 'AdminSettings, ProxyConfig');

content = content.replace(/\/\/ Historical Auto-Scraper State[\s\S]*?\/\/ Terminal State/, '// Terminal State');
content = content.replace(/\/\/ FluxMLS Terminal State[\s\S]*?\/\/ Initial Load Override/, '// Initial Load Override');

content = content.replace(/\/\/ Historical Auto-Scrape interval[\s\S]*?\/\/ Handle Realtime Terminal Subscription/, '// Handle Realtime Terminal Subscription');
content = content.replace(/\/\/ FluxMLS Terminal Subscriptions[\s\S]*?async function loadSettings\(\)/, 'async function loadSettings()');

content = content.replace(/const handleImmofluxChange = [\s\S]*?\/\/ if \(isLoading\) \{/, 'if (isLoading) {');
content = content.replace(/const handleImmofluxChange = [\s\S]*?if \(isLoading\) \{/, 'if (isLoading) {');

content = content.replace(/\{\/\* Immoflux Settings Panel \*\/\}[\s\S]*?<\/div>$/, '</div>\n        </div>\n    );\n}');

fs.writeFileSync('app/dashboard/admin/settings/SettingsClient.tsx', content);
console.log("Refactored SettingsClient.tsx!");
