'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Coins, 
    ArrowLeft, 
    CreditCard, 
    Info, 
    Building, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Check, 
    AlertTriangle,
    ShieldCheck,
    Gift,
    Award,
    Copy,
    Share2
} from 'lucide-react';
import Link from 'next/link';
import ShareModal from '@/app/components/ShareModal';
import { 
    createPendingPurchase, 
    cancelPendingPurchase, 
    getCompanyBankDetails, 
    getActivePendingPurchase, 
    getUserPurchases 
} from '@/app/lib/actions/credit-purchases';
import { getReferralStats } from '@/app/lib/actions/referrals';
import { getUserCredits, getUserCreditTransactions } from '@/app/lib/actions/credits';
import { copyToClipboardSafe } from '@/app/lib/utils/clipboard';

const PACKAGES = [
    { credits: 50, price: 50, name: 'Pachet Mic' },
    { credits: 100, price: 100, name: 'Pachet Standard' },
    { credits: 250, price: 250, name: 'Pachet Popular', popular: true },
    { credits: 500, price: 500, name: 'Pachet VIP' },
];

export default function PlatiPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);

    const [userCredits, setUserCredits] = useState(0);
    const [referralBonusText, setReferralBonusText] = useState('');
    const [companyBank, setCompanyBank] = useState({ name: '', iban: '' });
    const [activePurchase, setActivePurchase] = useState<any | null>(null);
    const [purchasesLog, setPurchasesLog] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [referralLink, setReferralLink] = useState('');
    const [referralSettings, setReferralSettings] = useState<any>({
        referrer_bonus: 15,
        invitee_bonus: 10,
        commission_percentage: 10
    });
    const [totalCommissions, setTotalCommissions] = useState(0);
    const [copied, setCopied] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [customCredits, setCustomCredits] = useState<number | ''>(100);
    const [userId, setUserId] = useState('');

    const displayReferralLink = referralLink || (userId && typeof window !== 'undefined'
        ? `${window.location.origin}/auth/signup?ref=${userId}`
        : '');

    const copyFieldText = async (text: string, fieldName: string) => {
        if (!text) return;
        const success = await copyToClipboardSafe(text);
        if (success) {
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        }
    };

    const loadData = async () => {
        setLoading(true);
        const [creditsRes, bankRes, activeRes, logRes, refRes, transactionRes] = await Promise.all([
            getUserCredits(),
            getCompanyBankDetails(),
            getActivePendingPurchase(),
            getUserPurchases(),
            getReferralStats(),
            getUserCreditTransactions()
        ]);

        if (creditsRes && 'credits' in creditsRes) {
            setUserCredits(creditsRes.credits || 0);
        }

        if (bankRes) {
            setCompanyBank(bankRes);
        }

        if (activeRes && 'purchase' in activeRes) {
            setActivePurchase(activeRes.purchase);
        }

        if (logRes && 'purchases' in logRes) {
            setPurchasesLog(logRes.purchases || []);
        }

        if (transactionRes && 'transactions' in transactionRes) {
            setTransactions(transactionRes.transactions || []);
        }

        if (refRes && 'referralLink' in refRes) {
            setReferralLink(refRes.referralLink || '');
            setTotalCommissions(refRes.totalCommissionsEarned || 0);
            if (refRes.userId) {
                setUserId(refRes.userId);
            }
            if (refRes.settings) {
                const settings = refRes.settings;
                setReferralSettings(settings);
                setReferralBonusText(`Primești ${settings.referrer_bonus} credite cadou pentru fiecare prieten invitat + ${settings.commission_percentage}% comision din creditele consumate de ei.`);
            }
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData();

        const handleFocus = () => {
            loadData();
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, []);

    const handleInitiatePurchase = (pack: any) => {
        setSelectedPackage(pack);
        setErrorMessage(null);
    };

    const handleConfirmPurchase = () => {
        if (!selectedPackage) return;
        setErrorMessage(null);
        startTransition(async () => {
            const res = await createPendingPurchase(selectedPackage.price, selectedPackage.credits);
            if (res.error) {
                setErrorMessage(res.error);
                if (res.existing) {
                    // Load data again to sync pending order
                    loadData();
                }
            } else {
                setSelectedPackage(null);
                loadData();
            }
        });
    };

    const handleCancelPurchase = (id: string) => {
        if (!confirm('Sigur doriți să anulați această cerere de plată?')) return;
        setErrorMessage(null);
        startTransition(async () => {
            const res = await cancelPendingPurchase(id);
            if (res.error) {
                setErrorMessage(res.error);
            } else {
                loadData();
            }
        });
    };

    const copyToClipboard = async () => {
        const linkToCopy = displayReferralLink;
        if (!linkToCopy) return;
        const success = await copyToClipboardSafe(linkToCopy);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShareClick = async () => {
        const shareUrl = displayReferralLink;
        if (!shareUrl) return;
        const customText = 'Imobum.com, platforma imobiliară inteligentă. Înregistrează-te folosind acest link și primești credite cadou pentru a testa instrumentele AI';

        if (typeof navigator !== 'undefined' && 'share' in navigator) {
            try {
                await navigator.share({
                    title: 'Bună! Te invit pe Imobum.com',
                    text: customText,
                    url: shareUrl,
                });
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing native:', error);
                    setIsShareOpen(true);
                }
            }
        } else {
            setIsShareOpen(true);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
                <div className="flex flex-col items-center gap-3">
                    <Clock className="w-8 h-8 text-yellow-500 animate-spin" />
                    <span>Se încarcă detaliile de plată...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Back Navigation */}
                <div className="flex items-center justify-between">
                    <Link 
                        href="/cont/profil" 
                        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Înapoi la Profil
                    </Link>
                    <Link
                        href="/dashboard"
                        className="text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Panou de Control
                    </Link>
                </div>

                {/* Main Hero Card */}
                <header className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold tracking-tight">Portal Alimentare Credite</h1>
                        <p className="text-slate-400 text-sm max-w-md">
                            Cumpără credite pentru a folosi instrumentele AI și featurile avansate ale platformei Imobum.
                        </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shrink-0 shadow-inner">
                        <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500">
                            <Coins className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Credite Disponibile</div>
                            <div className="text-2xl font-black text-yellow-500 font-mono">{userCredits}</div>
                        </div>
                    </div>
                </header>

                {/* Referral Program Banner */}
                {referralBonusText && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 text-xs flex items-start gap-3">
                        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <p>{referralBonusText}</p>
                    </div>
                )}

                {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-xs flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p>{errorMessage}</p>
                    </div>
                )}

                {/* Core Purchase / Active Payment Flow */}
                {activePurchase ? (
                    // Active Bank Transfer Box
                    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                            <Clock className="w-6 h-6 text-orange-400 animate-pulse" />
                            <div>
                                <h2 className="text-lg font-bold text-white">Plată în așteptare de validare</h2>
                                <p className="text-xs text-slate-400">Te rugăm să finalizezi transferul bancar.</p>
                            </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Sumă de plată:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-white text-base">{activePurchase.amount_ron} RON</span>
                                    <button
                                        onClick={() => copyFieldText(activePurchase.amount_ron.toString(), 'amount')}
                                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900 transition-colors"
                                        title="Copiază suma"
                                    >
                                        {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Credite de primit:</span>
                                <span className="font-extrabold text-yellow-500 flex items-center gap-1.5"><Coins className="w-4 h-4" /> {activePurchase.credits}</span>
                            </div>

                            <hr className="border-slate-800" />

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Nume Beneficiar</label>
                                    <div className="text-sm font-semibold text-white bg-slate-900 border border-slate-800/80 px-3 py-2 rounded-lg flex items-center justify-between">
                                        <span>{companyBank.name}</span>
                                        <button
                                            onClick={() => copyFieldText(companyBank.name, 'name')}
                                            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-950 transition-colors animate-pulse-subtle"
                                            title="Copiază nume beneficiar"
                                        >
                                            {copiedField === 'name' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Cont IBAN</label>
                                    <div className="text-sm font-mono font-bold text-white bg-slate-900 border border-slate-800/80 px-3 py-2 rounded-lg flex items-center justify-between">
                                        <span>{companyBank.iban}</span>
                                        <button
                                            onClick={() => copyFieldText(companyBank.iban, 'iban')}
                                            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-950 transition-colors"
                                            title="Copiază IBAN"
                                        >
                                            {copiedField === 'iban' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg animate-pulse-subtle">
                                    <label className="block text-[10px] uppercase font-bold text-orange-400 tracking-wider mb-1">Detalii plată / Referință (FOARTE IMPORTANT)</label>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-base font-mono font-black text-orange-400 select-all">
                                            {activePurchase.reference_id}
                                        </div>
                                        <button
                                            onClick={() => copyFieldText(activePurchase.reference_id, 'ref')}
                                            className="text-orange-400 hover:text-white bg-orange-500/20 hover:bg-orange-500/30 p-1.5 rounded-lg border border-orange-500/30 transition-all shrink-0 shadow-sm"
                                            title="Copiază codul de referință"
                                        >
                                            {copiedField === 'ref' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1.5">
                                        Menționează codul exact de mai sus la detaliile plății în aplicația ta de banking pentru a putea asocia plata contului tău.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                            <button
                                disabled={isPending}
                                className="w-full sm:flex-1 bg-emerald-500 text-black font-extrabold py-3 px-6 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10"
                                onClick={() => alert('Plata dvs. este în curs de verificare în extrasul bancar. Adminul o va aproba în curând.')}
                            >
                                <Check className="w-4 h-4" />
                                AM EFECTUAT PLATA (ÎN AȘTEPTARE)
                            </button>
                            <button
                                disabled={isPending}
                                onClick={() => handleCancelPurchase(activePurchase.id)}
                                className="w-full sm:w-auto bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-red-400 text-slate-300 font-bold py-3 px-6 rounded-xl text-sm transition-all"
                            >
                                ANULEAZĂ CEREREA
                            </button>
                        </div>

                        <div className="bg-slate-950 border border-slate-900/50 p-4 rounded-xl flex gap-3 text-xs text-slate-400">
                            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                            <p>
                                După ce efectuezi transferul bancar, adminul va verifica extrasul de cont și va aproba tranzacția. Creditele vor fi adăugate imediat în balanță.
                            </p>
                        </div>
                    </section>
                ) : selectedPackage ? (
                    // Package Confirmation Panel
                    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                        <div className="border-b border-slate-800 pb-4">
                            <h2 className="text-lg font-bold text-white">Confirmare alimentare: {selectedPackage.name}</h2>
                            <p className="text-xs text-slate-400">Confirmă comanda pentru a obține codul de transfer.</p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <Coins className="w-5 h-5 text-yellow-500" />
                                <span className="font-semibold">{selectedPackage.credits} Credite</span>
                            </div>
                            <span className="font-extrabold text-white">{selectedPackage.price} RON</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                disabled={isPending}
                                onClick={handleConfirmPurchase}
                                className="flex-1 bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-400 hover:to-emerald-500 text-white font-extrabold py-3 px-6 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/10"
                            >
                                {isPending ? 'Se generează...' : 'GENEREAZĂ DETALII TRANSFER'}
                            </button>
                            <button
                                disabled={isPending}
                                onClick={() => setSelectedPackage(null)}
                                className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 font-bold py-3 px-6 rounded-xl text-sm transition-all"
                            >
                                Renunță
                            </button>
                        </div>
                    </section>
                ) : (
                    // Packages Selection Grid
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-orange-400" />
                            Alege un pachet de credite
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {PACKAGES.map((pack) => (
                                <div 
                                    key={pack.credits}
                                    className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all relative ${
                                        pack.popular 
                                            ? 'border-yellow-500 shadow-xl shadow-yellow-500/5 hover:-translate-y-1' 
                                            : 'border-slate-800 hover:border-slate-700 hover:-translate-y-0.5'
                                    }`}
                                >
                                    {pack.popular && (
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                            Recomandat
                                        </span>
                                    )}
                                    <div className="space-y-1">
                                        <div className="text-xs text-slate-500 font-bold uppercase">{pack.name}</div>
                                        <div className="text-3xl font-black text-white flex items-baseline gap-1 font-mono">
                                            {pack.credits}
                                            <span className="text-xs text-yellow-500 font-bold">CR</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="text-sm font-semibold text-slate-300">
                                            {pack.price} RON
                                        </div>
                                        <button
                                            onClick={() => handleInitiatePurchase(pack)}
                                            className={`w-full font-bold py-2 rounded-xl text-xs transition-colors ${
                                                pack.popular 
                                                    ? 'bg-yellow-500 hover:bg-yellow-400 text-black' 
                                                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                                            }`}
                                        >
                                            Cumpără Pachet
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Custom Credit Amount Card */}
                            <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all hover:-translate-y-0.5 relative">
                                <div className="space-y-1">
                                    <div className="text-xs text-slate-500 font-bold uppercase">Pachet Custom</div>
                                    <div className="text-3xl font-black text-white flex items-baseline gap-1 font-mono">
                                        Custom
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="10"
                                            max="50000"
                                            value={customCredits}
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value));
                                                setCustomCredits(val);
                                            }}
                                            placeholder="Introdu credite"
                                            className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-3 pr-8 py-2 text-xs font-mono text-white outline-none focus:border-yellow-500 transition-colors"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-yellow-500 font-bold">CR</span>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-300">
                                        {customCredits || 0} RON
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!customCredits || customCredits < 10) {
                                                alert('Suma minimă este de 10 credite.');
                                                return;
                                            }
                                            handleInitiatePurchase({
                                                credits: customCredits,
                                                price: customCredits,
                                                name: `Pachet Custom`
                                            });
                                        }}
                                        className="w-full font-bold py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
                                    >
                                        Cumpără Custom
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Vrei credite gratuite? / Referral section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Gift className="w-5 h-5 text-emerald-400" />
                        Vrei credite gratuite?
                    </h2>
                    
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                        
                        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                            <div>
                                <h3 className="text-base font-bold text-white">Sistemul de Recomandare</h3>
                                <p className="text-xs text-slate-400">Invită prieteni și câștigați credite împreună.</p>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs text-emerald-400 font-bold shrink-0 self-start sm:self-auto">
                                <Award className="w-4 h-4" />
                                {totalCommissions} CR câștigate din recomandări
                            </div>
                        </header>

                        {/* Program description */}
                        <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-5 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cum funcționează?</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div className="space-y-1">
                                    <div className="text-emerald-400 font-extrabold">1. Trimite link-ul</div>
                                    <p className="text-slate-400">Prietenul tău folosește link-ul tău unic pentru a se înregistra pe platforma Imobum.</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-emerald-400 font-extrabold">2. Primiți credite cadou</div>
                                    <p className="text-slate-400">El primește <span className="font-bold text-white">{referralSettings.invitee_bonus} credite</span> iar tu primești <span className="font-bold text-white">{referralSettings.referrer_bonus} credite</span> instant.</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-emerald-400 font-extrabold">3. Comision permanent</div>
                                    <p className="text-slate-400">Primești <span className="font-bold text-white">{referralSettings.commission_percentage}% comision</span> din toate creditele consumate de el.</p>
                                </div>
                            </div>
                        </div>

                        {/* Invitation link generator */}
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Link-ul tău de invitație</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input 
                                    type="text" 
                                    value={displayReferralLink} 
                                    readOnly
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-slate-300 focus:border-emerald-500 outline-none select-all"
                                />
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={copyToClipboard}
                                        className="flex-1 sm:flex-initial bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs min-w-[100px]"
                                        title="Copiază link-ul"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                        {copied ? 'Copiat!' : 'Copiază'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleShareClick}
                                        className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs min-w-[100px]"
                                        title="Trimite invitație"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Trimite
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Purchase Log / Orders History */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Coins className="w-5 h-5 text-emerald-400" />
                        Istoricul tranzacțiilor tale
                    </h2>

                    {transactions.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">Nu ai nicio tranzacție de credit înregistrată încă.</p>
                    ) : (
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
                            <div className="divide-y divide-slate-800/50">
                                {transactions.map((tx) => {
                                    const isPositive = tx.amount > 0;
                                    return (
                                        <div key={tx.id} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="font-semibold text-white text-xs sm:text-sm">
                                                        {tx.description || 'Tranzacție credite'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                        {new Date(tx.created_at).toLocaleString('ro-RO')}
                                                    </span>
                                                </div>
                                                {tx.metadata?.reference_id && (
                                                    <div className="text-[10px] text-slate-500 font-mono">
                                                        Ref: {tx.metadata.reference_id}
                                                    </div>
                                                )}
                                            </div>

                                            <div className={`font-mono font-bold text-sm ${isPositive ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                {isPositive ? `+${tx.amount}` : tx.amount} CR
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>
            </div>
            <ShareModal 
                isOpen={isShareOpen} 
                onClose={() => setIsShareOpen(false)} 
                shareUrl={displayReferralLink} 
            />
        </div>
    );
}
