import Link from 'next/link';
import { Building, ArrowUpRight, Plus, MapPin, Bed, Bath, Move } from 'lucide-react';
import { Property } from '@/app/lib/properties';
import { formatCompactCurrency } from '@/app/lib/format';

interface RecentPropertiesWidgetProps {
    properties: Property[];
    viewAllLink?: string;
    addLink?: string;
}

export default function RecentPropertiesWidget({
    properties,
    viewAllLink = '/dashboard/agent/listings',
    addLink = '/properties/add'
}: RecentPropertiesWidgetProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="flex items-center gap-2 font-bold text-slate-900">
                    <Building className="w-4 h-4 text-orange-500" /> My Listings
                </h3>
                <Link href={viewAllLink} className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-slate-900 transition-colors">
                    Manage All <ArrowUpRight className="w-3 h-3" />
                </Link>
            </div>

            {properties.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Building className="w-12 h-12 mb-3 text-slate-300 opacity-50" />
                    <div className="text-sm font-medium text-slate-500 mb-6">No properties listed yet</div>
                    <Link href={addLink} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Your First Property
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {properties.slice(0, 3).map((property) => (
                        <div key={property.id} className="flex gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                            <div className="w-20 h-20 bg-slate-100 rounded-lg shrink-0 overflow-hidden relative">
                                {property.images && property.images.length > 0 ? (
                                    <img
                                        src={property.images[0]}
                                        alt={property.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Building className="w-8 h-8" />
                                    </div>
                                )}
                                <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${property.status === 'active' ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'
                                    }`}>
                                    {property.status}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h4 className="text-sm font-bold text-slate-900 truncate mb-1 group-hover:text-orange-600 transition-colors">
                                    {property.title}
                                </h4>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mb-2 truncate">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    {property.location_city}, {property.location_area || property.location_county}
                                </div>
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="font-bold text-slate-900">
                                        {formatCompactCurrency(property.price, property.currency)}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {property.bedrooms || '-'}</span>
                                        <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {property.bathrooms || '-'}</span>
                                        <span className="flex items-center gap-1"><Move className="w-3 h-3" /> {property.area_usable || '-'} m²</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {properties.length > 3 && (
                        <Link href={viewAllLink} className="text-xs text-center block text-slate-500 hover:text-orange-500 mt-2 font-medium">
                            + {properties.length - 3} more listings
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
