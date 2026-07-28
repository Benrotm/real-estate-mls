'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import { updateProfileAvatar } from '@/app/lib/actions/user';
import { useRouter } from 'next/navigation';

interface AvatarUploadProps {
    userId: string;
    currentAvatarUrl?: string;
    fullName?: string;
}

export default function AvatarUpload({ userId, currentAvatarUrl, fullName }: AvatarUploadProps) {
    const router = useRouter();
    const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = event.target.files?.[0];
            if (!file) return;

            // 1. Upload to Supabase Storage (Reuse property-images bucket since manual migration is hard)
            const fileExt = file.name.split('.').pop();
            const fileName = `avatars/avatar_${userId}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                throw uploadError;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('property-images')
                .getPublicUrl(filePath);

            // 3. Update Profile in DB
            const result = await updateProfileAvatar(publicUrl);

            if (result.error) {
                throw new Error(result.error);
            }

            setAvatarUrl(publicUrl);
            router.refresh();

        } catch (error: any) {
            alert('Error updating avatar: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
            />

            <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white/20 shadow-lg relative bg-orange-500 flex items-center justify-center">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-3xl font-bold text-white">
                        {fullName?.[0]?.toUpperCase() || 'U'}
                    </span>
                )}

                {/* Upload Overlay */}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {uploading ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                        <Camera className="w-8 h-8 text-white/80" />
                    )}
                </div>
            </div>

            {/* Helper Badge in flex flow (never overlaps name below) */}
            <span className="text-[11px] text-slate-300 group-hover:text-orange-400 font-semibold transition-colors flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60 shadow-xs">
                <Camera className="w-3.5 h-3.5 text-orange-400" /> Schimbă poza
            </span>
        </div>
    );
}
