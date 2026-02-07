const fs = require('fs');
const content = fs.readFileSync('app/properties/[id]/page.tsx', 'utf8');
const lines = content.split(/\r?\n/);
const keep = lines.slice(0, 536);
const newContent = keep.join('\n') + `
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg sticky top-24 z-0">
                        <h3 className="text-xl font-bold mb-6 text-slate-900">Contact</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <img src={agent.image} alt={agent.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
                            <div>
                                <div className="font-bold text-slate-900 text-lg">{agent.name}</div>
                                <div className="text-sm text-slate-500 font-medium">{agent.role}</div>
                            </div>
                        </div>

                        {(property.personal_property_id || property.social_media_url || property.friendly_id) && (
                            <div className="mb-6 space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                {property.friendly_id && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Ref ID:</span>
                                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">#{property.friendly_id}</span>
                                    </div>
                                )}
                                {property.personal_property_id && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Internal ID:</span>
                                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">{property.personal_property_id}</span>
                                    </div>
                                )}
                                {property.social_media_url && (
                                    <div className="pt-2 border-t border-slate-200">
                                        <a
                                            href={property.social_media_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition shadow-sm"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Visit Social Media
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        <ContactForm
                            propertyTitle={property.title}
                            propertyAddress={\`\${property.address}, \${property.location_city}\`}
                            agentName={agent.name}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
`;
fs.writeFileSync('app/properties/[id]/page.tsx', newContent);
console.log('File patched successfully');
