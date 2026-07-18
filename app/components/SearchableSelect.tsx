import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Props {
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder?: string;
    className?: string;
    required?: boolean;
    name?: string;
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

export default function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = 'Search or select...',
    className = '',
    required = false,
    name
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState(value);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync input field value when external value changes
    useEffect(() => {
        setSearch(value);
    }, [value]);

    // Handle click outside to close dropdown and snap to valid match
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                const trimmed = search.trim();
                if (trimmed && trimmed !== value) {
                    const exactMatch = options.find(o => normalizeText(o) === normalizeText(trimmed));
                    if (exactMatch) {
                        onChange(exactMatch);
                        setSearch(exactMatch);
                    } else {
                        // Revert to current value if not exactly matched from dropdown options
                        setSearch(value);
                    }
                } else if (!trimmed && value) {
                    onChange('');
                    setSearch('');
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [search, value, options, onChange]);

    const filteredOptions = options.filter(option =>
        normalizeText(option).includes(normalizeText(search))
    );

    const handleSelect = (option: string) => {
        onChange(option);
        setSearch(option);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange('');
        setSearch('');
        setIsOpen(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredOptions.length > 0) {
                handleSelect(filteredOptions[0]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setSearch(value);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <input
                    type="text"
                    name={name}
                    required={required}
                    value={search}
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`${className} pr-10`}
                    autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
                    {search && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="hover:text-slate-600 transition-colors p-0.5"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="hover:text-slate-600 transition-colors p-0.5"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {filteredOptions.length > 0 ? (
                        <div className="p-1">
                            {filteredOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                                        option === value 
                                            ? 'bg-orange-50 text-orange-900 font-semibold' 
                                            : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-xs text-slate-400 font-medium">
                            {search.trim() ? (
                                <span>No matching location found in database for "<strong>{search}</strong>".</span>
                            ) : (
                                <span>No options available.</span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
