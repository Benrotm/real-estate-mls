// Pure typescript testing environment for calculator math rules

// Re-declare the types and default data for pure testing
interface Model {
    nm: string;
    desc: string;
    sb: number;
    bb: number;
    pri: 'seller' | 'buyer';
}

interface Tier {
    lbl: string;
    max: number;
    f: number;
}

interface ExclusivityPeriod {
    d: number;
    lbl: string;
    c: number;
    note: string;
}

interface Service {
    id: string;
    cat: string;
    nm: string;
    dc: string;
    cost: number;
    coef: number;
    on: boolean;
    always?: boolean;
    pay: 'commission' | 'separate';
    commAvail: Record<string, boolean>;
}

const TEST_MODELS: Record<string, Model> = {
    "zero-seller": {
        nm: "0% Vânzător",
        desc: "Vânzătorul nu plătește comision. Fără Reprezentare Exclusivă, serviciile se plătesc doar Separat. Cu exclusivitate, serviciile pot fi incluse în comision.",
        sb: 0.0,
        bb: 2.50,
        pri: "buyer"
    },
    "seller": {
        nm: "0% Cumpărător",
        desc: "Comisionul total plătit de vânzător. Cumpărătorul nu are costuri de agenție — avantaj competitiv major care atrage mai mulți cumpărători calificați.",
        sb: 2.00,
        bb: 0.0,
        pri: "seller"
    },
    "both": {
        nm: "Ambele părți egal",
        desc: "Comisionul împărțit egal între vânzător și cumpărător. Serviciile și exclusivitatea ajustează cota vânzătorului.",
        sb: 1.50,
        bb: 1.50,
        pri: "seller"
    }
};

const TEST_TIERS: Tier[] = [
    { lbl: "până la 50.000€", max: 50000, f: 1.00 },
    { lbl: "50.001–100.000€", max: 100000, f: 0.95 },
    { lbl: "100.001–150.000€", max: 150000, f: 0.90 },
    { lbl: "150.001–200.000€", max: 200000, f: 0.85 },
    { lbl: "200.001–250.000€", max: 250000, f: 0.80 },
    { lbl: "250.001–300.000€", max: 300000, f: 0.75 },
    { lbl: "300.001–350.000€", max: 350000, f: 0.70 },
    { lbl: "350.001–400.000€", max: 400000, f: 0.65 },
    { lbl: "400.001–500.000€", max: 500000, f: 0.58 },
    { lbl: "500.001–600.000€", max: 600000, f: 0.52 },
    { lbl: "600.001–700.000€", max: 700000, f: 0.46 },
    { lbl: "700.001–800.000€", max: 800000, f: 0.41 },
    { lbl: "800.001–900.000€", max: 900000, f: 0.37 },
    { lbl: "900.001–1.000.000€", max: 1000000, f: 0.33 },
    { lbl: "1.000.001–1.100.000€", max: 1100000, f: 0.30 },
    { lbl: "1.100.001–1.200.000€", max: 1200000, f: 0.27 },
    { lbl: "1.200.001–1.400.000€", max: 1400000, f: 0.23 },
    { lbl: "1.400.001–1.600.000€", max: 1600000, f: 0.19 },
    { lbl: "1.600.001–1.800.000€", max: 1800000, f: 0.16 },
    { lbl: "1.800.001–2.000.000€", max: 2000000, f: 0.14 },
    { lbl: "peste 2.000.000€", max: 999999999999, f: 0.11 }
];

const TEST_PERIODS: ExclusivityPeriod[] = [
    { d: 30, lbl: "30 zile", c: 0.10, note: "Perioadă scurtă — risc crescut pentru agenție, comision ușor majorat (+0.10%)" },
    { d: 60, lbl: "60 zile", c: 0.00, note: "Standard — fără ajustare de comision (0.00%)" },
    { d: 90, lbl: "90 zile", c: -0.20, note: "Garanție bună — tranzacție mai sigură, reducere comision (−0.20%)" },
    { d: 180, lbl: "180 zile", c: -0.35, note: "Angajament solid — reducere semnificativă de comision (−0.35%)" },
    { d: 270, lbl: "270 zile", c: -0.45, note: "Exclusivitate extinsă — tranzacție practic asigurată, reducere mare (−0.45%)" },
    { d: 360, lbl: "360 zile", c: -0.55, note: "Parteneriat anual — cel mai înalt nivel de angajament, reducere maximă (−0.55%)" }
];

