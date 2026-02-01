'use client';

import { useEffect, useRef, useState } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { MapPin, Loader2 } from 'lucide-react';

const LIBRARIES: ("places")[] = ["places"];

interface AddressAutocompleteProps {
    onAddressSelect: (address: {
        formattedAddress: string;
        city: string;
        county: string;
        area: string;
        lat: number;
        lng: number;
    }) => void;
    currentAddress?: string;
}

export default function AddressAutocomplete({ onAddressSelect, currentAddress }: AddressAutocompleteProps) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: LIBRARIES,
    });

    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const onLoad = (autoC: google.maps.places.Autocomplete) => {
        setAutocomplete(autoC);
    };

    const onPlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const formattedAddress = place.formatted_address || "";

                // Extract address components
                let city = "";
                let county = "";
                let area = "";

                place.address_components?.forEach(component => {
                    const types = component.types;
                    if (types.includes("locality")) {
                        city = component.long_name;
                    }
                    if (types.includes("administrative_area_level_1")) {
                        county = component.long_name;
                    }
                    if (types.includes("sublocality") || types.includes("neighborhood")) {
                        area = component.long_name;
                    }
                });

                // Romanian specific fallback for "Sector" as city if locality is missing or same as county
                if (!city && county.includes("București")) {
                    city = "București";
                }

                onAddressSelect({
                    formattedAddress,
                    city,
                    county,
                    area,
                    lat,
                    lng
                });
            }
        }
    };

    if (!isLoaded) return <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading Maps...</div>;

    return (
        <div className="w-full">
            <Autocomplete
                onLoad={onLoad}
                onPlaceChanged={onPlaceChanged}
            >
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search for an address..."
                        defaultValue={currentAddress}
                        className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </Autocomplete>
        </div>
    );
}
