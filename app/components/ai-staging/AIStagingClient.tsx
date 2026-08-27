"use client";

import React, { useState, useTransition, useEffect, createContext, useContext } from 'react';
import { 
  Wand2, Video, FileImage, FileText, 
  Layers, UploadCloud, Settings, ChevronRight, 
  Sparkles, CheckCircle2, Sliders, Image as ImageIcon, Camera, Building, Sofa, Loader2, Download,
  Save, Eye, EyeOff, X, RefreshCw, Sun, Moon, Maximize2, HelpCircle, Info, ShieldCheck, Coins
} from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import { 
  generateVirtualStaging, 
  generateVideo, 
  generate3DPlan, 
  generateDescription, 
  generateRoomAnimation,
  generateWalkthroughVideo,
  analyzeFloorplanAction,
  optimizeWalkthroughPromptAction,
  uploadAIFileAction
} from '@/app/lib/actions/ai-staging';
import { getFeatureCosts, saveSingleAIKey } from '@/app/lib/actions/settings';
import { copyToClipboardSafe } from '@/app/lib/utils/clipboard';

export const CreditsContext = createContext<{credits: number, costs: Record<string, number>, canUseCustomKeys: boolean, userRole: string}>({credits: 0, costs: {}, canUseCustomKeys: true, userRole: 'user'});

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
  },
  {
    id: 'walkthrough-video',
    title: 'AI Floorplan Walkthrough — Video 3D',
    subtitle: 'Transformă schița 2D sau planul 3D într-un video walkthrough cinematic de prezentare a apartamentului',
    icon: Building,
    color: 'from-amber-500 to-orange-400'
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
  const [canUseCustomKeys, setCanUseCustomKeys] = useState(
    userRole === 'admin' || userRole === 'super_admin' || userRole === 'superadmin'
  );

  useEffect(() => {
    supabase.auth.getUser().then(async ({data: {user}}) => {
        if (!user) return;
        const { data: p } = await supabase.from('profiles').select('credits, role, plan_tier').eq('id', user.id).single();
        if (p) {
          setCredits(p.credits || 0);
          const isAdmin = p.role === 'admin' || p.role === 'super_admin' || p.role === 'superadmin';
          if (isAdmin) {
            setCanUseCustomKeys(true);
          } else {
            const { data: pf } = await supabase
              .from('plan_features')
              .select('is_included')
              .eq('role', p.role)
              .eq('plan_name', p.plan_tier || 'free')
              .eq('feature_key', 'ai_custom_api_keys')
              .maybeSingle();
            
            setCanUseCustomKeys(!!pf?.is_included);
          }
        }

        const costsRes = await getFeatureCosts();
        if (costsRes.costs) setCosts(costsRes.costs);
    });
  }, [userRole]);

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
      case 'walkthrough-video':
        return <WalkthroughVideoTool />;
      default:
        return null;
    }
  };

  return (
    <CreditsContext.Provider value={{credits, costs, canUseCustomKeys, userRole}}>
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
// Helper to compress image if > 1.5MB before uploading
async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size < 1.5 * 1024 * 1024) {
    return file;
  }
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const maxDim = 2048;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.88);
        } else {
          resolve(file);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

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
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; name: string; isPdf?: boolean }[]>([]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newItems: { url: string; name: string; isPdf?: boolean }[] = multiple ? [...uploadedFiles] : [];

    try {
      for (const rawFile of Array.from(files)) {
        const file = await compressImageIfNeeded(rawFile);
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        try {
          // Direct client-side Supabase Storage upload (bypasses serverless size limits)
          const fileExt = file.name.split('.').pop() || (isPdf ? 'pdf' : 'jpg');
          const fileName = `ai_uploads/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { data, error: uploadErr } = await supabase.storage
            .from('property-images')
            .upload(fileName, file, { upsert: true });

          if (!uploadErr && data?.path) {
            const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(data.path);
            newItems.push({ url: publicUrl, name: file.name, isPdf });
          } else {
            // Fallback via server action
            const formData = new FormData();
            formData.append('file', file);
            const res = await uploadAIFileAction(formData);

            if (res.success && res.url) {
              newItems.push({ url: res.url, name: file.name, isPdf });
            } else {
              // Local blob url fallback for visual preview
              const localBlob = URL.createObjectURL(file);
              newItems.push({ url: localBlob, name: file.name, isPdf });
            }
          }
        } catch (innerError) {
          const localBlob = URL.createObjectURL(file);
          newItems.push({ url: localBlob, name: file.name, isPdf });
        }
      }

      setUploadedFiles(newItems);
      onUploadComplete(newItems.map(item => item.url));
    } catch (error: any) {
      console.error('Error uploading:', error);
      alert('Eroare la încărcare: ' + (error?.message || 'Verificați fișierul selectat.'));
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updated);
    onUploadComplete(updated.map(item => item.url));
  };

  return (
    <div className="space-y-3">
      {uploadedFiles.length === 0 || multiple ? (
        <label className="border-2 border-dashed border-white/20 hover:border-amber-400/50 bg-black/20 rounded-2xl p-6 text-center transition-all cursor-pointer group hover:bg-black/40 block">
          {uploading ? (
             <div className="flex flex-col items-center justify-center py-3">
               <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-2" />
               <p className="text-slate-300 font-medium text-xs">Se optimizează și se încarcă fișierul...</p>
             </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2.5 group-hover:bg-amber-500/20 group-hover:scale-110 transition-all duration-300">
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-amber-400" />
              </div>
              <h4 className="text-sm font-medium text-slate-200 mb-1">{label}</h4>
              <p className="text-[11px] text-slate-500 mb-3">Schițe 2D, Planuri Arhitectură, Axonometrii 3D sau PDF</p>
              <div className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors border border-white/10 inline-block pointer-events-none">
                Selectează Fișierul
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
      ) : null}

      {/* Visual Preview Card */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((fileItem, idx) => (
            <div key={idx} className="bg-black/50 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg group">
              <div className="flex items-center gap-3 min-w-0">
                {fileItem.isPdf ? (
                  <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-red-400 mb-1" />
                    <span className="text-[9px] font-bold text-red-400">PDF</span>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-slate-900 flex-shrink-0 relative shadow-inner">
                    <img src={fileItem.url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <p className="text-xs font-semibold text-slate-200 truncate">{fileItem.name}</p>
                  </div>
                  <p className="text-[11px] text-emerald-400/90 mt-0.5 font-medium">Schiță încărcată & gata de procesare</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-lg transition-colors border border-white/10 text-xs flex items-center gap-1"
                  title="Elimină și alege alt fișier"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Schimbă</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Provider Settings Component with Save API Key button
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
  const [selectedProvider, setSelectedProvider] = useState(providerList[0]?.id || 'replicate');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getKeyName = (id: string) => {
    if (id === 'gemini' || id === 'google') return 'gemini_api_key';
    if (id === 'replicate' || id === 'controlnet') return 'replicate_api_token';
    if (id === 'fal' || id === 'falai') return 'fal_api_key';
    if (id === 'openai') return 'openai_api_key';
    if (id === 'runway') return 'runway_api_secret';
    return `${id}_api_key`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const keyName = getKeyName(selectedProvider);
      const localKey = localStorage.getItem('ai_provider_key_' + keyName) || '';
      setApiKey(localKey);
      onKeyChange(localKey);
      onProviderChange(selectedProvider);
      setIsSaved(false);
    }
  }, [selectedProvider]);

  const handleProviderSelect = (p: string) => {
    setSelectedProvider(p);
    onProviderChange(p);
  };

  const handleKeyInput = (val: string) => {
    setApiKey(val);
    onKeyChange(val);
    setIsSaved(false);
  };

  const handleSaveKey = async () => {
    setIsSaving(true);
    const keyName = getKeyName(selectedProvider);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_provider_key_' + keyName, apiKey);
      }
      await saveSingleAIKey(keyName, apiKey);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch (e) {
      console.warn('Error saving API key:', e);
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-5 mb-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
          <Settings className="w-4 h-4 text-indigo-400" />
          <span>Configurare Furnizor AI (API)</span>
        </div>
        {isSaved && (
          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Cheie Salvată!
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Furnizor AI
          </label>
          <select 
            value={selectedProvider}
            onChange={(e) => handleProviderSelect(e.target.value)} 
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
          >
            {providerList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Cheie API (Secret Key)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type={showKey ? "text" : "password"} 
                value={apiKey}
                placeholder="sk-... sau token API"
                onChange={(e) => handleKeyInput(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-mono"
              />
              <button 
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSaveKey}
              disabled={isSaving}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors flex-shrink-0 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
              title="Salvează cheia API pentru acest furnizor"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvare...' : 'Salvează'}</span>
            </button>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mt-2">
        💡 <span className="italic">Opțional: dacă lăsați câmpul gol, platforma va utiliza automat cheia Master configurată global de Superadmin.</span>
      </p>
    </div>
  );
}

// ----------------------------------------------------
// Sub-components for each tool
// ----------------------------------------------------

function VirtualStagingTool() {
  const [isPending, startTransition] = useTransition();
  const { credits, costs, canUseCustomKeys } = useContext(CreditsContext);
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
      try {
        const res = await generateVirtualStaging({ imageUrl, roomType, style, additionalOptions }, provider, apiKey);
        if (res.error) setError(res.error);
        else setResult(res.resultUrl || '');
      } catch (err: any) {
        console.error('VirtualStaging error:', err);
        setError(err.message || 'A apărut o eroare la procesare.');
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        {canUseCustomKeys ? (
        <ProviderSettings 
          providerList={[{id: 'replicate', name: 'Replicate API'}, {id: 'falai', name: 'Fal.ai API'}, {id: 'midjourney', name: 'Midjourney API'}]}
          onProviderChange={setProvider}
          onKeyChange={setApiKey}
        />
      ) : (
        <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between text-xs text-slate-300 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Serviciul AI este alimentat direct de platformă. Generările consumă credite din balanța contului tău.</span>
          </div>
          <span className="font-semibold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 text-[11px] flex-shrink-0">
            Mod Asistat
          </span>
        </div>
      )}

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
  const { credits, costs, canUseCustomKeys } = useContext(CreditsContext);
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
        {canUseCustomKeys ? (
        <ProviderSettings 
          providerList={[{id: 'replicate', name: 'Replicate API'}, {id: 'luma', name: 'Luma Dream Machine'}, {id: 'runway', name: 'Runway Gen-3'}]}
          onProviderChange={setProvider}
          onKeyChange={setApiKey}
        />
      ) : (
        <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between text-xs text-slate-300 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Serviciul AI este alimentat direct de platformă. Generările consumă credite din balanța contului tău.</span>
          </div>
          <span className="font-semibold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 text-[11px] flex-shrink-0">
            Mod Asistat
          </span>
        </div>
      )}

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

function WalkthroughVideoTool() {
  const [isPending, startTransition] = useTransition();
  const [isAnalyzingPlan, setIsAnalyzingPlan] = useState(false);
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [showAdminGuide, setShowAdminGuide] = useState(false);
  const { credits, costs, canUseCustomKeys, userRole } = useContext(CreditsContext);
  
  const analysisCost = costs['ai_walkthrough_analysis'] || 0;
  const standardVideoCost = costs['ai_walkthrough_video'] || 10;
  const extendedVideoCost = costs['ai_walkthrough_video_extended'] || 18;
  const voiceoverCost = costs['ai_walkthrough_voiceover'] || 0;

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');

  const [planUrl, setPlanUrl] = useState('');
  const [style, setStyle] = useState('Modern Lux');
  const [tourMode, setTourMode] = useState('Tur 1st Person (Ochiul liber)');
  const [videoFormat, setVideoFormat] = useState('16:9 (YouTube/site)');
  const [duration, setDuration] = useState('5-8 secunde (HD Rapid)');
  const [ambience, setAmbience] = useState('Lumină Naturală de Zi');
  const [focusRooms, setFocusRooms] = useState<string[]>(['Living + Bucătărie', 'Dormitor Matrimonial', 'Terasă']);
  const [enableVoiceover, setEnableVoiceover] = useState(true);

  const [spatialAnalysis, setSpatialAnalysis] = useState<{
    detectedRooms?: string[];
    spatialSummary?: string;
    furnitureDetails?: string;
    cameraFlightPath?: string;
  } | null>(null);

  const [promptText, setPromptText] = useState(
    'Cinematic 1080p 3D architectural walkthrough video, Modern Lux interior design, Tur 1st Person (Ochiul liber) camera path, Lumină Naturală de Zi, prioritizing Living + Bucătărie, Dormitor Matrimonial, Terasă, Unreal Engine 5 render, raytracing reflections, photorealistic textures, smooth camera transitions.'
  );

  const [result, setResult] = useState('');
  const [script, setScript] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const durationOptions = provider === 'gemini' 
    ? ['5-8 secunde (HD Rapid - Google Veo)', '8 secunde (Cinematic - Google Veo)']
    : ['5 secunde (Kling AI Standard)', '10 secunde (Kling AI Extended)'];

  const isExtended = duration.includes('10') || duration.includes('30');
  const activeVideoCost = isExtended ? extendedVideoCost : standardVideoCost;
  const totalCost = activeVideoCost + (enableVoiceover ? voiceoverCost : 0);

  const handleAnalyzeFloorplan = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl || planUrl;
    if (!targetUrl) {
      setError('Vă rugăm să încărcați o schiță 2D sau un plan/axonometrie 3D.');
      return;
    }
    setError('');
    setIsAnalyzingPlan(true);
    try {
      const res = await analyzeFloorplanAction({
        planUrl: targetUrl,
        style,
        tourMode,
        ambience,
        focusRooms,
        videoFormat,
        duration
      }, provider, apiKey);

      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setSpatialAnalysis(res.data);
        if (res.data.detectedRooms && res.data.detectedRooms.length > 0) {
          setFocusRooms(res.data.detectedRooms);
        }
        if (res.data.optimizedPrompt) {
          setPromptText(res.data.optimizedPrompt);
        }
      }
    } catch (e: any) {
      console.warn('Error analyzing floorplan:', e);
      setError(e.message || 'Eroare la analiza schiței.');
    } finally {
      setIsAnalyzingPlan(false);
    }
  };

  const handleOptimizePrompt = async () => {
    setIsOptimizingPrompt(true);
    try {
      const res = await optimizeWalkthroughPromptAction({
        planUrl,
        style,
        tourMode,
        ambience,
        focusRooms,
        spatialContext: spatialAnalysis ? `${spatialAnalysis.spatialSummary} | Mobilier: ${spatialAnalysis.furnitureDetails}` : undefined,
        details: 'Apartament identificat pe baza schiței atașate'
      }, provider, apiKey);

      if (res.prompt) {
        setPromptText(res.prompt);
      }
    } catch (e) {
      console.warn('Error optimizing prompt:', e);
    } finally {
      setIsOptimizingPrompt(false);
    }
  };

  const toggleFocusRoom = (room: string) => {
    if (focusRooms.includes(room)) {
      setFocusRooms(prev => prev.filter(r => r !== room));
    } else {
      setFocusRooms(prev => [...prev, room]);
    }
  };

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [savedGenerations, setSavedGenerations] = useState<Array<{
    id: string;
    url: string;
    script?: string;
    style: string;
    date: string;
    providerName: string;
  }>>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('imobum_ai_walkthrough_gallery');
      if (stored) {
        setSavedGenerations(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not load AI walkthrough gallery:', e);
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (isPending) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPending]);

  const submitAction = () => {
    if (!planUrl) { setError('Vă rugăm să încărcați o schiță 2D sau un plan 3D.'); return; }
    setError('');
    startTransition(async () => {
      try {
        const res = await generateWalkthroughVideo({
          planUrl,
          style,
          tourMode,
          videoFormat,
          enableVoiceover,
          duration,
          customPrompt: promptText,
          ambience,
          focusRooms
        }, provider, apiKey);

        if (res.error) {
          setError(res.error);
        } else if (res.resultUrl) {
          setResult(res.resultUrl);
          setScript(res.narrationScript || '');

          const newEntry = {
            id: Date.now().toString(),
            url: res.resultUrl,
            script: res.narrationScript,
            style: `${style} (${tourMode})`,
            date: new Date().toLocaleString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
            providerName: res.provider || (provider === 'gemini' ? 'Google Veo 3.1' : 'Fal.ai Kling AI')
          };

          setSavedGenerations(prev => {
            const updated = [newEntry, ...prev.filter(g => g.url !== res.resultUrl)].slice(0, 10);
            try {
              localStorage.setItem('imobum_ai_walkthrough_gallery', JSON.stringify(updated));
            } catch (e) {
              console.warn('Could not save to localStorage gallery:', e);
            }
            return updated;
          });
        }
      } catch (err: any) {
        console.error('WalkthroughVideo error:', err);
        setError(err.message || 'A apărut o eroare la procesare.');
      }
    });
  };

  const renderPills = (items: string[], current: string, setter: (val: string) => void) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map(item => (
        <button
          key={item}
          type="button"
          onClick={() => setter(item)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            current === item
              ? 'border-amber-400 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full space-y-8">
      {isAdmin && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAdminGuide(!showAdminGuide)}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer shadow-lg"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>{showAdminGuide ? 'Ascunde Ghid Superadmin' : '❓ Cum funcționează? Ghid Superadmin: AI Video, Credite & Costuri'}</span>
            </button>
            <span className="text-[11px] text-amber-400/70 font-mono">Vizibil doar pentru Administrator</span>
          </div>

          {showAdminGuide && (
            <div className="bg-[#181410] border border-amber-500/30 rounded-2xl p-6 space-y-5 text-xs text-slate-300 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 pb-3 border-b border-amber-500/20 text-amber-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Ghid Administrativ: Structura pe 2 Pași, Durate Video & Matricea de Credite</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5 bg-black/30 p-4 rounded-xl border border-white/5">
                  <h4 className="text-amber-300 font-bold flex items-center gap-1.5">
                    <span>1. De ce Arhitectură în 2 Pași?</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed text-[11.5px]">
                    <li>
                      <strong className="text-white">Pasul 1 (Analiză Schiță):</strong> Gemini Vision scanează poza, identifică camerele reale și mobilierul real fără a inventa elemente străine.
                    </li>
                    <li>
                      <strong className="text-white">Pasul 2 (Randare Video):</strong> Utilizatorul verifică promptul fidel schiței, iar motorul video generează turul 3D exact după geometria recunoscută.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2.5 bg-black/30 p-4 rounded-xl border border-white/5">
                  <h4 className="text-amber-300 font-bold flex items-center gap-1.5">
                    <span>2. Capabilități Durată & Modele Video AI</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed text-[11.5px]">
                    <li>
                      <strong className="text-white">Google Veo 3.1:</strong> Generează secvențe native de <strong>5–8 secunde</strong> (1080p Full HD).
                    </li>
                    <li>
                      <strong className="text-white">Fal.ai (Kling AI):</strong> Suportă mod <strong>5 secunde (Standard)</strong> sau <strong>10 secunde (Extended)</strong>.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <h4 className="text-amber-300 font-bold text-xs uppercase tracking-wider">
                  3. Matricea Costurilor în Credite Platformă
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border border-white/10 rounded-xl overflow-hidden">
                    <thead className="bg-white/5 text-slate-200">
                      <tr>
                        <th className="p-2.5">Acțiune / Pas</th>
                        <th className="p-2.5">Cheie Setare</th>
                        <th className="p-2.5">Cost Credite</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      <tr className="bg-amber-500/5">
                        <td className="p-2.5 font-bold text-amber-300">Pasul 1: Analiză Schiță Gemini Vision</td>
                        <td className="p-2.5 font-mono text-[10.5px]">ai_walkthrough_analysis</td>
                        <td className="p-2.5 font-semibold text-emerald-400">{analysisCost} credite</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-200">Pasul 2: Video Walkthrough Standard (5–8s)</td>
                        <td className="p-2.5 font-mono text-[10.5px]">ai_walkthrough_video</td>
                        <td className="p-2.5 font-semibold text-amber-400">{standardVideoCost} credite</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-200">Pasul 2: Video Walkthrough Extins (10s)</td>
                        <td className="p-2.5 font-mono text-[10.5px]">ai_walkthrough_video_extended</td>
                        <td className="p-2.5 font-semibold text-amber-400">{extendedVideoCost} credite</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-200">Opțional: Generare Scenariu Voiceover</td>
                        <td className="p-2.5 font-mono text-[10.5px]">ai_walkthrough_voiceover</td>
                        <td className="p-2.5 font-semibold text-cyan-400">{voiceoverCost} credite</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {canUseCustomKeys ? (
        <ProviderSettings 
          providerList={[
            {id: 'gemini', name: 'Google Veo 3.1 (Google DeepMind) — Fast & HD (5-8s)'},
            {id: 'fal', name: 'Fal.ai API (Kling AI) — Cinematic Motion (5-10s)'},
            {id: 'replicate', name: 'Replicate API (Flux / Luma)'},
            {id: 'runway', name: 'Runway Gen-3 API'}
          ]}
          onProviderChange={setProvider}
          onKeyChange={setApiKey}
        />
      ) : (
        <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-300 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Serviciul AI este alimentat direct de platformă. Generările consumă credite din balanța contului tău.</span>
          </div>
          <span className="font-semibold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 text-[11px] flex-shrink-0">
            Mod Asistat
          </span>
        </div>
      )}

      <div className="w-full space-y-6 bg-[#141210] p-6 md:p-8 rounded-2xl border border-amber-900/30 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center shadow-lg">
              1
            </span>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Pasul 1: Încărcare & Identificare Spațială Schiță / Axonometrie
              </h3>
              <p className="text-xs text-slate-400">Gemini Vision scanează compartimentarea pentru a bloca layout-ul fix al camerelor</p>
            </div>
          </div>
          <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg font-mono">
            {analysisCost > 0 ? `Cost analiză: ${analysisCost} credite` : 'Analiză Inclusă'}
          </span>
        </div>

        <FileUploader 
          label="Trageți schița 2D sau axonometria 3D aici (JPG, PNG, PDF)"
          accept="image/*,.pdf"
          onUploadComplete={urls => {
            const uploadedUrl = urls[0] || '';
            setPlanUrl(uploadedUrl);
            if (uploadedUrl) {
              handleAnalyzeFloorplan(uploadedUrl);
            }
          }}
        />

        {isAnalyzingPlan && (
          <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300 text-xs animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0 text-amber-400" />
            <div>
              <p className="font-bold text-amber-200 text-sm">Gemini Vision analizează schița spațială...</p>
              <p className="text-slate-300 text-xs">Identifică livingul, bucătăria, dormitoarele și mobilierul desenat.</p>
            </div>
          </div>
        )}

        {spatialAnalysis && (
          <div className="space-y-4 bg-black/40 border border-emerald-500/30 rounded-xl p-5 shadow-xl animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  Compartimentare & Mobilier Identificate în Schiță (Fixe)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleAnalyzeFloorplan()}
                disabled={isAnalyzingPlan}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Re-analizează Schița
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-1">
                <span className="text-slate-400 font-semibold block text-[11px]">Camere & Spații Recunoscute:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {spatialAnalysis.detectedRooms?.map((room, idx) => (
                    <span key={idx} className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10.5px] px-2 py-0.5 rounded-md font-semibold">
                      ✓ {room}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-1 md:col-span-2">
                <span className="text-slate-400 font-semibold block text-[11px]">Mobilier & Amenajări Identificate:</span>
                <p className="text-slate-200 text-[11.5px] leading-relaxed">
                  {spatialAnalysis.furnitureDetails || spatialAnalysis.spatialSummary}
                </p>
              </div>
            </div>

            {spatialAnalysis.cameraFlightPath && (
              <div className="bg-cyan-500/5 border border-cyan-500/20 p-3 rounded-lg text-xs flex items-center gap-2 text-cyan-300">
                <Video className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span><strong>Traseu Cameră Recomandat:</strong> {spatialAnalysis.cameraFlightPath}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full space-y-6 bg-[#141210] p-6 md:p-8 rounded-2xl border border-amber-900/30 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-300 font-bold text-xs flex items-center justify-center shadow-lg">
              2
            </span>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pasul 2: Personalizare Stil & Randare Video</h3>
              <p className="text-xs text-slate-400">Selectează preferințele de randare și lansează procesul video</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
              <Coins size={14} className="text-yellow-400" />
              Total: {totalCost} credite
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">2. Stil Arhitectural & Finisaje</label>
          {renderPills(['Modern Lux', 'Scandinavian', 'Minimalist', 'Clasic Elegant', 'Industrial'], style, setStyle)}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">3. Tip Walkthrough Video & Traseu Cameră</label>
          {renderPills(['Tur 1st Person (Ochiul liber)', 'Fly-Through Izometric 3D', 'Prezentare Panoramică 360'], tourMode, setTourMode)}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">4. Atmosferă & Iluminat</label>
          {renderPills(['Lumină Naturală de Zi', 'Apus Cald (Golden Hour)', 'Eleganță Nocturnă (Evening Luxury)'], ambience, setAmbience)}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">5. Camere de Evidențiat în Tur</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {(spatialAnalysis?.detectedRooms || ['Living Open-Space', 'Bucătărie cu Insulă', 'Dormitor Matrimonial', 'Terasă', 'Baie']).map(room => {
              const isSelected = focusRooms.includes(room);
              return (
                <button
                  key={room}
                  type="button"
                  onClick={() => toggleFocusRoom(room)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                      : 'border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {isSelected ? '✓ ' : '+ '}{room}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">6. Format Video</label>
            {renderPills(['16:9 (YouTube/site)', '9:16 (Reels/TikTok)', '1:1 (Instagram)'], videoFormat, setVideoFormat)}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">Durată Video</label>
            </div>
            {renderPills(durationOptions, duration, setDuration)}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-amber-400 uppercase tracking-widest">7. Prompt AI (Editabil)</label>
            <button
              type="button"
              onClick={handleOptimizePrompt}
              disabled={isOptimizingPrompt || !planUrl}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              {isOptimizingPrompt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span>Auto-Optimizare Prompt</span>
            </button>
          </div>
          <textarea
            rows={5}
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 font-mono resize-y min-h-[140px] max-h-[500px]"
          />
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={enableVoiceover} 
              onChange={e => setEnableVoiceover(e.target.checked)} 
              className="w-4 h-4 accent-amber-500 rounded bg-black/50" 
            />
            <span className="text-slate-300 text-sm">Generare scenariu narațiune audio în limba română</span>
          </label>
          {voiceoverCost > 0 && <span className="text-[11px] text-slate-400 font-mono">+{voiceoverCost} credite</span>}
        </div>

        {error && <div className="text-red-400 bg-red-500/10 p-3 rounded-xl text-sm border border-red-500/20 font-medium">{error}</div>}

        <button 
          onClick={submitAction}
          disabled={isPending || credits < totalCost}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all flex flex-col justify-center items-center gap-1 disabled:opacity-50 cursor-pointer"
        >
          {isPending ? (
            <div className="flex items-center justify-center gap-2 text-base">
              <Loader2 className="w-5 h-5 animate-spin" /> Randare Video 3D ({elapsedSeconds}s)...
            </div>
          ) : (
            <span className="flex items-center justify-center gap-2 text-base">
              <Video className="w-5 h-5" /> Lansează AI Walkthrough Video 3D
            </span>
          )}
          {!isPending && (
            <span className="text-xs text-white/90 flex items-center gap-1 mt-0.5 font-normal">
              <Coins size={12}/> Consum: {totalCost} credite
            </span>
          )}
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-black/40 rounded-2xl border border-white/10 flex flex-col items-center justify-center p-6 md:p-8 min-h-[420px] relative overflow-hidden shadow-2xl">
          {result ? (
            <div className="w-full space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Tur Video 3D Generat cu Succes
                </span>
                <button 
                  onClick={() => handleDownload(result, 'walkthrough_3d_imobum.mp4')} 
                  className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-xs font-semibold shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4"/> Descărcare Video MP4
                </button>
              </div>
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-[520px] flex items-center justify-center border border-white/10 shadow-2xl">
                <video src={result} controls autoPlay loop playsInline preload="auto" className="w-full h-full object-contain bg-black" />
              </div>
            </div>
          ) : (
            <div className="w-full text-center px-4 py-8">
              {isPending ? (
                <div className="max-w-md mx-auto space-y-6 text-left bg-[#100e0c] p-6 rounded-2xl border border-amber-500/20 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      Pipeline Live Generare Video AI
                    </span>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                      ⏱️ {elapsedSeconds} secunde
                    </span>
                  </div>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center gap-3 text-slate-200">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">1</span>
                      <span className="flex-1">Analiză Schiță & Geometrie Spațială</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-3 text-slate-200">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">2</span>
                      <span className="flex-1">Generare Scenariu Voiceover</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-3 text-amber-300 font-semibold">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">3</span>
                      <span className="flex-1">Randare pe GPU</span>
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-cyan-400 h-full transition-all duration-500 rounded-full" style={{ width: `${Math.min(95, elapsedSeconds * 2)}%` }} />
                  </div>
                </div>
              ) : (
                <>
                  <Building className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h4 className="text-slate-200 font-semibold text-base mb-1">Previzualizare Tur Video 3D</h4>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">Încarcă schița, configurează parametrii și lansează randarea.</p>
                </>
              )}
            </div>
          )}
        </div>

        {script && (
          <div className="bg-[#141210] p-6 rounded-2xl border border-amber-900/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-semibold text-xs uppercase tracking-widest">Narațiune Generată AI</span>
              </div>
              <button 
                onClick={async () => {
                  const success = await copyToClipboardSafe(script);
                  if (success) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? '✓ Copiat' : 'Copiază Script'}
              </button>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{script}</p>
          </div>
        )}

        {/* Persistent AI Video Generations Library / Gallery */}
        {savedGenerations.length > 0 && (
          <div className="bg-[#141210] p-6 rounded-2xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  📂 Galeria Mea Video AI & Istoric ({savedGenerations.length})
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">Salvate permanent pe contul tău</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedGenerations.map((gen, idx) => (
                <div key={gen.id || idx} className="bg-black/50 border border-white/10 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden relative border border-white/5">
                    <video src={gen.url} className="w-full h-full object-cover" muted onMouseOver={e => (e.target as HTMLVideoElement).play()} onMouseOut={e => (e.target as HTMLVideoElement).pause()} />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                      <span>{gen.date}</span>
                      <span className="text-cyan-400 font-medium">{gen.providerName}</span>
                    </div>
                    <p className="text-slate-200 font-semibold truncate">{gen.style}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setResult(gen.url);
                        if (gen.script) setScript(gen.script);
                      }}
                      className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Vizualizează
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(gen.url, `imobum_video_${gen.id}.mp4`)}
                      className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors cursor-pointer"
                      title="Descarcă MP4"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Plan3DTool() {
  const [isPending, startTransition] = useTransition();
  const { credits, costs, canUseCustomKeys } = useContext(CreditsContext);
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
      try {
        const res = await generate3DPlan({ planUrl, perspective }, provider, apiKey);
        if (res.error) setError(res.error);
        else setResult(res.resultUrl || '');
      } catch (err: any) {
        console.error('Plan3D error:', err);
        setError(err.message || 'A apărut o eroare la procesare.');
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        {canUseCustomKeys ? (
        <ProviderSettings 
          providerList={[{id: 'replicate', name: 'Replicate API'}, {id: 'controlnet', name: 'ControlNet / SD'}]}
          onProviderChange={setProvider}
          onKeyChange={setApiKey}
        />
      ) : (
        <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between text-xs text-slate-300 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Serviciul AI este alimentat direct de platformă. Generările consumă credite din balanța contului tău.</span>
          </div>
          <span className="font-semibold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 text-[11px] flex-shrink-0">
            Mod Asistat
          </span>
        </div>
      )}

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
  const { credits, costs, canUseCustomKeys } = useContext(CreditsContext);
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
      try {
        const res = await generateDescription({ propertyType, surface, rooms, location, features, tone, destination }, provider, apiKey);
        if (res.error) setError(res.error);
        else setResult(res.resultText || '');
      } catch (err: any) {
        console.error('DescriptionGen error:', err);
        setError(err.message || 'A apărut o eroare la procesare.');
      }
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
        {canUseCustomKeys ? (
        <ProviderSettings 
          providerList={[{id: 'openai', name: 'OpenAI (ChatGPT)'}, {id: 'anthropic', name: 'Anthropic (Claude)'}, {id: 'gemini', name: 'Google Gemini'}]}
          onProviderChange={setProvider}
          onKeyChange={setApiKey}
        />
      ) : (
        <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between text-xs text-slate-300 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Serviciul AI este alimentat direct de platformă. Generările consumă credite din balanța contului tău.</span>
          </div>
          <span className="font-semibold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 text-[11px] flex-shrink-0">
            Mod Asistat
          </span>
        </div>
      )}

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
  const { credits, costs, canUseCustomKeys } = useContext(CreditsContext);
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
      try {
        const res = await generateRoomAnimation({ imageUrl, speed, pan, selectedFurniture, ambientColor }, provider, apiKey);
        if (res.error) setError(res.error);
        else setResult(res.resultUrl || '');
      } catch (err: any) {
        console.error('RoomBuilder error:', err);
        setError(err.message || 'A apărut o eroare la procesare.');
      }
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
        {canUseCustomKeys ? (
        <ProviderSettings 
          providerList={[{id: 'replicate', name: 'Replicate API'}, {id: 'runway', name: 'Runway API'}]}
          onProviderChange={setProvider}
          onKeyChange={setApiKey}
        />
      ) : (
        <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between text-xs text-slate-300 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Serviciul AI este alimentat direct de platformă. Generările consumă credite din balanța contului tău.</span>
          </div>
          <span className="font-semibold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 text-[11px] flex-shrink-0">
            Mod Asistat
          </span>
        </div>
      )}

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
