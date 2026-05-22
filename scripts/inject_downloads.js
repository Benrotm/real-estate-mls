const fs = require('fs');
const path = 'c:\\Users\\bensi\\Downloads\\Git hub Repository\\real-estate-mls\\app\\components\\ai-staging\\AIStagingClient.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Add Download icon import
if (!content.includes('Download,')) {
    content = content.replace(/Sofa, Loader2/, 'Sofa, Loader2, Download');
}

// 2. Add handleDownload helper inside AIStagingClient
if (!content.includes('const handleDownload = async')) {
    content = content.replace(/export default function AIStagingClient.*?\{/, match => {
        return match + `
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
  };\n`;
    });
}

// 3. Update the Result rendering for the 4 tabs to include the button
// Virtual Staging
content = content.replace(/{result \? \(\s*<img src=\{result\} alt="Staging Result" className="w-full h-full object-contain rounded-xl" \/>\s*\) : \(/, 
`{result ? (
           <>
              <img src={result} alt="Staging Result" className="w-full h-full object-contain rounded-xl relative z-10" />
              <button onClick={() => handleDownload(result, 'virtual_staging_imobum.png')} className="absolute top-8 right-8 bg-black/60 hover:bg-black/80 border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 backdrop-blur-md transition-all text-sm font-semibold shadow-2xl z-20">
                  <Download className="w-4 h-4"/> Descărcare
              </button>
           </>
        ) : (`);

// Video Generator
content = content.replace(/{result \? \(\s*<video src=\{result\} controls autoPlay loop className="w-full h-full object-contain rounded-xl bg-black" \/>\s*\) : \(/,
`{result ? (
           <>
               <video src={result} controls autoPlay loop className="w-full h-full object-contain rounded-xl bg-black relative z-10" />
               <button onClick={() => handleDownload(result, 'video_staging_imobum.mp4')} className="absolute top-8 right-8 bg-black/60 hover:bg-black/80 border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 backdrop-blur-md transition-all text-sm font-semibold shadow-2xl z-20">
                  <Download className="w-4 h-4"/> Descărcare
              </button>
           </>
        ) : (`);

// 3D Plan
content = content.replace(/{result \? \(\s*<img src=\{result\} alt="3D Plan Result" className="w-full h-full object-contain rounded-xl" \/>\s*\) : \(/,
`{result ? (
           <>
              <img src={result} alt="3D Plan Result" className="w-full h-full object-contain rounded-xl relative z-10" />
              <button onClick={() => handleDownload(result, '3d_plan_imobum.png')} className="absolute top-8 right-8 bg-black/60 hover:bg-black/80 border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 backdrop-blur-md transition-all text-sm font-semibold shadow-2xl z-20">
                  <Download className="w-4 h-4"/> Descărcare
              </button>
           </>
        ) : (`);

// Room Builder
content = content.replace(/{result \? \(\s*<video src=\{result\} controls autoPlay loop className="w-full h-full rounded-xl bg-black" \/>\s*\) : \(/,
`{result ? (
           <>
               <video src={result} controls autoPlay loop className="w-full h-full rounded-xl bg-black relative z-10" />
               <button onClick={() => handleDownload(result, 'room_builder_imobum.mp4')} className="absolute top-8 right-8 bg-black/60 hover:bg-black/80 border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 backdrop-blur-md transition-all text-sm font-semibold shadow-2xl z-20">
                  <Download className="w-4 h-4"/> Descărcare
              </button>
           </>
        ) : (`);

// 4. Ensure all parent container divs have `relative` for absolute positioning to work
content = content.replace(/className="bg-black\/30 rounded-2xl border border-white\/10 flex items-center justify-center p-6 min-h-\[400px\]"/g, 'className="bg-black/30 rounded-2xl border border-white/10 flex items-center justify-center p-6 min-h-[400px] relative overflow-hidden"');

fs.writeFileSync(path, content);
console.log('Update finished!');
