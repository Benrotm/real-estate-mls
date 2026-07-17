import { Globe } from 'lucide-react';
import LocationsSettingsClient from './LocationsSettingsClient';
import { getSystemLocations } from '@/app/lib/actions/admin-settings';

export const revalidate = 0; // Refresh data on request

export default async function LocationsSettingsPage() {
    const { cities, areas } = await getSystemLocations();

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 border-b border-slate-800 pb-6">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Globe className="w-8 h-8 text-orange-500" />
                        Location Lists
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Manage the list of system cities and area/neighborhood suggestions synchronized across all properties, leads, and public invite forms.
                    </p>
                </header>

                <LocationsSettingsClient initialCities={cities} initialAreas={areas} />
            </div>
        </div>
    );
}
