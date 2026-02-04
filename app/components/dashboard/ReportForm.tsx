'use client';

import { useState } from 'react';
import { createTicket } from '@/app/lib/actions/tickets';
import { Loader2, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import Image from 'next/image';

export default function ReportForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        formData.append('images', JSON.stringify(uploadedImages));

        const result = await createTicket(formData);

        if (result.success) {
            setIsSuccess(true);
            setUploadedImages([]);
            (e.target as HTMLFormElement).reset();
        } else {
            setError(result.error || 'Something went wrong.');
        }

        setIsLoading(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `tickets/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('support-attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('support-attachments')
                .getPublicUrl(filePath);

            setUploadedImages(prev => [...prev, publicUrl]);
        } catch (err) {
            console.error('Upload failed', err);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-green-100 text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Report Submitted!</h3>
                <p className="text-slate-500 mb-6">Thank you for your feedback. Our team will review it shortly.</p>
                <button
                    onClick={() => setIsSuccess(false)}
                    className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                    Submit Another Report
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 max-w-3xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Report an Issue or Suggestion</h2>
                <p className="text-slate-500">We appreciate your feedback to help us improve.</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                    <div className="grid grid-cols-3 gap-3">
                        <label className="cursor-pointer">
                            <input type="radio" name="type" value="bug" className="peer sr-only" required />
                            <div className="text-center py-3 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 peer-checked:bg-red-50 peer-checked:border-red-200 peer-checked:text-red-700 transition-all">
                                🐞 Bug Report
                            </div>
                        </label>
                        <label className="cursor-pointer">
                            <input type="radio" name="type" value="feature_request" className="peer sr-only" required />
                            <div className="text-center py-3 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 peer-checked:bg-blue-50 peer-checked:border-blue-200 peer-checked:text-blue-700 transition-all">
                                💡 Suggestion
                            </div>
                        </label>
                        <label className="cursor-pointer">
                            <input type="radio" name="type" value="property_report" className="peer sr-only" required />
                            <div className="text-center py-3 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 peer-checked:bg-orange-50 peer-checked:border-orange-200 peer-checked:text-orange-700 transition-all">
                                🏠 Property Issue
                            </div>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                    <input
                        type="text"
                        name="subject"
                        placeholder="Brief summary of the issue..."
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                        name="description"
                        placeholder="Please describe in detail..."
                        rows={5}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                        required
                    ></textarea>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Attachments (Optional)</label>

                    <div className="flex flex-wrap gap-4 mb-3">
                        {uploadedImages.map((url, idx) => (
                            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group">
                                <Image src={url} alt="Uploaded" fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-violet-500 hover:bg-violet-50 transition-all text-slate-400 hover:text-violet-500">
                            {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                            <span className="text-[10px] mt-1 font-medium">Upload</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                        </label>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading || isUploading}
                    className="bg-violet-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200 flex items-center gap-2"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Report'}
                </button>
            </div>
        </form>
    );
}
