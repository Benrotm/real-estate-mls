'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Coins, 
    Save, 
    CheckCircle2, 
    MessageSquare, 
    Clock, 
    CreditCard, 
    Building, 
    AlertCircle,
    ArrowLeftRight,
    Search,
    UserCheck
} from 'lucide-react';
import { 
    getPendingPurchases, 
    getApprovedPurchasesHistory, 
    approvePurchase, 
    getCompanyBankDetails, 
    updateCompanyBankDetails 
} from '@/app/lib/actions/credit-purchases';
import { startConversationWithUser } from '@/app/lib/actions/chat';

export default function ValidarePlatiPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(true);

    // Bank details state
    const [bankName, setBankName] = useState('');
    const [bankIban, setBankIban] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Lists state
    const [pendingList, setPendingList] = useState<any[]>([]);
    const [historyList, setHistoryList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [approvingId, setApprovingId] = useState<string | null>(null);

    // Load all initial data
    const loadData = async () => {
        setLoadingData(true);
        const [bankRes, pendingRes, historyRes] = await Promise.all([
            getCompanyBankDetails(),
            getPendingPurchases(),
            getApprovedPurchasesHistory()
        ]);

        if (bankRes) {
            setBankName(bankRes.name);
            setBankIban(bankRes.iban);
        }

        if (pendingRes && 'purchases' in pendingRes) {
            setPendingList(pendingRes.purchases || []);
        }

        if (historyRes && 'purchases' in historyRes) {
            setHistoryList(historyRes.purchases || []);
        }
        setLoadingData(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Save company bank details
    const handleSaveBankDetails = () => {
        setSaveSuccess(false);
        startTransition(async () => {
            const res = await updateCompanyBankDetails(bankName, bankIban);
            if (res.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                alert('Eroare la salvarea datelor bancare: ' + res.error);
            }
        });
    };

    // Approve a user's manual payment
    const handleApprove = (purchaseId: string) => {
        if (!confirm('Sigur doriți să aprobați această plată? Creditele vor fi alocate utilizatorului imediat.')) return;
        
        setApprovingId(purchaseId);
        startTransition(async () => {
            const res = await approvePurchase(purchaseId);
            setApprovingId(null);
            if (res.success) {
                // Reload lists
                loadData();
            } else {
                alert('Eroare la aprobarea plății: ' + res.error);
            }
        });
    };

    // Chat with a user regarding a payment issue
    const handleChat = async (userId: string) => {
        try {
            const res = await startConversationWithUser(userId);
            if (res.error) {
                alert('Eroare chat: ' + res.error);
                return;
            }
            if (res.conversationId) {
                router.push(`/dashboard/admin/chat?id=${res.conversationId}`);
            }
        } catch (e: any) {
            alert('Eroare chat: ' + e.message);
        }
    };

    // Filter helper
    const filteredPending = pendingList.filter(item => {
        const query = searchTerm.toLowerCase();
        const ref = item.reference_id?.toLowerCase() || '';
        const name = item.profiles?.full_name?.toLowerCase() || '';
        const email = item.profiles?.email?.toLowerCase() || '';
        return ref.includes(query) || name.includes(query) || email.includes(query);
    });

    if (loadingData) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
                <div className="flex flex-col items-center gap-3">
                    <Clock className="w-8 h-8 text-orange-500 animate-spin" />
                    <span>Se încarcă datele de validare...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                            <UserCheck className="w-8 h-8 text-emerald-500" />
                            Aprobare Manuală Plăți & Credite
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm">
                            Validează tranzacțiile prin transfer bancar și editează datele contului colector de plăți.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm text-slate-300 font-medium">
                        <Coins className="w-4 h-4 text-yellow-500 animate-pulse" />
                        1 Credit = 1 RON
                    </div>
                </header>

                {/* Bank Configuration Panel */}
                <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-orange-500 to-emerald-500" />
                    <div className="flex items-center gap-2 mb-4">
                        <Building className="w-5 h-5 text-orange-400" />
                        <h2 className="text-lg font-bold text-white">Administrare Date Companie (Destinație Transfer)</h2>
                    </div>
                    <p className="text-xs text-slate-400 mb-6">
                        Utilizatorii vor vedea aceste date pe pagina lor de checkout pentru a efectua transferul bancar.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Nume Beneficiar (Firma)</label>
                            <input 
                                type="text"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="ex. THE BC ORIGINALS SRL"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">IBAN Beneficiar</label>
                            <input 
                                type="text"
                                value={bankIban}
                                onChange={(e) => setBankIban(e.target.value)}
                                placeholder="ex. RO12 INGB 0000 9999 1234 5678"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono focus:border-orange-500 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                        {saveSuccess ? (
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                                <CheckCircle2 className="w-4 h-4" /> Datele au fost salvate cu succes!
                            </span>
                        ) : <div />}
                        
                        <button
                            onClick={handleSaveBankDetails}
                            disabled={isPending}
                            className="bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-400 hover:to-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md shadow-orange-500/10 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {isPending ? 'Se salvează...' : 'Salvează Contul'}
                        </button>
                    </div>
                </section>

                {/* Pending Payments Grid */}
                <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                            <Clock className="w-5 h-5 text-orange-400" />
                            Plăți în așteptare ({pendingList.length})
                        </h2>
                        
                        {/* Search Input */}
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <input 
                                type="text"
                                placeholder="Caută după Ref ID, nume, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-orange-500 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {filteredPending.length === 0 ? (
                        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center text-slate-500">
                            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p>Nu există cereri de plată în așteptare care să corespundă căutării.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredPending.map((purchase) => (
                                <div 
                                    key={purchase.id} 
                                    className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700/60 transition-colors"
                                >
                                    {/* Purchase Details */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold font-mono px-3 py-1 rounded-lg">
                                                {purchase.reference_id}
                                            </span>
                                            <span className="text-slate-400 text-xs font-medium">
                                                Inițiat la: {new Date(purchase.created_at).toLocaleString('ro-RO')}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-white">
                                                {purchase.profiles?.full_name || 'Utilizator'}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Email: <span className="text-slate-300">{purchase.profiles?.email}</span> 
                                                {purchase.profiles?.phone && ` • Tel: ${purchase.profiles.phone}`}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Rol utilizator: <span className="uppercase text-orange-400/90 font-semibold text-[10px] bg-orange-400/10 px-1.5 py-0.5 rounded">{purchase.profiles?.role}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Value & Actions */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center md:justify-end gap-6 shrink-0">
                                        <div className="text-left sm:text-right">
                                            <div className="text-lg font-extrabold text-emerald-400 flex items-center gap-1.5">
                                                <Coins className="w-5 h-5 text-yellow-500" />
                                                +{purchase.credits} Credite
                                            </div>
                                            <div className="text-xs text-slate-400 font-semibold mt-0.5">
                                                Cost: {purchase.amount_ron} RON (1 credit = 1 lei)
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <button
                                                onClick={() => handleChat(purchase.user_id)}
                                                className="flex-1 sm:flex-none border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <MessageSquare className="w-4 h-4 text-slate-400" />
                                                MESAJ
                                            </button>
                                            <button
                                                onClick={() => handleApprove(purchase.id)}
                                                disabled={approvingId === purchase.id || isPending}
                                                className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                {approvingId === purchase.id ? 'SE APROBĂ...' : 'APROBĂ PLATA'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Approved Payments History */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
                        Istoric Tranzacții Aprobate (Ultimele 50)
                    </h2>

                    {historyList.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">Nu există plăți aprobate în istoric.</p>
                    ) : (
                        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-900 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4">Ref ID</th>
                                            <th className="px-6 py-4">Utilizator</th>
                                            <th className="px-6 py-4">Suma (RON)</th>
                                            <th className="px-6 py-4">Credite</th>
                                            <th className="px-6 py-4">Dată Aprobare</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {historyList.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-slate-300">
                                                    {item.reference_id}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-white">
                                                        {item.profiles?.full_name || 'Utilizator'}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {item.profiles?.email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-300">
                                                    {item.amount_ron} RON
                                                </td>
                                                <td className="px-6 py-4 font-bold text-emerald-400">
                                                    +{item.credits}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-400">
                                                    {item.completed_at ? new Date(item.completed_at).toLocaleString('ro-RO') : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
