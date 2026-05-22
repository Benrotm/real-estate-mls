const fs = require('fs');
const path = 'c:\\Users\\bensi\\Downloads\\Git hub Repository\\real-estate-mls\\app\\components\\ai-staging\\AIStagingClient.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('</CreditsContext.Provider>')) {
  content = content.replace(/      <\/div>\n    <\/div>\n  \);\n}/, '      </div>\n    </div>\n    </CreditsContext.Provider>\n  );\n}');
}

function injectContext(content, funcName, featureKey) {
  const funcRegex = new RegExp(`function ${funcName}\\(\\) {[\\s\\S]*?const \\[isPending, startTransition\\] = useTransition\\(\\);`, 'g');
  return content.replace(funcRegex, (match) => {
      if (match.includes('useContext(CreditsContext)')) return match;
      return match + `\n  const { credits, costs } = useContext(CreditsContext);\n  const cost = costs['${featureKey}'] || 0;`;
  });
}

content = injectContext(content, 'VirtualStagingTool', 'ai_virtual_staging');
content = injectContext(content, 'VideoGeneratorTool', 'ai_video_generator');
content = injectContext(content, 'Plan3DTool', 'ai_plan_3d');
content = injectContext(content, 'DescriptionGenTool', 'ai_description');
content = injectContext(content, 'RoomBuilderTool', 'ai_room_builder');

const btnRegex = /<button\s+onClick=\{submitAction\}\s+disabled=\{isPending\}\s+className="w-full py-4([^>]+flex([^>]+)?items-center justify-center gap-2(\s+mt-4)?)"\s*>\s*\{isPending \? ([^:]+) : ([^\}]+)\}\s*<\/button>/g;

content = content.replace(btnRegex, (match, p1, p2, p3, p4, p5) => {
    return `<button 
          onClick={submitAction}
          disabled={isPending || credits < cost}
          className="w-full py-4${p1} flex-col disabled:opacity-50"
        >
          {isPending ? <div className="flex items-center gap-2">${p4}</div> : <span className="flex items-center gap-2">${p5}</span>}
          {!isPending && <span className="text-xs text-white/70 flex items-center gap-1 mt-1 font-normal"><Coins size={12}/> Cost: {cost} credite (Balanță: {credits})</span>}
        </button>`;
});

fs.writeFileSync(path, content);
console.log('Update complete!');
