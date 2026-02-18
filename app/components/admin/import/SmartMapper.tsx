'use client';

import { useState } from 'react';
import { analyzePropertyPage, AttributeCandidate } from '@/app/lib/actions/smart-scrape';
import { ScraperConfig } from '@/app/lib/actions/scraper-config';
import { ArrowRight, Check, ChevronRight, Layout, Loader2, Wand2, Search, Table } from 'lucide-react';

interface SmartMapperProps {
    config: ScraperConfig;
    onSave: (newSelectors: ScraperConfig['selectors']) => void;
    onCancel: () => void;
}

// Internal fields we want to map
const INTERNAL_FIELDS: { key: keyof ScraperConfig['selectors']; label: string }[] = [
    // Basics
    { key: 'title', label: 'Title' },
    { key: 'price', label: 'Price' },
    { key: 'currency', label: 'Currency' },
    { key: 'description', label: 'Description' },
    { key: 'type', label: 'Property Type' },
    { key: 'listing_type', label: 'Listing Type' },

    // Contact
    { key: 'owner_name', label: 'Owner Name' },
    { key: 'owner_phone', label: 'Owner Phone' },
    { key: 'private_notes', label: 'Private Notes' },

    // Location
    { key: 'location', label: 'Full Address' },
    { key: 'location_county', label: 'County' },
    { key: 'location_city', label: 'City' },
    { key: 'location_area', label: 'Area/Neighborhood' },

    // Specs
    { key: 'rooms', label: 'Rooms' },
    { key: 'bedrooms', label: 'Bedrooms' },
    { key: 'bathrooms', label: 'Bathrooms' },

    { key: 'area', label: 'Area (Generic)' },
    { key: 'area_usable', label: 'Usable Area' },
    { key: 'area_built', label: 'Built Area' },
    { key: 'area_terrace', label: 'Terrace Area' },
    { key: 'area_garden', label: 'Garden Area' },

    { key: 'floor', label: 'Floor' },
    { key: 'total_floors', label: 'Total Floors' },
    { key: 'year_built', label: 'Year Built' },

    { key: 'partitioning', label: 'Partitioning' },
    { key: 'comfort', label: 'Comfort' },

    { key: 'building_type', label: 'Building Type' },
    { key: 'interior_condition', label: 'Interior Condition' },
    { key: 'furnishing', label: 'Furnishing' },

    // Media & Features
    { key: 'features', label: 'Features List' },
    { key: 'images', label: 'Images' },
    { key: 'video_url', label: 'Video URL' },
    { key: 'virtual_tour_url', label: 'Virtual Tour URL' },
];

