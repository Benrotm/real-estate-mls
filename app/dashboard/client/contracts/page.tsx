'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    FileText, 
    Clock, 
    CheckCircle, 
    Printer, 
    X, 
    ShieldCheck, 
    AlertCircle, 
    ArrowLeft, 
    Loader2 
} from 'lucide-react';
import { getProposalContractsForClient, signProposalContract } from '@/app/lib/actions/contracts';
import { getCurrentProfile } from '@/app/lib/actions/user';

export default function ClientContractsPage() {
    const router = useRouter();
    const [contracts, setContracts] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [signingContract, setSigningContract] = useState<any | null>(null);
    const [viewingContract, setViewingContract] = useState<any | null>(null);

    // Form inputs for signature
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [cnp, setCnp] = useState('');
    const [idSeriesNumber, setIdSeriesNumber] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Toggle terms language in preview modal
    const [previewLang, setPreviewLang] = useState<'ro' | 'en'>('ro');

    useEffect(() => {
        async function loadData() {
            try {
                const [contractsData, profileRes] = await Promise.all([
                    getProposalContractsForClient(),
                    getCurrentProfile()
                ]);
                setContracts(contractsData);
                if (profileRes && 'profile' in profileRes) {
                    setProfile(profileRes.profile);
                    setFullName(profileRes.profile.full_name || '');
                    setPhone(profileRes.profile.phone || '');
                    setCnp(profileRes.profile.cnp || '');
                    setIdSeriesNumber(profileRes.profile.id_series_number || '');
                }
            } catch (err) {
                console.error('Failed to load contract details:', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleOpenSignModal = (contract: any) => {
        setSigningContract(contract);
        setAgreed(false);
        setPreviewLang(contract.language || 'ro');
        // Prefill inputs
        setFullName(contract.client_details?.fullName || profile?.full_name || '');
        setPhone(contract.client_details?.phone || profile?.phone || '');
        setCnp(contract.client_details?.cnp || profile?.cnp || '');
        setIdSeriesNumber(contract.client_details?.idSeriesNumber || profile?.id_series_number || '');
    };

    const handleOpenViewModal = (contract: any) => {
        setViewingContract(contract);
        setPreviewLang(contract.language || 'ro');
    };

    const handleSignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim() || !phone.trim() || !cnp.trim() || !idSeriesNumber.trim()) {
            alert('Toate câmpurile sunt obligatorii pentru semnare / All fields are required for signing.');
            return;
        }
        if (cnp.trim().length !== 13 || !/^\d+$/.test(cnp.trim())) {
            alert('CNP trebuie să aibă 13 cifre / CNP must be exactly 13 digits.');
            return;
        }
        if (!agreed) {
            alert('Trebuie să fiți de acord cu termenii contractului / You must agree to the terms.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await signProposalContract(signingContract.id, {
                fullName: fullName.trim(),
                phone: phone.trim(),
                cnp: cnp.trim(),
                idSeriesNumber: idSeriesNumber.trim()
            });

            if (res.success) {
                // Reload contracts
                const updated = await getProposalContractsForClient();
                setContracts(updated);
                setSigningContract(null);
                alert('Contractul a fost semnat cu succes! / Contract signed successfully!');
            } else {
                alert(`Eroare: ${res.error}`);
            }
        } catch (error: any) {
            console.error('Failed to sign contract:', error);
            alert(`Eroare la semnare: ${error.message || 'Eroare necunoscută'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = (contract: any) => {
        const printWindow = window.open('', '_blank', 'width=800,height=1000');
        if (!printWindow) {
            alert('Please allow popups to print the contract.');
            return;
        }

        const { contract_number, contract_serial, created_at, language, client_details, agent_details, property_details, status, signed_at } = contract;
        const dateStr = new Date(created_at).toLocaleDateString('ro-RO');
        const timeStr = new Date(created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
        const signedDateStr = signed_at ? new Date(signed_at).toLocaleString('ro-RO') : '';

        const isRo = previewLang === 'ro';

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${isRo ? 'Fișă de vizionare' : 'Viewing Contract'} - ${contract_serial} ${contract_number}</title>
            <style>
              body {
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: #1e293b;
                line-height: 1.5;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .title {
                font-size: 24px;
                font-weight: 700;
                color: #0f172a;
                text-transform: uppercase;
                margin: 0 0 10px 0;
                letter-spacing: 0.5px;
              }
              .subtitle {
                font-size: 14px;
                color: #64748b;
                margin: 0;
              }
              .section {
                margin-bottom: 25px;
              }
              .section-title {
                font-size: 14px;
                font-weight: 700;
                text-transform: uppercase;
                color: #475569;
                border-bottom: 1px solid #cbd5e1;
                padding-bottom: 5px;
                margin-bottom: 12px;
                letter-spacing: 0.5px;
              }
              .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
              }
              .field {
                margin-bottom: 8px;
                font-size: 13px;
              }
              .label {
                font-weight: 600;
                color: #475569;
                display: inline-block;
                width: 150px;
              }
              .value {
                color: #0f172a;
              }
              .property-box {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 15px;
                margin-top: 10px;
              }
              .terms {
                font-size: 12px;
                color: #334155;
                text-align: justify;
              }
              .terms ol {
                padding-left: 20px;
                margin: 8px 0;
              }
              .terms li {
                margin-bottom: 6px;
              }
              .signatures {
                margin-top: 50px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                text-align: center;
              }
              .sig-box {
                border-top: 1px dashed #cbd5e1;
                padding-top: 15px;
                height: 120px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              .sig-title {
                font-size: 13px;
                font-weight: 600;
                color: #475569;
              }
              .sig-placeholder {
                font-style: italic;
                color: #94a3b8;
                font-size: 12px;
              }
              .sig-signed {
                color: #16a34a;
                font-weight: 700;
                font-size: 12px;
                border: 2px solid #16a34a;
                padding: 6px;
                border-radius: 4px;
                display: inline-block;
                margin: 10px auto;
                text-transform: uppercase;
                letter-spacing: 1px;
                transform: rotate(-3deg);
              }
              .footer {
                margin-top: 60px;
                text-align: center;
                font-size: 11px;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
                padding-top: 15px;
              }
              @media print {
                body {
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">${isRo ? 'FIȘĂ DE VIZIONARE' : 'PROPERTY VIEWING SHEET'}</h1>
              <p class="subtitle">${isRo ? 'Seria' : 'Serial'} <strong>${contract_serial}</strong> ${isRo ? 'Nr.' : 'No.'} <strong>${contract_number}</strong> | ${isRo ? 'Data' : 'Date'}: ${dateStr} ${timeStr}</p>
            </div>

            <div class="section">
              <div class="section-title">${isRo ? '1. PĂRȚILE CONTRACTANTE' : '1. CONTRACTING PARTIES'}</div>
              <div class="grid">
                <div>
                  <p style="font-weight: bold; margin: 0 0 10px 0; font-size: 13px; color: #475569;">${isRo ? 'PRESTATOR / AGENȚIE' : 'PROVIDER / AGENCY'}</p>
                  <div class="field"><span class="label">${isRo ? 'Denumire:' : 'Company:'}</span><span class="value">${agent_details.companyName || '-'}</span></div>
                  <div class="field"><span class="label">${isRo ? 'C.U.I.:' : 'VAT / CUI:'}</span><span class="value">${agent_details.companyCui || '-'}</span></div>
                  <div class="field"><span class="label">${isRo ? 'Reg. Com.:' : 'Reg. Com.:'}</span><span class="value">${agent_details.companyRegCom || '-'}</span></div>
                  <div class="field"><span class="label">${isRo ? 'Sediu:' : 'Address:'}</span><span class="value">${agent_details.companyAddress || '-'}</span></div>
                  <div class="field"><span class="label">${isRo ? 'Agent:' : 'Agent:'}</span><span class="value">${agent_details.fullName || '-'}</span></div>
                  <div class="field"><span class="label">${isRo ? 'Telefon:' : 'Phone:'}</span><span class="value">${agent_details.phone || '-'}</span></div>
                </div>
                <div>
                  <p style="font-weight: bold; margin: 0 0 10px 0; font-size: 13px; color: #475569;">${isRo ? 'CLIENT' : 'CLIENT'}</p>
                  <div class="field"><span class="label">${isRo ? 'Nume Complet:' : 'Full Name:'}</span><span class="value">${client_details.fullName || '-'}</span></div>
                  <div class="field"><span class="label">${isRo ? 'Telefon:' : 'Phone:'}</span><span class="value">${client_details.phone || '-'}</span></div>
                  <div class="field"><span class="label">${isRo ? 'Email:' : 'Email:'}</span><span class="value">${client_details.email || '-'}</span></div>
                  <div class="field"><span class="label">${isRo ? 'C.N.P.:' : 'C.N.P. (ID No):'}</span><span class="value">${client_details.cnp || '-'}</span></div>
                  <div class="field"><span class="label">${isRo ? 'CI Seria/Nr:' : 'ID Series/Nr:'}</span><span class="value">${client_details.idSeriesNumber || '-'}</span></div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">${isRo ? '2. OBIECTUL PREZENTĂRII' : '2. SUBJECT OF THE PRESENTATION'}</div>
              <p style="font-size: 13px; margin: 0;">
                ${isRo 
                  ? 'Prestatorul a prezentat Clientului în vederea vizionării și cumpărării/închirierii următoarea proprietate din portofoliu:' 
                  : 'The Provider has presented to the Client for viewing and purchasing/renting the following property from its portfolio:'}
              </p>
              <div class="property-box">
                <div class="field"><span class="label">${isRo ? 'ID Proprietate:' : 'Property ID:'}</span><span class="value"><strong>${property_details.friendlyId || property_details.id}</strong></span></div>
                <div class="field"><span class="label">${isRo ? 'Denumire:' : 'Title:'}</span><span class="value">${property_details.title || '-'}</span></div>
                <div class="field"><span class="label">${isRo ? 'Locație/Adresă:' : 'Location/Address:'}</span><span class="value">${property_details.address || '-'}</span></div>
                <div class="field"><span class="label">${isRo ? 'Specificații:' : 'Specifications:'}</span><span class="value">${property_details.rooms || '-'} camere | ${property_details.areaUsable || '-'} mp utili</span></div>
                <div class="field"><span class="label">${isRo ? 'CF / Nr. Topo:' : 'Land Registry (CF):'}</span><span class="value">${property_details.contractCfTopo || '-'}</span></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">${isRo ? '3. TERMENI ȘI OBLIGAȚII' : '3. TERMS AND OBLIGATIONS'}</div>
              <div class="terms">
                ${isRo ? `
                  <p>Prin semnarea prezentei fișe de vizionare, clientul confirmă și acceptă următoarele clauze:</p>
                  <ol>
                    <li><strong>Obligația de Confidențialitate:</strong> Clientul se obligă să păstreze confidențialitatea tuturor informațiilor primite despre proprietatea prezentată, să nu le divulge terților și să nu le utilizeze în scop personal sau în detrimentul Prestatorului.</li>
                    <li><strong>Plata Comisionului:</strong> Clientul se obligă să achite Prestatorului comisionul convenit de <strong>2% (plus TVA)</strong> din valoarea de achiziție a proprietății, sau <strong>50% din chiria pe o lună</strong> în cazul închirierii, dacă tranzacția se realizează pentru proprietatea vizionată.</li>
                    <li><strong>Eludarea Intermediarului:</strong> Această obligație de plată a comisionului este valabilă și în cazul în care tranzacția se încheie direct cu proprietarul, prin interpuși, rude de gradul I și II, asociați sau companii afiliate Clientului, într-un termen de 12 luni de la data vizionării.</li>
                    <li><strong>Litigii:</strong> Orice litigiu decurgând din sau în legătură cu acest contract se va soluționa pe cale amiabilă sau, în caz contrar, de către instanțele judecătorești competente de la sediul Prestatorului.</li>
                    <li><strong>GDPR:</strong> Clientul își exprimă acordul expres pentru prelucrarea datelor cu caracter personal furnizate, în vederea executării prezentului contract și a raportării de tranzacții.</li>
                  </ol>
                ` : `
                  <p>By signing this viewing sheet, the client confirms and accepts the following clauses:</p>
                  <ol>
                    <li><strong>Confidentiality Obligation:</strong> The Client agrees to keep confidential all information received regarding the presented property, not to disclose it to third parties, and not to use it for personal purposes or to the detriment of the Provider.</li>
                    <li><strong>Commission Payment:</strong> The Client agrees to pay the Provider the agreed commission of <strong>2% (plus VAT)</strong> of the purchase price, or <strong>50% of one month's rent</strong> in case of rental, if the transaction is concluded for the viewed property.</li>
                    <li><strong>Circumvention of Intermediary:</strong> This commission payment obligation remains valid if the transaction is concluded directly with the owner, through intermediaries, relatives of 1st and 2nd degree, associates, or affiliated companies of the Client, within 12 months from the date of the viewing.</li>
                    <li><strong>Disputes:</strong> Any dispute arising out of or in connection with this contract shall be resolved amicably, or failing that, by the competent courts at the Provider's headquarters.</li>
                    <li><strong>GDPR:</strong> The Client expresses their express consent to the processing of the personal data provided, for the purpose of executing this contract and reporting transactions.</li>
                  </ol>
                `}
              </div>
            </div>

            <div class="signatures">
              <div class="sig-box">
                <div class="sig-title">${isRo ? 'PRESTATOR (AGENT)' : 'PROVIDER (AGENT)'}</div>
                <div style="color: #64748b; font-size: 11px; margin: 10px 0;">
                  ${agent_details.fullName}<br>
                  ${agent_details.companyName || ''}
                </div>
                <div class="sig-placeholder">${isRo ? 'Semnătură & Ștampilă digitală' : 'Digital Signature & Stamp'}</div>
              </div>
              <div class="sig-box">
                <div class="sig-title">${isRo ? 'CLIENT' : 'CLIENT'}</div>
                ${status === 'signed' ? `
                  <div>
                    <div class="sig-signed">${isRo ? 'SEMNAT DIGITAL' : 'DIGITALLY SIGNED'}</div>
                    <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
                      ${client_details.fullName}<br>
                      Date: ${signedDateStr}
                    </div>
                  </div>
                ` : `
                  <div class="sig-placeholder" style="margin: 20px 0;">
                    ${isRo ? 'Așteaptă semnătura clientului' : 'Awaiting client signature'}
                  </div>
                `}
                <div class="sig-placeholder">${isRo ? 'Semnătură Client' : 'Client Signature'}</div>
              </div>
            </div>

            <div class="footer">
              <p>${isRo 
                ? 'Acest document a fost generat și semnat electronic prin intermediul platformei Real Estate MLS.' 
                : 'This document was generated and signed electronically through the Real Estate MLS platform.'}</p>
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              }
            </script>
          </body>
          </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-300">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link 
                        href="/dashboard/client" 
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider transition-colors mb-3"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Contracte de Vizionare (Fișe)
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Vizualizează, verifică și semnează digital fișele de vizionare trimise de agenții tăi.
                    </p>
                </div>
            </div>

            {/* List */}
            {contracts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Nu există contracte</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                        Agenții tăi nu au generat nicio fișă de vizionare pentru tine până în acest moment.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contracts.map((contract) => {
                        const isSigned = contract.status === 'signed';
                        return (
                            <div 
                                key={contract.id} 
                                className={`bg-white rounded-2xl border transition-all shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md ${
                                    isSigned ? 'border-slate-200' : 'border-amber-200 bg-amber-50/5'
                                }`}
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            #{contract.contract_serial}-{contract.contract_number}
                                        </span>
                                        {isSigned ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 uppercase tracking-wider">
                                                <CheckCircle className="w-3.5 h-3.5" /> Semnat
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 uppercase tracking-wider animate-pulse">
                                                <Clock className="w-3.5 h-3.5" /> Așteaptă Semnătură
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-base font-bold text-slate-900 mb-2 truncate">
                                        {contract.property_details.title}
                                    </h3>
                                    
                                    <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                                        <p><span className="font-semibold">Agent:</span> {contract.agent_details.fullName}</p>
                                        <p><span className="font-semibold">Proprietate:</span> {contract.property_details.friendlyId || 'N/A'}</p>
                                        <p><span className="font-semibold">Adresă:</span> {contract.property_details.address}</p>
                                        <p><span className="font-semibold">Creat la:</span> {new Date(contract.created_at).toLocaleDateString('ro-RO')}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs text-slate-400">
                                        Limba: {contract.language.toUpperCase()}
                                    </span>
                                    {isSigned ? (
                                        <button 
                                            onClick={() => handleOpenViewModal(contract)}
                                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                                        >
                                            <FileText className="w-3.5 h-3.5" /> Detalii & Print
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleOpenSignModal(contract)}
                                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                                        >
                                            <ShieldCheck className="w-3.5 h-3.5" /> Semnează Digital
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Signature Modal */}
            {signingContract && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[95vh]">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-slate-800 font-bold text-base flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-orange-600" />
                                    Revizuire și Semnare Fișă de Vizionare
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Seria {signingContract.contract_serial} nr. {signingContract.contract_number}
                                </p>
                            </div>
                            <button onClick={() => setSigningContract(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col md:flex-row gap-6">
                            {/* Contract Terms View */}
                            <div className="flex-1 border border-slate-200 rounded-xl p-4 bg-slate-50 overflow-y-auto max-h-[50vh] md:max-h-[60vh] text-xs space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-slate-900 uppercase">Termeni Contract / Legal Clauses</span>
                                    <div className="flex gap-1.5 bg-slate-200 p-0.5 rounded-lg">
                                        <button 
                                            type="button" 
                                            onClick={() => setPreviewLang('ro')}
                                            className={`px-2 py-1 rounded text-[10px] font-bold ${previewLang === 'ro' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            RO
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setPreviewLang('en')}
                                            className={`px-2 py-1 rounded text-[10px] font-bold ${previewLang === 'en' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            EN
                                        </button>
                                    </div>
                                </div>

                                {previewLang === 'ro' ? (
                                    <div className="space-y-3 leading-relaxed text-justify text-slate-700">
                                        <h4 className="font-bold text-center text-slate-900 uppercase">FIȘĂ DE VIZIONARE</h4>
                                        <p><strong>Părți contractante:</strong></p>
                                        <p><strong>PRESTATOR:</strong> {signingContract.agent_details.companyName || 'Persoană Fizică (Nefinalizat)'}, cu sediul în {signingContract.agent_details.companyAddress || '-'}, CUI: {signingContract.agent_details.companyCui || '-'}, Reg. Com: {signingContract.agent_details.companyRegCom || '-'}, reprezentat de agent imobiliar {signingContract.agent_details.fullName}.</p>
                                        <p><strong>CLIENT:</strong> {fullName || 'Necompletat'}, posesor al cărții de identitate seria/număr {idSeriesNumber || 'Necompletat'}, CNP {cnp || 'Necompletat'}, telefon {phone || 'Necompletat'}, email {signingContract.client_details.email}.</p>
                                        <p><strong>Proprietate Prezentată:</strong></p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>ID: {signingContract.property_details.friendlyId || signingContract.property_details.id}</li>
                                            <li>Titlu: {signingContract.property_details.title}</li>
                                            <li>Adresă: {signingContract.property_details.address}</li>
                                            <li>CF/Nr. Topo: {signingContract.property_details.contractCfTopo || '-'}</li>
                                        </ul>
                                        <p><strong>Clauze Contractuale:</strong></p>
                                        <p>1. <strong>Confidențialitate:</strong> Clientul se obligă să păstreze confidențialitatea tuturor informațiilor oferite despre proprietate și să nu le utilizeze în scopuri personale pentru eludarea agentului.</p>
                                        <p>2. <strong>Plata comisionului:</strong> Clientul se obligă să achite Prestatorului un comision de <strong>2% plus TVA</strong> din valoarea tranzacției sau <strong>50% din chiria pe o lună</strong>, în cazul realizării tranzacției cu proprietatea prezentată.</p>
                                        <p>3. <strong>Eludare:</strong> Plata comisionului este obligatorie chiar dacă tranzacția se încheie direct cu proprietarul, prin interpuși (rude de gradul 1 și 2, parteneri), pe o perioadă de 12 luni de la vizionare.</p>
                                        <p>4. <strong>GDPR:</strong> Datele personale sunt prelucrate exclusiv în scopul executării contractului.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 leading-relaxed text-justify text-slate-700">
                                        <h4 className="font-bold text-center text-slate-900 uppercase">PROPERTY VIEWING SHEET</h4>
                                        <p><strong>Contracting Parties:</strong></p>
                                        <p><strong>PROVIDER:</strong> {signingContract.agent_details.companyName || 'Individual Broker'}, located at {signingContract.agent_details.companyAddress || '-'}, VAT/CUI: {signingContract.agent_details.companyCui || '-'}, Reg. Com: {signingContract.agent_details.companyRegCom || '-'}, represented by real estate agent {signingContract.agent_details.fullName}.</p>
                                        <p><strong>CLIENT:</strong> {fullName || 'Not filled'}, holder of ID Series/Number {idSeriesNumber || 'Not filled'}, CNP {cnp || 'Not filled'}, phone {phone || 'Not filled'}, email {signingContract.client_details.email}.</p>
                                        <p><strong>Presented Property:</strong></p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>ID: {signingContract.property_details.friendlyId || signingContract.property_details.id}</li>
                                            <li>Title: {signingContract.property_details.title}</li>
                                            <li>Address: {signingContract.property_details.address}</li>
                                            <li>CF/Topo No: {signingContract.property_details.contractCfTopo || '-'}</li>
                                        </ul>
                                        <p><strong>Contractual Terms:</strong></p>
                                        <p>1. <strong>Confidentiality:</strong> The Client agrees to keep the confidentiality of all information supplied regarding the property and not to use it to bypass the agent.</p>
                                        <p>2. <strong>Commission:</strong> The Client agrees to pay the Provider a commission of <strong>2% plus VAT</strong> of the transaction value (or <strong>50% of monthly rent</strong>) in case they buy or rent the presented property.</p>
                                        <p>3. <strong>Circumvention:</strong> The commission is due even if the transaction is concluded directly with the owner, or through 1st/2nd degree relatives or business partners, within 12 months.</p>
                                        <p>4. <strong>GDPR:</strong> Personal data is processed exclusively for executing this contract.</p>
                                    </div>
                                )}
                            </div>

                            {/* Signature Form */}
                            <form onSubmit={handleSignSubmit} className="w-full md:w-80 space-y-4">
                                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                                    Date Semnătură Digitală
                                </h4>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nume Complet (Client)</label>
                                    <input 
                                        type="text" 
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-900"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Telefon</label>
                                    <input 
                                        type="text" 
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-900"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CNP (13 Cifre)</label>
                                    <input 
                                        type="text" 
                                        value={cnp}
                                        onChange={(e) => setCnp(e.target.value)}
                                        maxLength={13}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-900"
                                        placeholder="e.g. 1950203xxxxxx"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Serie și Număr Carte Identitate</label>
                                    <input 
                                        type="text" 
                                        value={idSeriesNumber}
                                        onChange={(e) => setIdSeriesNumber(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-900"
                                        placeholder="e.g. AX 123456"
                                        required
                                    />
                                </div>

                                <div className="pt-2">
                                    <label className="flex items-start gap-2 cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={agreed}
                                            onChange={(e) => setAgreed(e.target.checked)}
                                            className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                                            required
                                        />
                                        <span className="text-[10px] text-slate-600 leading-normal">
                                            Sunt de acord cu prelucrarea datelor mele cu caracter personal și confirm vizionarea proprietății în condițiile descrise mai sus.
                                        </span>
                                    </label>
                                </div>

                                <div className="pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Se semnează...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-3.5 h-3.5" /> Acceptă și Semnează
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal (for Signed Contracts) */}
            {viewingContract && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-slate-800 font-bold text-base flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-orange-600" />
                                    Fișă de Vizionare semnată
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Seria {viewingContract.contract_serial} nr. {viewingContract.contract_number}
                                </p>
                            </div>
                            <button onClick={() => setViewingContract(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 text-sm">
                            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5 text-slate-500">Furnizor (Agent)</h4>
                                    <p className="font-bold text-slate-800">{viewingContract.agent_details.fullName}</p>
                                    <p className="text-xs text-slate-600 mt-1">{viewingContract.agent_details.companyName || 'Persoană Fizică (Nefinalizat)'}</p>
                                    <p className="text-xs text-slate-600">CUI: {viewingContract.agent_details.companyCui || '-'}</p>
                                    <p className="text-xs text-slate-600">Reg. Com: {viewingContract.agent_details.companyRegCom || '-'}</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5 text-slate-500">Client</h4>
                                    <p className="font-bold text-slate-800">{viewingContract.client_details.fullName}</p>
                                    <p className="text-xs text-slate-600 mt-1">CNP: {viewingContract.client_details.cnp || 'Necompletat'}</p>
                                    <p className="text-xs text-slate-600">CI Seria/Nr: {viewingContract.client_details.idSeriesNumber || 'Necompletat'}</p>
                                    <p className="text-xs text-slate-600">Tel: {viewingContract.client_details.phone}</p>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">Proprietate Prezentată</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <p><span className="font-semibold text-slate-600">Titlu:</span> {viewingContract.property_details.title}</p>
                                    <p><span className="font-semibold text-slate-600">ID:</span> {viewingContract.property_details.friendlyId || viewingContract.property_details.id}</p>
                                    <p className="col-span-2"><span className="font-semibold text-slate-600">Adresă:</span> {viewingContract.property_details.address}</p>
                                    <p><span className="font-semibold text-slate-600">Camere/Suprafață:</span> {viewingContract.property_details.rooms} camere / {viewingContract.property_details.areaUsable} mp</p>
                                    <p><span className="font-semibold text-slate-600">CF/Nr. Topo:</span> {viewingContract.property_details.contractCfTopo || '-'}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">Semnătură Digitală</h4>
                                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-semibold">
                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                    Semnat digital la data: {new Date(viewingContract.signed_at).toLocaleString('ro-RO')}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                                Limba contractului: {viewingContract.language.toUpperCase()}
                            </span>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => handlePrint(viewingContract)} 
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                                >
                                    <Printer className="w-3.5 h-3.5" /> Printează / Salvează PDF
                                </button>
                                <button 
                                    onClick={() => setViewingContract(null)} 
                                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                                >
                                    Închide
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
