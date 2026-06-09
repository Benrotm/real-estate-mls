'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    User, 
    Phone, 
    Mail, 
    Coins, 
    Share2, 
    Copy, 
    Check, 
    History, 
    MessageSquare, 
    Heart, 
    UploadCloud, 
    Shield, 
    Briefcase, 
    Save, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    Users, 
    LogOut,
    ArrowLeft,
    TrendingUp,
    Gift,
    Award
} from 'lucide-react';
import { getCurrentProfile, updateUserProfile } from '@/app/lib/actions/user';
import { getReferralStats, checkAndProcessReferral } from '@/app/lib/actions/referrals';
import { getUserCreditTransactions } from '@/app/lib/actions/credits';
import AvatarUpload from '@/app/components/AvatarUpload';
import { copyToClipboardSafe } from '@/app/lib/utils/clipboard';
import ShareModal from '@/app/components/ShareModal';

export default function ProfilPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    // Profile state
    const [profile, setProfile] = useState<any | null>(null);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Referral state
    const [referralLink, setReferralLink] = useState('');
    const [invitees, setInvitees] = useState<any[]>([]);
    const [totalCommissions, setTotalCommissions] = useState(0);
    const [referralSettings, setReferralSettings] = useState<any>({
        referrer_bonus: 15,
        invitee_bonus: 10,
        commission_percentage: 10
    });

    // Transaction state
    const [transactions, setTransactions] = useState<any[]>([]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // 1. Process any pending signup referrals first
            await checkAndProcessReferral();

            // 2. Fetch Profile, Referrals and Transactions
            const [profileRes, referralRes, transactionRes] = await Promise.all([
                getCurrentProfile(),
                getReferralStats(),
                getUserCreditTransactions()
            ]);

            if (profileRes && 'profile' in profileRes && profileRes.profile) {
                setProfile(profileRes.profile);
                setFullName(profileRes.profile.full_name || '');
                setPhone(profileRes.profile.phone || '');
            } else if (profileRes && 'error' in profileRes) {
                console.error('Error fetching profile:', profileRes.error);
                router.push('/auth/login');
                return;
            }

            if (referralRes && 'referralLink' in referralRes) {
                setReferralLink(referralRes.referralLink || '');
                setInvitees(referralRes.invitees || []);
                setTotalCommissions(referralRes.totalCommissionsEarned || 0);
                if (referralRes.settings) {
                    setReferralSettings(referralRes.settings);
                }
            }

            if (transactionRes && 'transactions' in transactionRes) {
                setTransactions(transactionRes.transactions || []);
            }
        } catch (error) {
            console.error('Error loading profile page data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setUpdateStatus('idle');
        setErrorMessage('');
        
        startTransition(async () => {
            const res = await updateUserProfile({ full_name: fullName, phone });
            if (res.success) {
                setUpdateStatus('success');
                // Reload profile details
                const profileRes = await getCurrentProfile();
                if (profileRes && 'profile' in profileRes && profileRes.profile) {
                    setProfile(profileRes.profile);
                }
                setTimeout(() => setUpdateStatus('idle'), 3000);
            } else {
                setUpdateStatus('error');
                setErrorMessage(res.error || 'Eroare la actualizarea profilului');
            }
        });
    };

    const displayReferralLink = referralLink || (profile?.id && typeof window !== 'undefined'
        ? `${window.location.origin}/auth/signup?ref=${profile.id}`
        : '');

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
        const customText = 'Bună! Te invit pe Imobum, platforma imobiliară inteligentă. Înregistrează-te folosind link-ul meu și primești credite cadou pentru a testa instrumentele AI:';

        if (typeof navigator !== 'undefined' && 'share' in navigator) {
            try {
                await navigator.share({
                    title: 'Invitație Imobum',
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
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    <span>Se încarcă datele profilului...</span>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    const role = profile.role || 'client';
    const planTier = profile.plan_tier || 'free';

    // Formulate correct URLs based on role
    const chatUrl = `/dashboard/${role}/chat`;
    const favoritesUrl = `/dashboard/${role}/favorites`;
    const importUrl = role === 'admin' || role === 'super_admin' ? '/dashboard/admin/properties/import' : null;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header / Quick Tabs */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                            <User className="w-8 h-8 text-orange-500" />
                            Profilul Meu
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm">
                            Gestionează datele de cont, creditele, recomandările și tranzacțiile tale.
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="flex flex-wrap items-center gap-2 bg-slate-900/80 border border-slate-800 p-1.5 rounded-xl text-xs sm:text-sm">
                        <Link 
                            href="/dashboard"
                            className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Dashboard
                        </Link>
                        <span className="w-px h-5 bg-slate-800" />
                        <Link 
                            href={chatUrl}
                            className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <MessageSquare className="w-4 h-4 text-emerald-400" />
                            Mesaje
                        </Link>
                        <Link 
                            href={favoritesUrl}
                            className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <Heart className="w-4 h-4 text-red-400" />
                            Salvate
                        </Link>
                        {importUrl && (
                            <Link 
                                href={importUrl}
                                className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                <UploadCloud className="w-4 h-4 text-indigo-400" />
                                Import API
                            </Link>
                        )}
                        <span className="w-px h-5 bg-slate-800" />
                        <Link
                            href="/cont/plati"
                            className="bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-500 font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <Coins className="w-4 h-4 animate-pulse" />
                            Alimentează Credite
                        </Link>
                    </nav>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Avatar, Profile Info Form, Credits Summary */}
                    <div className="lg:col-span-1 space-y-8">
                        
                        {/* Avatar & Badges */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="flex justify-center">
                                <AvatarUpload 
                                    userId={profile.id}
                                    currentAvatarUrl={profile.avatar_url}
                                    fullName={profile.full_name}
                                />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-bold text-white">{profile.full_name || 'Utilizator'}</h2>
                                <p className="text-xs text-slate-400 font-mono select-all">{profile.id}</p>
                            </div>
                            <div className="flex items-center justify-center gap-2 pt-2">
                                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                    {role}
                                </span>
                                <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-xs font-bold text-orange-400 uppercase tracking-wider">
                                    Plan {planTier}
                                </span>
                            </div>
                        </div>

                        {/* Credits Balance Card */}
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-500" />
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <Coins className="w-5 h-5 text-yellow-500 animate-pulse" />
                                    Credite Imobum
                                </h3>
                                <span className="text-[10px] text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-medium">1 credit = 1 RON</span>
                            </div>

                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-inner">
                                <div className="text-3xl font-black text-yellow-500 font-mono flex-1">
                                    {profile.credits || 0}
                                </div>
                                <Link 
                                    href="/cont/plati"
                                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-yellow-500/10"
                                >
                                    Cumpără Credite
                                </Link>
                            </div>
                        </div>

                        {/* Profile Info Form */}
                        <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                                <User className="w-4 h-4 text-orange-400" />
                                Date Personale
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nume Complet</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                        <input 
                                            type="text" 
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Numele tău complet"
                                            required
                                            className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-orange-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Număr de Telefon</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                        <input 
                                            type="tel" 
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="ex. +40 7xx xxx xxx"
                                            className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-orange-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Adresă de Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                                        <input 
                                            type="email" 
                                            value={profile.email || ''}
                                            disabled
                                            className="w-full bg-slate-950/60 border border-slate-850 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic">Email-ul nu poate fi schimbat din motive de securitate.</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-400 hover:to-emerald-500 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isPending ? 'Se salvează...' : 'Salvează Datele'}
                                </button>

                                {updateStatus === 'success' && (
                                    <div className="mt-3 flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-xs font-semibold animate-fade-in">
                                        <CheckCircle2 className="w-4 h-4" /> Datele au fost actualizate!
                                    </div>
                                )}

                                {updateStatus === 'error' && (
                                    <div className="mt-3 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs font-semibold animate-fade-in">
                                        <AlertCircle className="w-4 h-4" /> {errorMessage}
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Referral System & Credit Transactions */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Referral widget */}
                        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                            
                            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <Gift className="w-6 h-6 text-emerald-400" />
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Sistemul de Recomandare</h3>
                                        <p className="text-xs text-slate-400">Invită prieteni și câștigați credite împreună.</p>
                                    </div>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                                    <Award className="w-4 h-4 animate-bounce" />
                                    {totalCommissions} CR câștigate din comisioane
                                </div>
                            </header>

                            {/* Program description */}
                            <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-5 space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cum funcționează?</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                    <div className="space-y-1">
                                        <div className="text-emerald-400 font-extrabold">1. Trimite link-ul tău</div>
                                        <p className="text-slate-400">Prietenu tău folosește link-ul tău unic de recomandare pentru a se înregistra pe Imobum.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-emerald-400 font-extrabold">2. Primiți credite cadou</div>
                                        <p className="text-slate-400">Prietenul primește <span className="font-bold text-white">{referralSettings.invitee_bonus} credite</span> iar tu primești <span className="font-bold text-white">{referralSettings.referrer_bonus} credite</span> imediat.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-emerald-400 font-extrabold">3. Comision permanent</div>
                                        <p className="text-slate-400">Câștigi un comision de <span className="font-bold text-white">{referralSettings.commission_percentage}%</span> din fiecare credit consumat de el pe viață.</p>
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
                                            title="Trimite link-ul"
                                        >
                                            <Share2 className="w-4 h-4" />
                                            Trimite
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Invitees Stats */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-emerald-400" />
                                    Prieteni înregistrați ({invitees.length})
                                </h4>

                                {invitees.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic p-4 bg-slate-950/30 border border-slate-850 rounded-xl text-center">
                                        Nu ai invitat niciun prieten încă. Trimite link-ul de mai sus pentru a începe!
                                    </p>
                                ) : (
                                    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner max-h-60 overflow-y-auto">
                                        <table className="w-full text-left text-xs text-slate-300">
                                            <thead className="bg-slate-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-850">
                                                <tr>
                                                    <th className="px-4 py-3">Prieten</th>
                                                    <th className="px-4 py-3">Înregistrat</th>
                                                    <th className="px-4 py-3 text-right">Credite Consumate</th>
                                                    <th className="px-4 py-3 text-right">Comision Câștigat</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-850/50">
                                                {invitees.map((invitee) => (
                                                    <tr key={invitee.id} className="hover:bg-slate-900/40 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-white">{invitee.name}</div>
                                                            <div className="text-[10px] text-slate-500">{invitee.email}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-400">
                                                            {new Date(invitee.registeredAt).toLocaleDateString('ro-RO')}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-400">
                                                            {invitee.creditsConsumed} CR
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                                                            +{invitee.commissionEarned} CR
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Credit Transactions log */}
                        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
                            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-slate-800 pb-3">
                                <History className="w-5 h-5 text-yellow-500" />
                                Istoric Credite și Consum
                            </h3>

                            {transactions.length === 0 ? (
                                <p className="text-xs text-slate-500 italic p-4 text-center">Nu există tranzacții cu credite înregistrate pe acest cont.</p>
                            ) : (
                                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto shadow-inner">
                                    <div className="divide-y divide-slate-850/50">
                                        {transactions.map((tx) => {
                                            const isPositive = tx.amount > 0;
                                            return (
                                                <div key={tx.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors text-xs">
                                                    <div className="space-y-1">
                                                        <div className="font-semibold text-white">
                                                            {tx.description || 'Tranzacție credite'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">
                                                            {new Date(tx.created_at).toLocaleString('ro-RO')}
                                                        </div>
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
                </div>
            </div>
            <ShareModal 
                isOpen={isShareOpen} 
                onClose={() => setIsShareOpen(false)} 
                shareUrl={displayReferralLink} 
            />
        </div>
    );
}
