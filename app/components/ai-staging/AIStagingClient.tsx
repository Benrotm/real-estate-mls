"use client";

import React, { useState, useTransition, useEffect, createContext, useContext } from 'react';
import { 
  Wand2, Video, FileImage, FileText, 
  Layers, UploadCloud, Settings, ChevronRight, 
  Sparkles, CheckCircle2, Sliders, Image as ImageIcon, Camera, Building, Sofa, Loader2, Download
} from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import { 
  generateVirtualStaging, 
  generateVideo, 
  generate3DPlan, 
  generateDescription, 
  generateRoomAnimation 
} from '@/app/lib/actions/ai-staging';
import { getFeatureCosts } from '@/app/lib/actions/settings';
import { Coins } from 'lucide-react';
import { copyToClipboardSafe } from '@/app/lib/utils/clipboard';

export const CreditsContext = createContext<{credits: number, costs: Record<string, number>}>({credits: 0, costs: {}});

// Define the 5 main features corresponding to the provided link
const AI_FEATURES = [
  {
    id: 'virtual-staging',
    title: 'Virtual Staging cu Inteligență Artificială',
    subtitle: 'Transformă orice spațiu gol, la gri sau la roșu într-o prezentare profesională mobilată în secunde',
    icon: Sofa,
    color: 'from-blue-500 to-cyan-400'
  },
  {
    id: 'video-generator',
    title: 'Generator Video AI pentru Imobiliare',
    subtitle: 'Transformă pozele proprietății într-un video cinematic cu narație, muzică și logo-ul agenției tale',
    icon: Video,
    color: 'from-orange-500 to-red-400'
  },
  {
    id: 'plan-3d',
    title: 'Plan 2D → Vizualizare 3D',
    subtitle: 'Încarcă orice plan de arhitectură, schiță sau desen de mână și primești o randare 3D profesională',
    icon: Layers,
    color: 'from-green-500 to-emerald-400'
  },
  {
    id: 'description-gen',
    title: 'Generator Descrieri Imobiliare AI',
    subtitle: 'Creează texte profesionale de prezentare pentru anunțuri, clienți sau portaluri imobiliare',
    icon: FileText,
    color: 'from-purple-500 to-indigo-400'
  },
  {
    id: 'room-builder',
    title: 'Room Builder — Animație Mobilare',
    subtitle: 'Încarcă poza goală, alege mobilierul și AI generează o animație în care fiecare piesă apare una câte una',
    icon: Wand2,
    color: 'from-pink-500 to-rose-400'
  }
];

const handleDownload = async (url: string, filename: string) => {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const obj = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = obj;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(obj);
  } catch(err) {
    window.open(url, '_blank');
  }
};

