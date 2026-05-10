const text = `...
Regim inaltime D+P
Descriere
Blitz Romania va prezinta o oportunitate imobiliară rafinată, ideală pentru cei care caută echilibrul perfect între confortul urban modern și intim`;

const match = text.match(/Descriere\s*:?\s*([\s\S]+?)(?:\s+Detalii suplimentare|\s+Caracteristici|\s+Dotari|\s*Zona|$)/i);
console.log(match ? match[1].trim() : "FAILED");