const CA_DEFAULT = { "zero-seller": true, "seller": true, "both": true };

const TEST_SERVICES: Service[] = [
    { id: "s0", cat: "Listare & Promovare", nm: "Listare platforme principale", dc: "Storia, OLX, Imobiliare.ro, Publi24, Romimo", cost: 0, coef: 0, on: true, always: true, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s1", cat: "", nm: "Fotografii profesionale", dc: "20–30 cadre, post-procesare inclusă", cost: 300, coef: 0.15, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s2", cat: "", nm: "Tur virtual 360°", dc: "Vizualizare imersivă online pentru cumpărători la distanță", cost: 250, coef: 0.10, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s3", cat: "", nm: "Video walk-through / Reels", dc: "Prezentare video pentru social media și YouTube", cost: 350, coef: 0.15, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } }
];

// Calculation function representing the actual application logic
function calculateCommissions(
    propertyValue: number,
    activeModel: string,
    isExclusive: boolean,
    exclusivityPeriodDays: number,
    activeServiceIds: string[]
) {
    const model = TEST_MODELS[activeModel] || { nm: '', desc: '', sb: 0, bb: 0, pri: 'seller' };
    
    // Find active tier
    let activeTier = TEST_TIERS[TEST_TIERS.length - 1];
    for (const tier of TEST_TIERS) {
        if (propertyValue <= tier.max) {
            activeTier = tier;
            break;
        }
    }
    const tierFactor = activeTier.f;

    // Base commission adjusted by tier factor
    const baseSellerPercent = model.sb * tierFactor;
    const baseBuyerPercent = model.bb * tierFactor;

    // Exclusivity adjustment (direct addition to primary party, NOT factorized by tier)
    let exclusivityAdjustment = 0;
    if (isExclusive) {
        const period = TEST_PERIODS.find(p => p.d === exclusivityPeriodDays);
        if (period) {
            exclusivityAdjustment = period.c;
        }
    }

    // Services calculation
    let serviceCommissionPercentAddition = 0;
    let includedServicesCost = 0;
    let separateServicesCost = 0;

    const services = TEST_SERVICES.map(s => {
        const isSelected = s.always || activeServiceIds.includes(s.id);
        const isRegula1ForcedSeparate = !s.always && activeModel === 'zero-seller' && !isExclusive;
        const isConfigForcedSeparate = !s.always && s.commAvail && s.commAvail[activeModel] === false;
        
        let payMode = s.pay;
        if (s.always) payMode = 'commission';
        else if (isRegula1ForcedSeparate || isConfigForcedSeparate) payMode = 'separate';

        return { ...s, on: isSelected, pay: payMode };
    });

    services.forEach(s => {
        if (!s.on) return;

        if (s.pay === 'commission') {
            serviceCommissionPercentAddition += s.coef * tierFactor;
            includedServicesCost += s.cost;
        } else {
            separateServicesCost += s.cost;
        }
    });

    let finalSellerPercent = baseSellerPercent;
    let finalBuyerPercent = baseBuyerPercent;

    if (model.pri === 'buyer') {
        finalBuyerPercent = finalBuyerPercent + serviceCommissionPercentAddition + exclusivityAdjustment;
    } else {
        finalSellerPercent = finalSellerPercent + serviceCommissionPercentAddition + exclusivityAdjustment;
    }

    // Clamp to 0 and fix float precision
    finalSellerPercent = Math.max(0, Math.round(finalSellerPercent * 10000) / 10000);
    finalBuyerPercent = Math.max(0, Math.round(finalBuyerPercent * 10000) / 10000);

    const sellerCommissionEUR = Math.round((propertyValue * finalSellerPercent) / 100);
    const buyerCommissionEUR = Math.round((propertyValue * finalBuyerPercent) / 100);
    const totalCommissionEUR = sellerCommissionEUR + buyerCommissionEUR;
    const sellerTotalOutlayEUR = sellerCommissionEUR + separateServicesCost;

    return {
        tierFactor,
        activeTierLabel: activeTier.lbl,
        finalSellerPercent,
        finalBuyerPercent,
        sellerCommissionEUR,
        buyerCommissionEUR,
        totalCommissionEUR,
        separateServicesCost,
        sellerTotalOutlayEUR
    };
}

// Verification suite
function runTestSuite() {
    console.log('=== CALCULATOR COMMISSION MATHEMATICS VERIFICATION SUITE ===\n');

    let errors = 0;

    // Test case 1: Zero Seller, No Exclusivity, 120,000 EUR
    // Property value: 120,000 => Tier: 100.001-150.000, Factor: 0.90
    // Model: zero-seller => sb = 0, bb = 2.50. pri = 'buyer'.
    // Exclusivity: false
    // Active services: s1 (Photos), s2 (Virtual Tour).
    // Due to Zero Seller & No Exclusivity (Regula 1), s1 and s2 are forced to separate pay mode.
    // Therefore:
    // serviceCommissionPercentAddition = 0
    // exclusivityAdjustment = 0
    // finalSellerPercent = 0
    // finalBuyerPercent = 2.50 * 0.90 = 2.25%
    // sellerCommissionEUR = 0
    // buyerCommissionEUR = 120,000 * 2.25% = 2700 EUR
    // separateServicesCost = 300 (s1) + 250 (s2) = 550 EUR
    // sellerTotalOutlay = 0 + 550 = 550 EUR
    console.log('Test Case 1: Zero Seller, No Exclusivity, 120k EUR, Photos & Virtual Tour selected');
    const t1 = calculateCommissions(120000, 'zero-seller', false, 90, ['s1', 's2']);
    console.log(`- Tier factor: ${t1.tierFactor} (${t1.activeTierLabel})`);
    console.log(`- Final percentages: Seller ${t1.finalSellerPercent.toFixed(2)}%, Buyer ${t1.finalBuyerPercent.toFixed(2)}%`);
    console.log(`- Commission: Seller ${t1.sellerCommissionEUR}€, Buyer ${t1.buyerCommissionEUR}€`);
    console.log(`- Separate service costs: ${t1.separateServicesCost}€`);
    console.log(`- Seller total outlay: ${t1.sellerTotalOutlayEUR}€`);
    if (t1.finalSellerPercent !== 0 || t1.finalBuyerPercent !== 2.25) {
        console.error('❌ FAIL: Percentages do not match expected (Seller 0%, Buyer 2.25%)');
        errors++;
    } else if (t1.buyerCommissionEUR !== 2700) {
        console.error('❌ FAIL: Buyer Commission EUR does not match expected 2700€');
        errors++;
    } else if (t1.separateServicesCost !== 550) {
        console.error('❌ FAIL: Separate services cost does not match expected 550€');
        errors++;
    } else {
        console.log('✅ PASS\n');
    }

    // Test Case 2: Zero Seller, With Exclusivity (90 days), 120,000 EUR
    // Property value: 120,000 => Tier Factor: 0.90
    // Model: zero-seller => sb = 0, bb = 2.50. pri = 'buyer'.
    // Exclusivity: true, 90 days => adjustment: -0.20% (added directly to primary party, i.e., buyer)
    // Active services: s1 (Photos), s2 (Virtual tour) -> since exclusivity is ON, payMode defaults to commission.
    // Therefore:
    // serviceCommissionPercentAddition = (0.15 + 0.10) * 0.90 = 0.225%
    // exclusivityAdjustment = -0.20%
    // finalBuyerPercent = (2.50 * 0.90) + 0.225 - 0.20 = 2.25 + 0.225 - 0.20 = 2.275%
    // finalSellerPercent = 0%
    // buyerCommissionEUR = Math.round(120,000 * 2.275%) = 2730 EUR
    // separateServicesCost = 0
    // sellerTotalOutlay = 0
    console.log('Test Case 2: Zero Seller, Exclusivity (90d), 120k EUR, Photos & Virtual Tour selected');
    const t2 = calculateCommissions(120000, 'zero-seller', true, 90, ['s1', 's2']);
    console.log(`- Final percentages: Seller ${t2.finalSellerPercent.toFixed(3)}%, Buyer ${t2.finalBuyerPercent.toFixed(3)}%`);
    console.log(`- Commission: Seller ${t2.sellerCommissionEUR}€, Buyer ${t2.buyerCommissionEUR}€`);
    console.log(`- Separate service costs: ${t2.separateServicesCost}€`);
    if (t2.finalBuyerPercent !== 2.275) {
        console.error(`❌ FAIL: Buyer percentage does not match expected 2.275% (got ${t2.finalBuyerPercent}%)`);
        errors++;
    } else if (t2.buyerCommissionEUR !== 2730) {
        console.error(`❌ FAIL: Buyer commission EUR does not match expected 2730€ (got ${t2.buyerCommissionEUR}€)`);
        errors++;
    } else {
        console.log('✅ PASS\n');
    }

    // Test Case 3: Seller Commission Model, Exclusivity (180 days), 350,000 EUR
    // Property value: 350,000 => Tier: 300.001–350.000€, Factor: 0.70
    // Model: seller => sb = 2.00, bb = 0. pri = 'seller'
    // Exclusivity: true, 180 days => adjustment: -0.35%
    // Active services: s1 (Photos), s3 (Video/Reels) -> payMode defaults to commission.
    // serviceCommissionPercentAddition = (0.15 + 0.15) * 0.70 = 0.21%
    // finalSellerPercent = (2.00 * 0.70) + 0.21 - 0.35 = 1.40 + 0.21 - 0.35 = 1.26%
    // finalBuyerPercent = 0%
    // sellerCommissionEUR = Math.round(350,000 * 1.26%) = 4410 EUR
    // separateServicesCost = 0
    // sellerTotalOutlay = 4410 EUR
    console.log('Test Case 3: Seller Model, Exclusivity (180d), 350k EUR, Photos & Video selected');
    const t3 = calculateCommissions(350000, 'seller', true, 180, ['s1', 's3']);
    console.log(`- Final percentages: Seller ${t3.finalSellerPercent.toFixed(3)}%, Buyer ${t3.finalBuyerPercent.toFixed(3)}%`);
    console.log(`- Commission: Seller ${t3.sellerCommissionEUR}€, Buyer ${t3.buyerCommissionEUR}€`);
    if (t3.finalSellerPercent !== 1.26) {
        console.error(`❌ FAIL: Seller percentage does not match expected 1.26% (got ${t3.finalSellerPercent}%)`);
        errors++;
    } else if (t3.sellerCommissionEUR !== 4410) {
        console.error(`❌ FAIL: Seller commission EUR does not match expected 4410€ (got ${t3.sellerCommissionEUR}€)`);
        errors++;
    } else {
        console.log('✅ PASS\n');
    }

    // Test Case 4: Math Clamp (Regula 6)
    // Both parts equal, Exclusivity (360 days) => c = -0.55%
    // Let's set commission sb = 1.50%. At very high value tier (>2,000,000 EUR), f = 0.11
    // Base seller percent = 1.50 * 0.11 = 0.165%
    // Exclusivity adjustment = -0.55%
    // No services.
    // finalSellerPercent = 0.165 - 0.55 = -0.385%
    // With clamp: finalSellerPercent = Math.max(0, -0.385%) = 0%
    console.log('Test Case 4: Clamping negative values (Regula 6)');
    const t4 = calculateCommissions(2500000, 'both', true, 360, []);
    console.log(`- Final percentages: Seller ${t4.finalSellerPercent.toFixed(3)}%, Buyer ${t4.finalBuyerPercent.toFixed(3)}%`);
    if (t4.finalSellerPercent !== 0) {
        console.error(`❌ FAIL: Seller percentage not clamped to 0% (got ${t4.finalSellerPercent}%)`);
        errors++;
    } else {
        console.log('✅ PASS\n');
    }

    if (errors === 0) {
        console.log('🎉 ALL MATHEMATICAL ASSERTIONS PASSED SUCCESSFULLY!');
        process.exit(0);
    } else {
        console.error(`💥 TEST SUITE FAILED WITH ${errors} ERRORS.`);
        process.exit(1);
    }
}

runTestSuite();
