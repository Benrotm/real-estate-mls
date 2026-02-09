'use client';

import { useState, useRef } from 'react';
import { X, DollarSign, Loader2 } from 'lucide-react';
import { submitOffer } from '../lib/offers';

interface OfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    propertyTitle: string;
    currencySymbol: string;
}

export default function OfferModal({ isOpen, onClose, propertyId, propertyTitle, currencySymbol }: OfferModalProps) {
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // UseRef for immediate synchronous blocking
    const isSubmitting = useRef(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting.current) return;
        isSubmitting.current = true;

        setIsLoading(true);
        setError('');

        try {
            const numericAmount = parseFloat(amount);
            if (isNaN(numericAmount) || numericAmount <= 0) {
                throw new Error('Please enter a valid amount.');
            }

            const result = await submitOffer(propertyId, numericAmount);

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setAmount('');
                    isSubmitting.current = false; // Reset after close
                }, 2000);
            } else {
                throw new Error(result.error || 'Failed to submit offer.');
                isSubmitting.current = false; // Reset on error
            }
        } catch (err: any) {
            setError(err.message);
            isSubmitting.current = false; // Reset on error
        } finally {
            setIsLoading(false);
            // Note: isSubmitting is NOT reset here for success case to prevent double-submit during success message
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-xl text-slate-900">Make an Offer</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Offer Submitted!</h4>
                            <p className="text-slate-500">Your offer for {propertyTitle} has been sent to the owner.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Offer Amount ({currencySymbol})
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 font-bold">{currencySymbol}</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="block w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none font-bold text-lg text-slate-900"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-bold text-slate-700 hover:bg-gray-50 transition-colors"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Submit Offer'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