export default function SmartMapper({ config, onSave, onCancel }: SmartMapperProps) {
    const [url, setUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [candidates, setCandidates] = useState<AttributeCandidate[]>([]);
    const [mappings, setMappings] = useState<Partial<ScraperConfig['selectors']>>(config.selectors);
    const [selectedCandidateId, setSelectedCandidateId] = useState<Record<string, string>>({}); // fieldKey -> candidateId

    const handleAnalyze = async () => {
        if (!url) {
            alert('Please enter a valid URL');
            return;
        }
        setIsAnalyzing(true);
        try {
            const result = await analyzePropertyPage(url);
            if (result.success && result.candidates) {
                setCandidates(result.candidates);
                // alert(`Found ${result.candidates.length} attributes!`);
            } else {
                alert(result.error || 'Failed to analyze page');
            }
        } catch (e) {
            alert('An unexpected error occurred');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleMap = (fieldKey: keyof ScraperConfig['selectors'], candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate) {
            setMappings(prev => ({ ...prev, [fieldKey]: candidate.selector }));
            setSelectedCandidateId(prev => ({ ...prev, [fieldKey]: candidateId }));
        } else if (candidateId === 'custom') {
            // Handle custom manual input
            setSelectedCandidateId(prev => ({ ...prev, [fieldKey]: 'custom' }));
        } else {
            // Clear
            setSelectedCandidateId(prev => ({ ...prev, [fieldKey]: '' }));
            setMappings(prev => ({ ...prev, [fieldKey]: '' }));
        }
    };

    const handleManualSelectorChange = (fieldKey: keyof ScraperConfig['selectors'], value: string) => {
        setMappings(prev => ({ ...prev, [fieldKey]: value }));
        if (selectedCandidateId[fieldKey] && selectedCandidateId[fieldKey] !== 'custom') {
            setSelectedCandidateId(prev => ({ ...prev, [fieldKey]: 'custom' }));
        }
    };

    const handleSave = () => {
        // Validation if needed
        onSave(mappings as ScraperConfig['selectors']);
    };

    return (
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[85vh] w-full max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-indigo-600" />
                        Smart Scraper Mapper
                    </h2>
                    <p className="text-sm text-slate-500">Teach the scraper how to read {config.name}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                        <Check className="w-4 h-4" /> Save Configuration
                    </button>
                </div>
            </div>

            {/* Analysis Bar */}
            <div className="p-4 border-b border-slate-100 bg-white flex gap-4 items-center">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={`Paste a sample URL from ${config.domain}...`}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900"
                    />
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !url}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Page'}
                </button>
            </div>

            {/* Content Area - Split View */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT: Internal Fields Mapping */}
                <div className="w-1/2 border-r border-slate-200 flex flex-col bg-slate-50/30">
                    <div className="p-3 border-b border-slate-200 bg-slate-100/50 font-semibold text-slate-700 flex items-center justify-between text-sm uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                            <Layout className="w-4 h-4 text-slate-400" />
                            Internal Schema
                        </div>
                        <span className="text-xs font-normal text-slate-500 normal-case">Map discovered attributes to these fields</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {INTERNAL_FIELDS.map((field) => (
                            <div key={field.key} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors group">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{field.label}</label>
                                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{field.key}</span>
                                </div>

                                <div className="space-y-2">
                                    {/* Dropdown for Discovered Candidates */}
                                    <select
                                        className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 hover:bg-white transition-colors cursor-pointer text-slate-900"
                                        value={selectedCandidateId[field.key] || ''}
                                        onChange={(e) => handleMap(field.key, e.target.value)}
                                    >
                                        <option value="">-- Select discovered attribute --</option>
                                        {candidates.map(candidate => (
                                            <option key={candidate.id} value={candidate.id}>
                                                {candidate.label} ({candidate.value.substring(0, 30)}...)
                                            </option>
                                        ))}
                                        <option value="custom">Manual Selector</option>
                                    </select>

                                    {/* Manual Selector Override */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 whitespace-nowrap">Selector:</span>
                                        <input
                                            type="text"
                                            className="flex-1 p-1.5 text-xs font-mono border border-slate-200 rounded bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-300 outline-none transition-colors"
                                            value={mappings[field.key] || ''}
                                            onChange={(e) => handleManualSelectorChange(field.key, e.target.value)}
                                            placeholder=".css-selector"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Discovered Attributes */}
                <div className="w-1/2 flex flex-col bg-white">
                    <div className="p-3 border-b border-slate-200 bg-slate-100/50 font-semibold text-slate-700 flex items-center justify-between text-sm uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                            <Table className="w-4 h-4 text-slate-400" />
                            Discovered Attributes
                        </div>
                        <span className="text-xs font-normal text-slate-500 normal-case">{candidates.length} candidates found</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0">
                        {candidates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                                {isAnalyzing ? (
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                ) : (
                                    <Search className="w-12 h-12 mb-4 opacity-20" />
                                )}
                                <p>{isAnalyzing ? 'Scanning page structure...' : 'Enter a URL above and click Analyze to discover attributes.'}</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                                    <tr>
                                        <th className="p-3 font-medium text-slate-500 w-1/3">Attribute Label</th>
                                        <th className="p-3 font-medium text-slate-500 w-1/3">Value Preview</th>
                                        <th className="p-3 font-medium text-slate-500 w-1/3">Selector Strategy</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {candidates.map((candidate) => (
                                        <tr key={candidate.id} className="hover:bg-indigo-50/50 group transition-colors">
                                            <td className="p-3 font-medium text-slate-700 group-hover:text-indigo-700">
                                                {candidate.label}
                                            </td>
                                            <td className="p-3 text-slate-600 truncate max-w-[200px]" title={candidate.value}>
                                                {candidate.value}
                                            </td>
                                            <td className="p-3 text-xs font-mono text-slate-400 truncate max-w-[200px]" title={candidate.selector}>
                                                {candidate.selector}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
