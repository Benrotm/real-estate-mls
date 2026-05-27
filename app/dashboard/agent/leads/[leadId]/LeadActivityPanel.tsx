'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock, MessageSquare, List, Calendar, X, FileText, Printer, CheckCircle } from 'lucide-react';
import { createNote, logLeadActivity } from '@/app/lib/actions/leads';
import { createProposalContract, getLeadContracts } from '@/app/lib/actions/contracts';
import { LeadData } from '@/app/lib/types';

interface Activity {
    id: string;
    type: string;
    description: string;
    created_at: string;
    created_by?: string;
}

interface Note {
    id: string;
    content: string;
    created_at: string;
    author?: {
        full_name: string;
    };
}

interface Props {
    leadId: string;
    lead?: LeadData;
    initialNotes: Note[];
    initialActivities: Activity[];
}

export default function LeadActivityPanel({ leadId, lead, initialNotes, initialActivities }: Props) {
    const [activeTab, setActiveTab] = useState<'notes' | 'activities'>('notes');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Calendar Modal State
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [calendarEventType, setCalendarEventType] = useState<'Visit Scheduled' | 'To Recall'>('Visit Scheduled');
    const [eventDate, setEventDate] = useState('');
    
    // WhatsApp Modal State
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [propertyId, setPropertyId] = useState('');

    // Property Proposal Contract State
    const [contracts, setContracts] = useState<any[]>([]);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [contractPropId, setContractPropId] = useState('');
    const [contractLang, setContractLang] = useState<'ro' | 'en'>('ro');
    const [isGeneratingContract, setIsGeneratingContract] = useState(false);
    const [selectedContractForPrint, setSelectedContractForPrint] = useState<any | null>(null);

    useEffect(() => {
        async function fetchContracts() {
            try {
                const data = await getLeadContracts(leadId);
                setContracts(data);
            } catch (err) {
                console.error('Failed to fetch lead contracts:', err);
            }
        }
        fetchContracts();

        if (lead?.source) {
            const match = lead.source.match(/P\d+/i);
            if (match) {
                setContractPropId(match[0].toUpperCase());
            } else {
                const numMatch = lead.source.match(/\b\d{4,}\b/);
                if (numMatch) {
                    setContractPropId('P' + numMatch[0]);
                }
            }
        }
    }, [leadId, lead]);

    const TAG_STYLES: Record<string, string> = {
        'Calibration Call': 'bg-blue-100 text-blue-700 border-blue-200',
        'To Recall': 'bg-orange-100 text-orange-700 border-orange-200',
        'Not Responding': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        'Propose Properties': 'bg-[#25D366]/20 text-[#128C7E] border-[#25D366]/30',
        'Visit Scheduled': 'bg-teal-100 text-teal-700 border-teal-200',
        'Visit Made': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Not Interested': 'bg-slate-200 text-slate-700 border-slate-300',
        'Negotiations': 'bg-red-100 text-red-700 border-red-200',
        'Closed': 'bg-green-100 text-green-700 border-green-200',
        'Lost': 'bg-zinc-200 text-zinc-700 border-zinc-300',
        'View Contract SEND': 'bg-amber-100 text-amber-700 border-amber-300',
        'View Contract Signed': 'bg-emerald-100 text-emerald-700 border-emerald-300',
        'WhatsApp': 'bg-[#25D366]/20 text-[#128C7E] border-[#25D366]/30',
        'Email': 'bg-sky-100 text-sky-700 border-sky-200'
    };

    const TAGS = Object.keys(TAG_STYLES).filter(tag => tag !== 'WhatsApp' && tag !== 'Email');

    const formatNoteText = (text: string) => {
        // Match the pattern: [PropertyID] (URL) 
        // e.g., "Shared Property [p123334] (https://www.imobum.com/properties/p123334)"
        const parts = text.split(/(\[[a-zA-Z0-9_-]+\]\s*\([^\)]+\))/g);
        
        return parts.map((part, i) => {
            const match = part.match(/\[([a-zA-Z0-9_-]+)\]\s*\(([^\)]+)\)/);
            if (match) {
                const propId = match[1];
                const url = match[2];
                return (
                    <a 
                        key={i} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-white bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-bold transition-colors inline-block tracking-wide mx-0.5 shadow-sm"
                    >
                        {propId.toUpperCase()}
                    </a>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    const renderNoteContent = (content: string) => {
        const match = content.match(/^\[(.*?)\]\s*(.*)$/si); // Allow multi-line matches
        if (match) {
            const tag = match[1];
            if (TAG_STYLES[tag]) {
                return (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${TAG_STYLES[tag]} inline-block`}>
                            {tag}
                        </span>
                        <span className="mt-0.5 whitespace-pre-wrap leading-relaxed">{formatNoteText(match[2])}</span>
                    </div>
                );
            }
        }
        return <span className="whitespace-pre-wrap leading-relaxed">{formatNoteText(content)}</span>;
    };

    async function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);
            const rawContent = formData.get('content') as string;
            if (rawContent && rawContent.trim()) {
                const finalContent = selectedTag ? `[${selectedTag}] ${rawContent}` : rawContent;
                await createNote(leadId, finalContent);
                
                // Log activity
                const activityDesc = selectedTag ? `Added note with tag: ${selectedTag}` : 'Added a note';
                await logLeadActivity(leadId, 'note', activityDesc);
            }
            formRef.current?.reset();
            setSelectedTag(null);
        } catch (error) {
            console.error('Failed to add note:', error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleScheduleEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventDate) {
            alert("Please select a date and time");
            return;
        }

        const dateObj = new Date(eventDate);
        const endDateObj = new Date(dateObj.getTime() + 60 * 60 * 1000); // 1 hour duration
        
        const formatGoogleDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const startStr = formatGoogleDate(dateObj);
        const endStr = formatGoogleDate(endDateObj);

        const title = propertyId.trim() ? `${calendarEventType} - ${propertyId.trim()} - ${lead?.name || 'Client'}` : `${calendarEventType} - ${lead?.name || 'Client'}`;
        const description = `Phone: ${lead?.phone || 'N/A'}\nEmail: ${lead?.email || 'N/A'}`;
        
        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(description)}`;

        const noteContent = propertyId.trim() 
            ? `[${calendarEventType}] for property ${propertyId.trim()} at ${dateObj.toLocaleString()}`
            : `[${calendarEventType}] at ${dateObj.toLocaleString()}`;

        try {
            await createNote(leadId, noteContent);
            await logLeadActivity(leadId, 'meeting', `Scheduled: ${calendarEventType}`);
        } catch (error) {
            console.error('Failed to log scheduled event:', error);
        }

        setIsCalendarModalOpen(false);
        setEventDate('');
        setPropertyId('');
        window.open(gcalUrl, '_blank', 'noopener,noreferrer');
    };

    const handleProposePropertiesClick = () => {
        setPropertyId(''); // Clear previous input
        setIsWhatsAppModalOpen(true);
    };

    const submitWhatsAppPropose = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const propId = propertyId;
        
        let message = '';
        let url = '';
        if (lead?.phone) {
            // Strip non-digits
            let cleanPhone = lead.phone.replace(/\D/g, '');
            // Auto-format Romanian numbers starting with 0 (e.g., 07xx -> 407xx)
            if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
                cleanPhone = '40' + cleanPhone.substring(1);
            }
            url = `https://api.whatsapp.com/send/?phone=${cleanPhone}`;
        } else {
            alert("No phone number saved for this lead.");
            return;
        }
        
        if (propId && propId.trim() !== '') {
            const propertyLink = `${window.location.origin}/properties/${propId.trim()}`;
            message = `Shared Property [${propId.trim()}] (${propertyLink}) via WhatsApp`;
            url += `&text=${encodeURIComponent(`Check out this property: ${propertyLink}`)}`;
        } else {
            message = 'Opened WhatsApp chat to propose properties';
        }
        
        try {
            await logLeadActivity(leadId, 'contacted', message);
            await createNote(leadId, `[Propose Properties] ${message}`);
        } catch (error) {
            console.error('Failed to log Propose Properties activity:', error);
        }
        
        setIsWhatsAppModalOpen(false);
        setPropertyId('');
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleCreateContractSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contractPropId.trim()) {
            alert('Vă rugăm să introduceți ID-ul proprietății.');
            return;
        }

        setIsGeneratingContract(true);
        try {
            const res = await createProposalContract(leadId, contractPropId.trim(), contractLang);
            if (res.success && res.contract) {
                setContracts(prev => [res.contract, ...prev]);
                setIsContractModalOpen(false);
                setSelectedContractForPrint(res.contract);
            } else {
                alert(`Eroare: ${res.error}`);
            }
        } catch (error: any) {
            console.error('Failed to create contract:', error);
            alert(`Eroare la crearea contractului: ${error.message || 'Unknown error'}`);
        } finally {
            setIsGeneratingContract(false);
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

        const isRo = language === 'ro';

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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'notes'
                        ? 'bg-white text-orange-600 border-b-2 border-orange-600'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    Notes ({initialNotes.length})
                </button>
                <button
                    onClick={() => setActiveTab('activities')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'activities'
                        ? 'bg-white text-orange-600 border-b-2 border-orange-600'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                >
                    <List className="w-4 h-4" />
                    Activities ({initialActivities.length})
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 max-h-[500px] overflow-y-auto p-6 bg-slate-50/30">

                {/* NOTES TAB */}
                {activeTab === 'notes' && (
                    <div className="space-y-6">
                        {initialNotes.length > 0 ? (
                            initialNotes.map((note) => (
                                <div key={note.id} className="relative pl-6 border-l-2 border-slate-200 pb-1 last:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                                    <div className="text-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-slate-900 text-xs">{note.author?.full_name || 'Agent'}</span>
                                            <span className="text-xs text-slate-400">{new Date(note.created_at).toLocaleString()}</span>
                                        </div>
                                        <div className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm">
                                            {renderNoteContent(note.content)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                No notes yet. Start the conversation!
                            </div>
                        )}
                    </div>
                )}

                {/* ACTIVITIES TAB */}
                {activeTab === 'activities' && (
                    <div className="space-y-4">
                        {initialActivities.length > 0 ? (
                            initialActivities.map((activity) => (
                                <div key={activity.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="mt-1 min-w-[32px] w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-800">{activity.description}</p>
                                        <span className="text-xs text-slate-400">{new Date(activity.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                <List className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                No recorded activities.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Area - Only for Notes */}
            {activeTab === 'notes' && (
                <div className="p-4 bg-white border-t border-slate-200 animate-in fade-in duration-300">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {TAGS.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                    if (tag === 'Visit Scheduled' || tag === 'To Recall') {
                                        setCalendarEventType(tag as 'Visit Scheduled' | 'To Recall');
                                        setIsCalendarModalOpen(true);
                                    } else if (tag === 'Propose Properties') {
                                        handleProposePropertiesClick();
                                    } else if (tag === 'View Contract SEND') {
                                        const sentContract = contracts.find(c => c.status === 'sent');
                                        if (sentContract) {
                                            setSelectedContractForPrint(sentContract);
                                        } else {
                                            setIsContractModalOpen(true);
                                        }
                                    } else if (tag === 'View Contract Signed') {
                                        const signedContract = contracts.find(c => c.status === 'signed');
                                        if (signedContract) {
                                            setSelectedContractForPrint(signedContract);
                                        } else {
                                            alert('Nu există nicio fișă de vizionare semnată.');
                                        }
                                    } else {
                                        setSelectedTag(selectedTag === tag ? null : tag);
                                    }
                                }}
                                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all hover:brightness-95 ${TAG_STYLES[tag]} ${
                                    tag === 'View Contract SEND' && contracts.some(c => c.status === 'sent')
                                        ? 'ring-2 ring-amber-500 ring-offset-1 font-extrabold shadow-sm'
                                        : tag === 'View Contract Signed' && contracts.some(c => c.status === 'signed')
                                        ? 'ring-2 ring-emerald-500 ring-offset-1 font-extrabold shadow-sm'
                                        : selectedTag === tag
                                        ? 'ring-2 ring-offset-1 ring-orange-500 shadow-sm'
                                        : 'opacity-80'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                    <form ref={formRef} onSubmit={handleOnSubmit} className="relative">
                        <textarea
                            name="content"
                            required
                            placeholder="Add a note about this client..."
                            className="w-full pl-4 pr-12 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[80px]"
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`absolute bottom-3 right-3 p-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors shadow-sm ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Add Note"
                        >
                            <Clock className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                        </button>
                    </form>
                </div>
            )}

            {/* Calendar Modal */}
            {isCalendarModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-center gap-2 text-slate-800 font-bold">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                Add to Calendar
                            </div>
                            <button onClick={() => setIsCalendarModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleScheduleEvent} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Event Type</label>
                                <select 
                                    value={calendarEventType} 
                                    onChange={(e) => setCalendarEventType(e.target.value as any)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="Visit Scheduled">Visit Scheduled</option>
                                    <option value="To Recall">To Recall</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date & Time</label>
                                <input 
                                    type="datetime-local" 
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Property ID (Optional)</label>
                                <input 
                                    type="text" 
                                    value={propertyId}
                                    onChange={(e) => setPropertyId(e.target.value)}
                                    placeholder="e.g. P137"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors">
                                    Schedule & Log Note
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* WhatsApp/Propose Properties Modal */}
            {isWhatsAppModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-center gap-2 text-slate-800 font-bold">
                                <MessageSquare className="w-5 h-5 text-[#25D366]" />
                                Propose Properties
                            </div>
                            <button onClick={() => setIsWhatsAppModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitWhatsAppPropose} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Property ID (Optional)</label>
                                <input 
                                    type="text" 
                                    value={propertyId}
                                    onChange={(e) => setPropertyId(e.target.value)}
                                    placeholder="e.g. P137"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Leave blank to just open WhatsApp and log the note.
                                </p>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full px-4 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Open WhatsApp
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generate Property Proposal Contract Modal */}
            {isContractModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2.5 text-slate-800 font-bold">
                                <FileText className="w-5 h-5 text-orange-600" />
                                Trimite Fișă de Vizionare
                            </div>
                            <button onClick={() => setIsContractModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateContractSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID / Referință Proprietate</label>
                                <input 
                                    type="text" 
                                    value={contractPropId}
                                    onChange={(e) => setContractPropId(e.target.value)}
                                    placeholder="e.g. P1971"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-900"
                                    required
                                />
                                <p className="text-[11px] text-slate-400 mt-1.5">
                                    Introduceți ID-ul proprietății sau referința. Se va genera o fișă de vizionare ce va fi trimisă clientului pe platformă.
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Limba Contractului (Language)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setContractLang('ro')}
                                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${
                                            contractLang === 'ro' 
                                                ? 'bg-orange-50 text-orange-700 border-orange-300 ring-2 ring-orange-200' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        Română (RO)
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setContractLang('en')}
                                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${
                                            contractLang === 'en' 
                                                ? 'bg-orange-50 text-orange-700 border-orange-300 ring-2 ring-orange-200' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        English (EN)
                                    </button>
                                </div>
                            </div>
                            <div className="pt-3">
                                <button 
                                    type="submit" 
                                    disabled={isGeneratingContract}
                                    className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/10 hover:shadow-orange-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGeneratingContract ? (
                                        <>
                                            <Clock className="w-4 h-4 animate-spin" /> Se generează...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-4 h-4" /> Generează și Trimite
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View/Print Contract Details Modal */}
            {selectedContractForPrint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex flex-col">
                                <span className="text-slate-800 font-bold text-base flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-orange-600" />
                                    Fișă de Vizionare (seria {selectedContractForPrint.contract_serial} nr. {selectedContractForPrint.contract_number})
                                </span>
                                <span className="text-xs text-slate-400 mt-0.5">
                                    Data generării: {new Date(selectedContractForPrint.created_at).toLocaleString('ro-RO')}
                                </span>
                            </div>
                            <button onClick={() => setSelectedContractForPrint(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 text-sm">
                            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5 text-slate-500">Furnizor (Agent)</h4>
                                    <p className="font-bold text-slate-800">{selectedContractForPrint.agent_details.fullName}</p>
                                    <p className="text-xs text-slate-600 mt-1">{selectedContractForPrint.agent_details.companyName || 'Persoană Fizică (Nefinalizat)'}</p>
                                    <p className="text-xs text-slate-600">CUI: {selectedContractForPrint.agent_details.companyCui || '-'}</p>
                                    <p className="text-xs text-slate-600">Reg. Com: {selectedContractForPrint.agent_details.companyRegCom || '-'}</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5 text-slate-500">Client</h4>
                                    <p className="font-bold text-slate-800">{selectedContractForPrint.client_details.fullName}</p>
                                    <p className="text-xs text-slate-600 mt-1">CNP: {selectedContractForPrint.client_details.cnp || 'Necompletat'}</p>
                                    <p className="text-xs text-slate-600">CI Seria/Nr: {selectedContractForPrint.client_details.idSeriesNumber || 'Necompletat'}</p>
                                    <p className="text-xs text-slate-600">Tel: {selectedContractForPrint.client_details.phone}</p>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">Proprietate Prezentată</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <p><span className="font-semibold text-slate-600">Titlu:</span> {selectedContractForPrint.property_details.title}</p>
                                    <p><span className="font-semibold text-slate-600">ID:</span> {selectedContractForPrint.property_details.friendlyId || selectedContractForPrint.property_details.id}</p>
                                    <p className="col-span-2"><span className="font-semibold text-slate-600">Adresă:</span> {selectedContractForPrint.property_details.address}</p>
                                    <p><span className="font-semibold text-slate-600">Camere/Suprafață:</span> {selectedContractForPrint.property_details.rooms} camere / {selectedContractForPrint.property_details.areaUsable} mp</p>
                                    <p><span className="font-semibold text-slate-600">CF/Nr. Topo:</span> {selectedContractForPrint.property_details.contractCfTopo || '-'}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">Stadiu Semnătură</h4>
                                <div className="flex items-center gap-2">
                                    {selectedContractForPrint.status === 'signed' ? (
                                        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-semibold">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                            Semnat digital la data: {new Date(selectedContractForPrint.signed_at).toLocaleString('ro-RO')}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 text-xs font-semibold">
                                            <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                                            Trimis spre semnare. Se așteaptă acceptul clientului.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                                Limba contractului: {selectedContractForPrint.language.toUpperCase()}
                            </span>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => handlePrint(selectedContractForPrint)} 
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                                >
                                    <Printer className="w-3.5 h-3.5" /> Printează / Salvează PDF
                                </button>
                                <button 
                                    onClick={() => setSelectedContractForPrint(null)} 
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