export default function AIStagingClient({ userRole }: { userRole: string }) {

  const [activeTab, setActiveTab] = useState(AI_FEATURES[0].id);
  const [credits, setCredits] = useState(0);
  const [costs, setCosts] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.auth.getUser().then(async ({data: {user}}) => {
        if (!user) return;
        const { data: p } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
        if (p) setCredits(p.credits || 0);

        const costsRes = await getFeatureCosts();
        if (costsRes.costs) setCosts(costsRes.costs);
    });
  }, []);

  const renderActiveTool = () => {
    switch (activeTab) {
      case 'virtual-staging':
        return <VirtualStagingTool />;
      case 'video-generator':
        return <VideoGeneratorTool />;
      case 'plan-3d':
        return <Plan3DTool />;
      case 'description-gen':
        return <DescriptionGenTool />;
      case 'room-builder':
        return <RoomBuilderTool />;
      default:
        return null;
    }
  };

  return (
    <CreditsContext.Provider value={{credits, costs}}>
    <div className="bg-[#0a0a0f] text-slate-200 font-sans p-4 md:p-8 rounded-2xl min-h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="mb-10 text-center relative z-10">
        <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-4 shadow-[0_0_40px_rgba(255,255,255,0.1)] border border-white/10 backdrop-blur-md">
          <Sparkles className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight mb-4 drop-shadow-lg">
          AI Studio Imobiliare Pro
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Instrumente avansate de inteligență artificială pentru a-ți pregăti proprietățile să prindă viață.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-3 z-10 relative">
          {AI_FEATURES.map((feature) => {
            const isActive = activeTab === feature.id;
            const Icon = feature.icon;
            
            return (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-300 relative overflow-hidden group ${
                  isActive 
                    ? 'bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/20' 
                    : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                {isActive && (
                  <div className={`absolute inset-0 opacity-20 bg-gradient-to-r ${feature.color} blur-xl`} />
                )}
                
                <div className="relative z-10 flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? `bg-gradient-to-br ${feature.color} text-white shadow-lg` 
                      : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm mb-1 line-clamp-2 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {feature.title}
                    </h3>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Tool Workspace */}
        <div className="lg:col-span-3 z-10 relative">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden min-h-[600px]">
             {/* Dynamic background glow based on active tab */}
             {AI_FEATURES.map(f => (
               <div key={`glow-${f.id}`} className={`absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-r ${f.color} blur-[120px] opacity-10 transition-opacity duration-700 pointer-events-none ${activeTab === f.id ? 'opacity-30' : 'opacity-0'}`} />
             ))}
             
             {/* Content Area */}
             <div className="relative z-10">
               <div className="mb-8 border-b border-white/10 pb-6">
                 <h2 className="text-3xl font-bold text-white mb-3">
                   {AI_FEATURES.find(f => f.id === activeTab)?.title}
                 </h2>
                 <p className="text-slate-400 text-lg">
                   {AI_FEATURES.find(f => f.id === activeTab)?.subtitle}
                 </p>
               </div>
               
               {/* Render the specific tool UI */}
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {renderActiveTool()}
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
    </CreditsContext.Provider>
  );
}

// ----------------------------------------------------
// File Uploader with Supabase integration
// ----------------------------------------------------

function FileUploader({ 
  label, 
  accept, 
  multiple = false, 
  onUploadComplete 
}: { 
  label: string; 
  accept: string; 
  multiple?: boolean; 
  onUploadComplete: (urls: string[]) => void 
}) {
  const [uploading, setUploading] = useState(false);
  const [progressFiles, setProgressFiles] = useState<string[]>([]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `ai_staging_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `ai_uploads/${fileName}`; // Organized folder 

        const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('property-images')
            .getPublicUrl(filePath);

        return publicUrl;
      });

      const results = await Promise.all(uploadPromises);
      setProgressFiles(results);
      onUploadComplete(results);
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Failed to upload files to storage.');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="relative">
      <label className="border-2 border-dashed border-white/20 hover:border-cyan-400/50 bg-black/20 rounded-2xl p-10 text-center transition-all cursor-pointer group hover:bg-black/40 block">
        {uploading ? (
           <div className="flex flex-col items-center justify-center">
             <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
             <p className="text-slate-300">Se încarcă fișierele...</p>
           </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all duration-300">
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-cyan-400" />
            </div>
            <h4 className="text-lg font-medium text-slate-200 mb-2">{label}</h4>
            <p className="text-sm text-slate-500 mb-6">Trageți fișierele aici sau dați click pentru a încărca</p>
            <div className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/10 inline-block pointer-events-none">
              Selectează din fișiere
            </div>
            <input 
               type="file" 
               accept={accept} 
               multiple={multiple} 
               className="hidden" 
               onChange={handleUpload}
            />
          </>
        )}
      </label>
      
      {progressFiles.length > 0 && !multiple && (
        <div className="mt-3 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
           <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
           <p className="text-sm text-emerald-300 truncate">Fișier încărcat cu succes!</p>
        </div>
      )}
      {progressFiles.length > 0 && multiple && (
        <div className="mt-3 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
           <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
           <p className="text-sm text-emerald-300 truncate">{progressFiles.length} fișiere încărcate cu succes!</p>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Provider Settings Component
// ----------------------------------------------------

function ProviderSettings({ 
  providerList, 
  onProviderChange, 
  onKeyChange 
}: { 
  providerList: {id: string, name: string}[];
  onProviderChange: (p: string) => void;
  onKeyChange: (k: string) => void;
}) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4 text-slate-300 font-medium">
        <Settings className="w-5 h-5 text-indigo-400" />
        Configurare Furnizor AI (API)
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Furnizor AI</label>
          <select 
            onChange={(e) => onProviderChange(e.target.value)} 
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {providerList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
           <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Cheie API (Secret Key)</label>
           <input 
             type="password" 
             placeholder="sk-..."
             onChange={(e) => onKeyChange(e.target.value)}
             className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50"
           />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-components for each tool
// ----------------------------------------------------

function VirtualStagingTool() {
  const [isPending, startTransition] = useTransition();
  const { credits, costs } = useContext(CreditsContext);
  const cost = costs['ai_virtual_staging'] || 0;
  const [provider, setProvider] = useState('replicate');
  const [apiKey, setApiKey] = useState('');
  
  const [imageUrl, setImageUrl] = useState('');
  const [roomType, setRoomType] = useState('Living');
  const [style, setStyle] = useState('Modern');
  const [additionalOptions, setAdditionalOptions] = useState<string[]>(['Plante', 'Lumină naturală']);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const stylesData = [
    { id: 'Modern', icon: '🏠' },
    { id: 'Scandinav', icon: '🌿' },
    { id: 'Lux', icon: '✨' },
    { id: 'Industrial', icon: '🔩' },
    { id: 'Clasic', icon: '🏛️' },
    { id: 'Boho', icon: '🪴' },
    { id: 'Mediteranean', icon: '🌊' },
    { id: 'Zen', icon: '⛩️' },
    { id: 'Art Deco', icon: '💎' },
  ];

  const submitAction = () => {
    if (!imageUrl) {
        setError('Trebuie să încărcați o imagine mai întâi!');
        return;
    }
    setError('');
    
    startTransition(async () => {
      const res = await generateVirtualStaging({ imageUrl, roomType, style, additionalOptions }, provider, apiKey);
      if (res.error) setError(res.error);
      else setResult(res.resultUrl || '');
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <ProviderSettings 
          providerList={[{id: 'replicate', name: 'Replicate API'}, {id: 'falai', name: 'Fal.ai API'}, {id: 'midjourney', name: 'Midjourney API'}]}
          onProviderChange={setProvider}
          onKeyChange={setApiKey}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-widest">1. Încarcă Imagine</label>
          <FileUploader 
             label="Încarcă Imagine Principală" 
             accept="image/*" 
             onUploadComplete={(urls) => setImageUrl(urls[0])} 
          />
        </div>
        
        <div className="space-y-6 bg-black/20 p-5 rounded-2xl border border-white/5">
          {/* Room Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">2. Tipul camerei</label>
            <div className="flex flex-wrap gap-2">
              {['Living', 'Dormitor', 'Bucătărie', 'Birou', 'Dining', 'Baie'].map(rt => (
                <button
                  key={rt}
                  onClick={() => setRoomType(rt)}
                  className={`px-4 py-2 rounded-full text-sm border transition-all ${
                    roomType === rt
                      ? 'border-orange-400 text-orange-400 bg-orange-400/10'
                      : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-300'
                  }`}
                >
                  {rt}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">3. Stilul de mobilare</label>
            <div className="grid grid-cols-3 gap-3">
              {stylesData.map(st => (
                <button
                  key={st.id}
                  onClick={() => setStyle(st.id)}
                  className={`relative p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all group ${
                    style === st.id
                      ? 'border-orange-400 bg-orange-400/5 shadow-[0_0_15px_rgba(251,146,60,0.15)]'
                      : 'border-white/10 bg-black/40 hover:bg-black/60 hover:border-white/20'
                  }`}
                >
                  {style === st.id && (
                     <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-400 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                     </div>
                  )}
                  <span className="text-2xl group-hover:scale-110 transition-transform">{st.icon}</span>
                  <span className={`text-xs font-medium ${style === st.id ? 'text-orange-400' : 'text-slate-400'}`}>{st.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">4. Opțiuni suplimentare</label>
            <div className="flex flex-wrap gap-2">
              {['Plante', 'Lumină naturală', 'Seară', 'Tablouri', 'Covor lux'].map(opt => {
                const isActive = additionalOptions.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      if (isActive) setAdditionalOptions(prev => prev.filter(p => p !== opt));
                      else setAdditionalOptions(prev => [...prev, opt]);
                    }}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      isActive
                        ? 'border-orange-400 text-orange-400 bg-orange-400/10'
                        : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        
        {error && <div className="text-red-400 bg-red-500/10 p-3 rounded-xl text-sm border border-red-500/20">{error}</div>}

        <button 
          onClick={submitAction}
          disabled={isPending || credits < cost}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 flex-col disabled:opacity-50"
        >
          {isPending ? <div className="flex items-center gap-2"><><Loader2 className="w-5 h-5 animate-spin" /> Procesare AI...</></div> : <span className="flex items-center gap-2">Generează Staging AI</span>}
          {!isPending && <span className="text-xs text-white/70 flex items-center gap-1 mt-1 font-normal"><Coins size={12}/> Cost: {cost} credite (Balanță: {credits})</span>}
        </button>
      </div>
      
      <div className="bg-black/30 rounded-2xl border border-white/10 flex items-center justify-center p-6 min-h-[400px] relative overflow-hidden">
        {result ? (
           <>
              <img src={result} alt="Staging Result" className="w-full h-full object-contain rounded-xl relative z-10" />
              <button onClick={() => handleDownload(result, 'virtual_staging_imobum.png')} className="absolute top-8 right-8 bg-black/60 hover:bg-black/80 border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 backdrop-blur-md transition-all text-sm font-semibold shadow-2xl z-20">
                  <Download className="w-4 h-4"/> Descărcare
              </button>
           </>
        ) : (
          <div className="text-center relative z-10">
            {isPending ? (
               <>
                 <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mx-auto mb-4" />
                 <p className="text-slate-400 animate-pulse">Contactăm furnizorul AI... vă rugăm așteptați.</p>
               </>
            ) : (
               <>
                 <ImageIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                 <p className="text-slate-500">Vizualizarea va apărea aici după generare...</p>
               </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VideoGeneratorTool() {
  const [isPending, startTransition] = useTransition();
  const { credits, costs } = useContext(CreditsContext);
  const cost = costs['ai_video_generator'] || 0;
  const [provider, setProvider] = useState('replicate');
  const [apiKey, setApiKey] = useState('');
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  
  // New State variables matching the requested options
  const [musicType, setMusicType] = useState('Cinematic elegant');
  const [voiceType, setVoiceType] = useState('Voce feminină');
  const [videoFormat, setVideoFormat] = useState('16:9 (YouTube/site)');
  const [narrationDetails, setNarrationDetails] = useState('');

  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const submitAction = () => {
    if (imageUrls.length === 0) {
        setError('Încărcați cel puțin o imagine.'); return;
    }
    setError('');
    startTransition(async () => {
      // Pass the new configuration shape to the backend
      const res = await generateVideo({ 
        imageUrls, 
        musicType, 
        voiceType, 
        videoFormat,
        narrationDetails,
        logoUrl 
      }, provider, apiKey);
      
      if (res.error) setError(res.error);
      else setResult(res.resultUrl || '');
    });
  };

  // Helper for rendering Pill selectors
  const renderPills = (options: string[], currentValue: string, setter: (val: string) => void) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => setter(opt)}
          className={`px-4 py-2 rounded-full text-sm border transition-all ${
            currentValue === opt 
              ? 'border-orange-400 text-orange-400 bg-orange-400/10 shadow-[0_0_10px_rgba(251,146,60,0.2)]' 
              : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-300 bg-transparent'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <ProviderSettings 
          providerList={[{id: 'replicate', name: 'Replicate API'}, {id: 'luma', name: 'Luma Dream Machine'}, {id: 'runway', name: 'Runway Gen-3'}]}
          onProviderChange={setProvider}
          onKeyChange={setApiKey}
        />

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wide">1. ÎNcarcă Pozele Proprietății (Max 15)</label>
          <FileUploader 
            label="Încarcă Poze Multiple" 
            accept="image/*" 
            multiple 
            onUploadComplete={setImageUrls} 
          />
        </div>
        
        <div className="space-y-6 bg-black/20 p-5 rounded-2xl border border-white/5">
          {/* Background Music */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">2. Muzică de fundal</label>
            {renderPills(['Cinematic elegant', 'Modern upbeat', 'Pian moale', 'Corporate'], musicType, setMusicType)}
          </div>

          {/* AI Narration Voice */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">3. Narație AI</label>
            {renderPills(['Voce feminină', 'Voce masculină', 'Fără narație'], voiceType, setVoiceType)}
          </div>

          {/* Video Format */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">4. Format Video</label>
            {renderPills(['16:9 (YouTube/site)', '9:16 (Reels/TikTok)', '1:1 (Instagram)'], videoFormat, setVideoFormat)}
          </div>

          {/* Narration Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">5. Detalii Proprietate (pentru narație)</label>
            <textarea 
              rows={3}
              value={narrationDetails}
              onChange={e => setNarrationDetails(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500/50 resize-none text-sm"
              placeholder="Ex: Apartament 3 camere, renovat recent, parcare inclusă..."
            />
          </div>

          {/* Logo Option (Kept from existing logic) */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Atașare Logo Agenție {logoUrl && '✅'}</span>
            <label className="text-xs bg-white/10 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/20 text-white transition-colors cursor-pointer">
              Încarcă Logo
              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if(!file) return;
                  const { data } = await supabase.storage.from('property-images').upload(`logos/${Date.now()}_${file.name}`, file);
                  if(data?.path) {
                      const {data: {publicUrl}} = supabase.storage.from('property-images').getPublicUrl(data.path);
                      setLogoUrl(publicUrl);
                  }
              }}/>
            </label>
          </div>
        </div>

        {error && <div className="text-red-400 bg-red-500/10 p-3 rounded-xl text-sm border border-red-500/20">{error}</div>}

        <button 
           onClick={submitAction}
           disabled={isPending || credits < cost}
           className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all flex flex-col justify-center items-center gap-1 disabled:opacity-50"
        >
          {isPending ? <div className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Procesare Video AI...</div> : <span className="flex items-center justify-center gap-2">Lansează Generator Video AI</span>}
          {!isPending && <span className="text-xs text-white/70 flex items-center gap-1 mt-1 font-normal"><Coins size={12}/> Cost: {cost} credite (Balanță: {credits})</span>}
        </button>
      </div>

      <div className="bg-black/30 rounded-2xl border border-white/10 flex items-center justify-center p-6 min-h-[400px] relative overflow-hidden">
        {result ? (
           <>
               <video src={result} controls autoPlay loop className="w-full h-full object-contain rounded-xl bg-black relative z-10" />
               <button onClick={() => handleDownload(result, 'video_staging_imobum.mp4')} className="absolute top-8 right-8 bg-black/60 hover:bg-black/80 border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 backdrop-blur-md transition-all text-sm font-semibold shadow-2xl z-20">
                  <Download className="w-4 h-4"/> Descărcare
              </button>
           </>
        ) : (
            <div className="text-center">
              {isPending ? (
                   <>
                     <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
                     <p className="text-slate-400 animate-pulse">Randare Video Cinematic...</p>
                   </>
                ) : (
                   <>
                      <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-500">Player-ul video va fi disponibil aici...</p>
                   </>
              )}
            </div>
        )}
      </div>
    </div>
  );
}

function Plan3DTool() {
  const [isPending, startTransition] = useTransition();
  const { credits, costs } = useContext(CreditsContext);
  const cost = costs['ai_plan_3d'] || 0;
  const [provider, setProvider] = useState('replicate');
  const [apiKey, setApiKey] = useState('');
  
  const [planUrl, setPlanUrl] = useState('');
  const [perspective, setPerspective] = useState('Top-Down');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const submitAction = () => {
    if (!planUrl) { setError('Încărcați Planul 2D.'); return; }
    setError('');
    startTransition(async () => {
      const res = await generate3DPlan({ planUrl, perspective }, provider, apiKey);
      if (res.error) setError(res.error);
      else setResult(res.resultUrl || '');
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <ProviderSettings 
          providerList={[{id: 'replicate', name: 'Replicate API'}, {id: 'controlnet', name: 'ControlNet / SD'}]}
          onProviderChange={setProvider}
          onKeyChange={setApiKey}
        />

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Încarcă Planul de Bază (Schiță/CAD 2D)</label>
          <FileUploader 
             label="Încarcă Plan 2D" 
             accept="image/*,.pdf" 
             onUploadComplete={u => setPlanUrl(u[0])}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Calitate Generare & Unghi</label>
          <select value={perspective} onChange={e => setPerspective(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500/50 mb-4">
            <optgroup className="bg-slate-900 text-white">
               <option>Top-Down (Vedere de sus 3D)</option>
               <option>Isometric (Unghi 45 grade)</option>
            </optgroup>
          </select>
          <div className="flex items-start gap-3 bg-black/20 p-4 rounded-xl border border-white/5 text-sm text-slate-300">
            <Settings className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p>AI-ul va scana pereții, ferestrele și ușile automat. Durează aprox 30-60 de secunde.</p>
          </div>
        </div>

        {error && <div className="text-red-400 bg-red-500/10 p-3 rounded-xl text-sm border border-red-500/20">{error}</div>}

        <button 
          onClick={submitAction}
          disabled={isPending || credits < cost}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 flex-col disabled:opacity-50"
        >
          {isPending ? <div className="flex items-center gap-2"><><Loader2 className="w-5 h-5 animate-spin" /> Extragere Pereți...</></div> : <span className="flex items-center gap-2">Converteste în Plan 3D Mochetat</span>}
          {!isPending && <span className="text-xs text-white/70 flex items-center gap-1 mt-1 font-normal"><Coins size={12}/> Cost: {cost} credite (Balanță: {credits})</span>}
        </button>
      </div>

      <div className="bg-black/30 rounded-2xl border border-white/10 flex items-center justify-center p-6 min-h-[400px] relative overflow-hidden">
        {result ? (
           <>
              <img src={result} alt="3D Plan Result" className="w-full h-full object-contain rounded-xl relative z-10" />
              <button onClick={() => handleDownload(result, '3d_plan_imobum.png')} className="absolute top-8 right-8 bg-black/60 hover:bg-black/80 border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 backdrop-blur-md transition-all text-sm font-semibold shadow-2xl z-20">
                  <Download className="w-4 h-4"/> Descărcare
              </button>
           </>
        ) : (
           <div className="text-center">
             {isPending ? (
                 <>
                   <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
                   <p className="text-slate-400 animate-pulse">Generare randare 3D în progres...</p>
                 </>
              ) : (
                 <>
                    <Layers className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500">Analiza AI a planului și rezultatul 3D vor apărea aici...</p>
                 </>
            )}
            </div>
        )}
      </div>
    </div>
  );
}

function DescriptionGenTool() {
  const [isPending, startTransition] = useTransition();
  const { credits, costs } = useContext(CreditsContext);
  const cost = costs['ai_description'] || 0;
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  
  // New States matching the picture
  const [propertyType, setPropertyType] = useState('Apartament');
  const [surface, setSurface] = useState('');
  const [rooms, setRooms] = useState('2');
  const [location, setLocation] = useState('');
  const [features, setFeatures] = useState('');
  const [tone, setTone] = useState('Profesional');
  const [destination, setDestination] = useState('Portal imobiliar');

  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const submitAction = () => {
    if (!features && !surface && !location) { 
        setError('Introduceți câteva detalii.'); 
        return; 
    }
    setError('');
    startTransition(async () => {
      const res = await generateDescription({ propertyType, surface, rooms, location, features, tone, destination }, provider, apiKey);
      if (res.error) setError(res.error);
      else setResult(res.resultText || '');
    });
  };

  const renderPills = (options: string[], currentValue: string, setter: (val: string) => void) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => setter(opt)}
          className={`px-4 py-2 rounded-full text-sm border transition-all ${
            currentValue === opt 
              ? 'border-yellow-600 text-yellow-500 bg-yellow-500/10 shadow-[0_0_10px_rgba(202,138,4,0.15)]' 
              : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-300 bg-transparent'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <ProviderSettings 
          providerList={[{id: 'openai', name: 'OpenAI (ChatGPT)'}, {id: 'anthropic', name: 'Anthropic (Claude)'}, {id: 'gemini', name: 'Google Gemini'}]}
          onProviderChange={setProvider}
          onKeyChange={setApiKey}
        />

        <div className="bg-[#161513] border border-yellow-900/30 rounded-2xl p-6 space-y-6">
           <h3 className="text-yellow-600 font-semibold text-xs tracking-widest uppercase mb-4">Detalii Proprietate</h3>
           
           <div>
             <label className="block text-xs text-slate-400 uppercase tracking-widest">Tip Proprietate</label>
             {renderPills(['Apartament', 'Casă/Vilă', 'Teren', 'Comercial'], propertyType, setPropertyType)}
           </div>

           <div>
             <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Suprafață (MP)</label>
             <input type="text" value={surface} onChange={e => setSurface(e.target.value)} placeholder="ex: 82" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-yellow-500/50 text-sm" />
           </div>

           <div>
             <label className="block text-xs text-slate-400 uppercase tracking-widest">Camere</label>
             {renderPills(['1', '2', '3', '4', '5+'], rooms, setRooms)}
           </div>

           <div>
             <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Zonă / Adresă</label>
             <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="ex: Floreasca, București" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-yellow-500/50 text-sm" />
           </div>

           <div>
             <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Caracteristici Cheie (Separat prin virgulă)</label>
             <textarea rows={3} value={features} onChange={e => setFeatures(e.target.value)} placeholder="ex: renovat 2024, parcare, vedere la parc, aer condiționat, centrală proprie, condominium lux" className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-yellow-500/50 resize-none text-sm"></textarea>
           </div>

           <div>
             <label className="block text-xs text-slate-400 uppercase tracking-widest">Tonul Descrierii</label>
             {renderPills(['Profesional', 'Premium/Lux', 'Accesibil', 'Tehnic/Detaliat'], tone, setTone)}
           </div>

           <div>
             <label className="block text-xs text-slate-400 uppercase tracking-widest">Destinație Anunț</label>
             {renderPills(['Portal imobiliar', 'Social Media', 'Email client'], destination, setDestination)}
           </div>

           {error && <div className="text-red-400 bg-red-500/10 p-3 rounded-xl text-sm border border-red-500/20">{error}</div>}

           <button 
             onClick={submitAction}
             disabled={isPending || credits < cost}
             className="w-full py-4 bg-[#D4AF7A] hover:bg-[#C29F6E] text-black font-semibold rounded-xl shadow-[0_0_15px_rgba(212,175,122,0.15)] transition-all flex flex-col items-center justify-center gap-1 mt-4 disabled:opacity-50"
           >
             {isPending ? <div className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Generare Descriere...</div> : <span className="flex items-center justify-center gap-2">Generează descriere AI</span>}
             {!isPending && <span className="text-xs text-black/70 flex items-center gap-1 mt-1 font-normal"><Coins size={12}/> Cost: {cost} credite (Balanță: {credits})</span>}
           </button>
        </div>
      </div>

      <div className="bg-[#161513] rounded-2xl border border-yellow-900/30 p-6 flex flex-col min-h-[400px]">
        <label className="block text-xs font-semibold text-yellow-600 mb-4 border-b border-white/5 pb-4 uppercase tracking-widest">
          Descrierea Generată 
        </label>
        
        <div className="flex-1 border border-white/5 bg-black/20 rounded-xl p-4 mb-4 relative overflow-y-auto custom-scrollbar">
            {result ? (
               <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{result}</div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-center">
                    {isPending ? (
                        <div>
                           <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mx-auto mb-4" />
                           <p className="text-slate-400 text-sm animate-pulse">AI scrie anunțul perfect pentru tine...</p>
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm italic px-4">Descrierea proprietății va apărea aici după generare...</p>
                    )}
                </div>
            )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-auto">
           <button 
              onClick={async () => {
                  if (result) {
                      const success = await copyToClipboardSafe(result);
                      if (success) {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                      }
                  }
              }} 
              className="py-3 px-4 bg-[#D4AF7A] hover:bg-[#C29F6E] text-black border border-[#D4AF7A] font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
           >
              {copied ? '✅ Copiat' : '📄 Copiază'}
           </button>
           <button onClick={submitAction} disabled={!result || isPending} className="py-3 px-4 bg-transparent border border-white/10 hover:bg-white/5 text-slate-300 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
              🔄 Regenerează
           </button>
        </div>
      </div>
    </div>
  );
}

function RoomBuilderTool() {
  const [isPending, startTransition] = useTransition();
  const { credits, costs } = useContext(CreditsContext);
  const cost = costs['ai_room_builder'] || 0;
  const [provider, setProvider] = useState('replicate');
  const [apiKey, setApiKey] = useState('');
  
  const [imageUrl, setImageUrl] = useState('');
  const [speed, setSpeed] = useState(1.5);
  const [pan, setPan] = useState(true);
  
  // New States matching picture
  const [selectedFurniture, setSelectedFurniture] = useState<string[]>([]);
  const [ambientColor, setAmbientColor] = useState('Cald');

  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const submitAction = () => {
    if (!imageUrl) { setError('Încărcați o imagine inițială.'); return; }
    if (selectedFurniture.length === 0) { setError('Selectați cel puțin o piesă de mobilier.'); return; }
    setError('');
    startTransition(async () => {
      const res = await generateRoomAnimation({ imageUrl, speed, pan, selectedFurniture, ambientColor }, provider, apiKey);
      if (res.error) setError(res.error);
      else setResult(res.resultUrl || '');
    });
  };

  const toggleFurniture = (id: string) => {
    if (selectedFurniture.includes(id)) {
        setSelectedFurniture(prev => prev.filter(f => f !== id));
    } else {
        setSelectedFurniture(prev => [...prev, id]);
    }
  };

  const renderFurnitureGrid = (items: {id: string, icon: string}[]) => (
    <div className="grid grid-cols-2 gap-3">
        {items.map(item => {
            const isActive = selectedFurniture.includes(item.id);
            return (
                <button
                   key={item.id}
                   onClick={() => toggleFurniture(item.id)}
                   className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                       isActive 
                         ? 'border-pink-500 bg-pink-500/5 shadow-[0_0_15px_rgba(236,72,153,0.1)]'
                         : 'border-white/10 bg-[#1A1816]/50 hover:bg-black/60 hover:border-white/30'
                   }`}
                >
                   <span className="text-2xl drop-shadow-md">{item.icon}</span>
                   <span className={`text-xs ${isActive ? 'text-pink-400 font-medium' : 'text-slate-400'}`}>{item.id}</span>
                </button>
            )
        })}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Furniture Sidebar Scrollable Panel */}
      <div className="bg-[#1C1A17] border border-yellow-900/30 rounded-2xl p-6 h-fit max-h-[850px] overflow-y-auto custom-scrollbar space-y-6">
         <div>
            <h3 className="text-yellow-600 font-bold text-[11px] tracking-widest uppercase mb-2">Mobilier Disponibil</h3>
            <p className="text-slate-400 text-xs mb-4">Click pe piese pentru a le adăuga în animație</p>
         </div>

         <div>
             <h4 className="text-yellow-600/80 font-bold text-[10px] tracking-widest uppercase mb-3">Living / Dining</h4>
             {renderFurnitureGrid([
                 {id: 'Canapea', icon: '🛋️'}, {id: 'Fotoliu', icon: '🪑'}, {id: 'TV', icon: '📺'},
                 {id: 'Plantă', icon: '🪴'}, {id: 'Măsuță', icon: '☕'}, {id: 'Tablou', icon: '🖼️'},
                 {id: 'Lampă', icon: '💡'}, {id: 'Oglindă', icon: '🪞'}
             ])}
         </div>

         <div>
             <h4 className="text-yellow-600/80 font-bold text-[10px] tracking-widest uppercase mb-3 mt-6">Dormitor</h4>
             {renderFurnitureGrid([
                 {id: 'Pat', icon: '🛏️'}, {id: 'Noptieră', icon: '🗄️'}, {id: 'Șifonier', icon: '👔'},
                 {id: 'Oglindă', icon: '🪞'}, {id: 'Veioză', icon: '💡'}, {id: 'Plantă ', icon: '🪴'}
             ])}
         </div>

         <div>
             <h4 className="text-yellow-600/80 font-bold text-[10px] tracking-widest uppercase mb-3 mt-6">Decor & Lumini</h4>
             {renderFurnitureGrid([
                 {id: 'Lumânări', icon: '🕯️'}, {id: 'Artă', icon: '🎨'}, {id: 'Cărți', icon: '📚'},
                 {id: 'Perdele', icon: '🪟'}, {id: 'Coș', icon: '🧺'}, {id: 'Flori', icon: '🌸'},
                 {id: 'Ceas', icon: '🕰️'}, {id: 'Covor', icon: '🛁'}
             ])}
         </div>

         <div>
            <h4 className="text-yellow-600/80 font-bold text-[10px] tracking-widest uppercase mb-3 mt-6">Culoare Ambient</h4>
            <div className="flex flex-wrap gap-2">
                {['Cald', 'Rece', 'Neutru', 'Dramatic'].map(color => (
                    <button
                        key={color}
                        onClick={() => setAmbientColor(color)}
                        className={`px-4 py-2 rounded-full text-xs border transition-all ${
                            ambientColor === color
                              ? 'border-yellow-500 text-yellow-500'
                              : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-300'
                        }`}
                    >
                        {color}
                    </button>
                ))}
            </div>
         </div>
      </div>

      <div className="col-span-1 lg:col-span-2 space-y-6">
        <ProviderSettings 
          providerList={[{id: 'replicate', name: 'Replicate API'}, {id: 'runway', name: 'Runway API'}]}
          onProviderChange={setProvider}
          onKeyChange={setApiKey}
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Încarcă Imagine (Spațiu Nemobilat)</label>
                  <FileUploader 
                     label="Imagine Spațiu Gol" 
                     accept="image/*" 
                     onUploadComplete={(u) => setImageUrl(u[0])}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Viteză Animație & Efecte</label>
                  <div className="space-y-4 bg-black/20 p-5 rounded-xl border border-white/5">
                    <div>
                       <div className="flex justify-between text-xs text-slate-400 mb-2">
                         <span>Viteză Apariție</span>
                         <span>{speed.toFixed(1)} sec / obiect</span>
                       </div>
                       <input 
                         type="range" 
                         min="0.5" max="3" step="0.1" 
                         value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                         className="w-full accent-pink-500 bg-black/50 rounded-full appearance-none h-2 cursor-pointer border border-white/5"
                       />
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <input type="checkbox" id="camera-movement" checked={pan} onChange={(e) => setPan(e.target.checked)} className="w-4 h-4 accent-pink-500 rounded bg-black/50" />
                      <label htmlFor="camera-movement" className="text-slate-300 text-sm cursor-pointer">Adaugă efect de Zoom In (Camera Pan)</label>
                    </div>
                  </div>
                </div>

                {error && <div className="text-red-400 bg-red-500/10 p-3 rounded-xl text-sm border border-red-500/20">{error}</div>}

                <button 
          onClick={submitAction}
          disabled={isPending || credits < cost}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all flex items-center justify-center gap-2 flex-col disabled:opacity-50"
        >
          {isPending ? <div className="flex items-center gap-2"><><Loader2 className="w-5 h-5 animate-spin" /> Se asamblează elementele...</></div> : <span className="flex items-center gap-2">Pornește Generatorul de Animație</span>}
          {!isPending && <span className="text-xs text-white/70 flex items-center gap-1 mt-1 font-normal"><Coins size={12}/> Cost: {cost} credite (Balanță: {credits})</span>}
        </button>
            </div>

            <div className="bg-black/30 rounded-2xl border border-white/10 flex items-center justify-center p-6 min-h-[400px] relative overflow-hidden">
                {result ? (
           <>
               <video src={result} controls autoPlay loop className="w-full h-full rounded-xl bg-black relative z-10" />
               <button onClick={() => handleDownload(result, 'room_builder_imobum.mp4')} className="absolute top-8 right-8 bg-black/60 hover:bg-black/80 border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 backdrop-blur-md transition-all text-sm font-semibold shadow-2xl z-20">
                  <Download className="w-4 h-4"/> Descărcare
              </button>
           </>
        ) : (
                    <div className="text-center px-4">
                      {isPending ? (
                          <>
                            <Loader2 className="w-16 h-16 text-pink-500 animate-spin mx-auto mb-4" />
                            <p className="text-slate-400 animate-pulse">Analiză flux spațial în curs...</p>
                          </>
                      ) : (
                          <>
                             <Wand2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                             <p className="text-slate-500 text-sm">Animația va fi procesată și validată aici...</p>
                          </>
                      )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
