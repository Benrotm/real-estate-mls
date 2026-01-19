'use client';

import { Building, Users, Briefcase } from 'lucide-react';
import Link from 'next/link';

type UserType = 'owner' | 'client' | 'agent' | 'developer';

interface RoleSelectorProps {
    mode: 'navigation' | 'selection';
    selectedRole?: UserType;
    onSelect?: (role: UserType) => void;
}

export default function RoleSelector({ mode, selectedRole, onSelect }: RoleSelectorProps) {
    // Default to 'owner' if no selection is provided in navigation mode for visual consistency,
    // though in navigation mode we might want no default highlight or hover effects.
    // For this design, let's allow highlighting specific visuals based on hover or just simple cards.
    // Actually, the original design had a "selected" state. 
    // In 'navigation' mode, all cards should probably look "clickable".
    // Let's implement individual buttons that handle their own click/link logic.

    const selectorStyles = {
        owner: {
            text: 'text-cyan-500/20',
            stroke: '#22d3ee',
            shadow: 'rgba(34, 211, 238, 0.5)',
            border: 'border-cyan-500/30'
        },
        client: {
            text: 'text-rose-500/20',
            stroke: '#fb7185',
            shadow: 'rgba(251, 113, 133, 0.5)',
            border: 'border-rose-500/30'
        },
        agent: {
            text: 'text-emerald-500/20',
            stroke: '#34d399',
            shadow: 'rgba(52, 211, 153, 0.5)',
            border: 'border-emerald-500/30'
        },
        developer: {
            text: 'text-fuchsia-500/20',
            stroke: '#e879f9',
            shadow: 'rgba(232, 121, 249, 0.5)',
            border: 'border-fuchsia-500/30'
        }
    };

    // Use specific style for the selected role, or default to owner style for the container if nothing selected (or handle generic)
    // For the container style "I am...", we typically want it to reflect the *active* selection.
    // In navigation mode, maybe we don't change the "I am..." style dynamically on hover to avoid flickering, 
    // or we pick a neutral style. The user requested "move it", implying consistent behavior.

    // In pricing page (selection mode), 'selectedRole' is controlled.
    // In homepage (navigation mode), there is no "selected" role until you hover?
    // Let's stick to the existing styling logic. If mode is navigation, we render Links.

    const activeStyle = selectedRole ? selectorStyles[selectedRole] : selectorStyles.owner;

    const RoleButton = ({ role, label, subLabel, icon: Icon, colorClass, borderClass, bgClass, textClass, shadowClass }: any) => {
        const isSelected = selectedRole === role;

        // Base classes
        const baseClasses = `flex-1 flex items-center gap-4 p-4 rounded-xl transition-all border-2 text-left`;
        const activeClasses = isSelected
            ? `${borderClass} ${bgClass}`
            : `border-transparent hover:bg-slate-700`; // Default hover for non-selected

        const content = (
            <>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClass} text-white shadow-lg ${shadowClass}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <div className={`font-bold ${isSelected ? textClass : 'text-gray-300'}`}>{label}</div>
                    <div className="text-xs text-gray-400">{subLabel}</div>
                </div>
            </>
        );

        if (mode === 'navigation') {
            return (
                <Link href={`/pricing?role=${role}`} className={`${baseClasses} border-slate-700/50 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800`}>
                    {content}
                </Link>
            );
        }

        return (
            <button
                onClick={() => onSelect && onSelect(role)}
                className={`${baseClasses} ${activeClasses}`}
            >
                {content}
            </button>
        );
    };

    return (
        <div className={`bg-slate-800 p-2 rounded-2xl shadow-2xl border-2 ${activeStyle.border} max-w-5xl mx-auto mb-12 flex flex-col gap-6 transition-colors duration-300`}>
            <h1 className={`text-4xl md:text-5xl font-bold ${activeStyle.text} mb-2 drop-shadow-2xl text-center mt-4 transition-all duration-300`} style={{ WebkitTextStroke: `1px ${activeStyle.stroke}`, textShadow: `0 0 20px ${activeStyle.shadow}` }}>
                I am...
            </h1>
            <div className="flex flex-col md:flex-row gap-2">
                <RoleButton
                    role="owner"
                    label="Property Owner"
                    subLabel="List your properties"
                    icon={Building}
                    colorClass="from-cyan-500 to-blue-600"
                    borderClass="border-cyan-400"
                    bgClass="bg-cyan-500/20"
                    textClass="text-cyan-300"
                    shadowClass="shadow-cyan-500/50"
                />
                <RoleButton
                    role="client"
                    label="Client"
                    subLabel="Browse and find properties"
                    icon={Users}
                    colorClass="from-amber-400 to-rose-500"
                    borderClass="border-rose-400"
                    bgClass="bg-rose-500/20"
                    textClass="text-rose-300"
                    shadowClass="shadow-rose-500/50"
                />
                <RoleButton
                    role="agent"
                    label="Real Estate Agent"
                    subLabel="Manage multiple listings"
                    icon={Briefcase}
                    colorClass="from-emerald-400 to-green-600"
                    borderClass="border-emerald-400"
                    bgClass="bg-emerald-500/20"
                    textClass="text-emerald-300"
                    shadowClass="shadow-emerald-500/50"
                />
                <RoleButton
                    role="developer"
                    label="RE Developer"
                    subLabel="Large projects & scale"
                    icon={Building}
                    colorClass="from-fuchsia-500 to-purple-600"
                    borderClass="border-fuchsia-400"
                    bgClass="bg-fuchsia-500/20"
                    textClass="text-fuchsia-300"
                    shadowClass="shadow-fuchsia-500/50"
                />
            </div>
        </div>
    );
}
