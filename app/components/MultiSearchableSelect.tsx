import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Props {
    values: string[];
    onChange: (vals: string[]) => void;
    options: string[];
    placeholder?: string;
    className?: string;
}

function normalizeText(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ș|ş/gi, 's')
        .replace(/ț|ţ/gi, 't')
        .replace(/ă|â/gi, 'a')
        .replace(/î/gi, 'i')
        .replace(/đ/gi, 'd')
        .toLowerCase()
        .trim();
}

export default function MultiSearchableSelect({
    values = [],
    onChange,
    options,
    placeholder = 'Search or select multiple...',
    className = ''
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close dropdown without adding custom input
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option =>
        normalizeText(option).includes(normalizeText(search)) && !values.includes(option)
    );

    const handleSelect = (option: string) => {
        if (!values.includes(option)) {
            onChange([...values, option]);
        }
        setSearch('');
        setIsOpen(false);
    };

    const handleRemove = (option: string) => {
        onChange(values.filter(v => v !== option));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const trimmed = search.trim();
            if (trimmed && filteredOptions.length > 0) {
                // Select the best matching option from dropdown
                const bestMatch = filteredOptions[0];
                if (!values.includes(bestMatch)) {
                    onChange([...values, bestMatch]);
                }
                setSearch('');
                setIsOpen(false);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setSearch('');
        }
    };

    return (
        <div ref={containerRef} className="relative w-full space-y-2">
            {/* Selected Pills Container */}
            {values.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50/50 border border-slate-200/80 rounded-xl max-h-28 overflow-y-auto">
                    {values.map((val) => (
                        <span
                            key={val}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-orange-50 text-orange-950 border border-orange-200 rounded-lg animate-in zoom-in-95 duration-100"
                        >
                            {val}
                            <button
                                type="button"
                                onClick={() => handleRemove(val)}
                                className="text-orange-600 hover:text-orange-900 transition-colors rounded hover:bg-orange-100 p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Input field */}
            <div className="relative">
                <input
                    type="text"
                    value={search}
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`${className} pr-10`}
                    autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="hover:text-slate-600 transition-colors p-0.5"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Suggestions list */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {filteredOptions.length > 0 ? (
                        <div className="p-1">
                            {filteredOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className="w-full text-left px-3 py-2 text-sm rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-xs text-slate-400 font-medium">
                            {search.trim() ? (
                                <span>No matching location found in database for "<strong>{search}</strong>". Please select from dropdown.</span>
                            ) : (
                                <span>No more locations available to select.</span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

