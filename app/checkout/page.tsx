'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Check, Lock, Smartphone, Chrome, ArrowLeft } from 'lucide-react';

function CheckoutContent() {
    const searchParams = useSearchParams();
    const planName = searchParams.get('plan') || 'Premium';
    const planPrice = searchParams.get('price') || '49';
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'google' | 'apple'>('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        // Mock processing
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
        }, 2000);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
                    <p className="text-slate-600 mb-8">
                        Thank you for subscribing to the {planName} plan. Your account has been upgraded.
                    </p>
                    <Link href="/dashboard" className="block w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-gray-100 py-6">
                <div className="max-w-3xl mx-auto px-4">
                    <Link href="/pricing" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-orange-600 transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Pricing
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">Secure Checkout</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Payment Form */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg mb-4">Select Payment Method</h3>
                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${paymentMethod === 'card' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:border-gray-200 text-slate-600'}`}
                            >
                                <CreditCard className="w-5 h-5" /> Card
                            </button>
                            <button
                                onClick={() => setPaymentMethod('google')}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${paymentMethod === 'google' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:border-gray-200 text-slate-600'}`}
                            >
                                <Chrome className="w-5 h-5" /> Google
                            </button>
                            <button
                                onClick={() => setPaymentMethod('apple')}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${paymentMethod === 'apple' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:border-gray-200 text-slate-600'}`}
                            >
                                <Smartphone className="w-5 h-5" /> Apple
                            </button>
                        </div>

                        {paymentMethod === 'card' && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Name on Card</label>
                                    <input type="text" required placeholder="John Doe" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Card Number</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                        <input type="text" required placeholder="0000 0000 0000 0000" className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Expiry</label>
                                        <input type="text" required placeholder="MM/YY" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">CVC</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                            <input type="text" required placeholder="123" className="w-full p-3 pl-9 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={isProcessing} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isProcessing ? 'Processing...' : `Pay $${planPrice}`}
                                </button>

                                <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                                    <Lock className="w-3 h-3" /> Payments are secure and encrypted
                                </p>
                            </form>
                        )}

                        {paymentMethod === 'google' && (
                            <div className="text-center py-12 space-y-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                    <Chrome className="w-8 h-8 text-gray-600" />
                                </div>
                                <p className="text-slate-600">Proceed with Google Pay securely</p>
                                <button onClick={handleSubmit} disabled={isProcessing} className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-all">
                                    Pay with <span className="font-bold">GPay</span>
                                </button>
                            </div>
                        )}

                        {paymentMethod === 'apple' && (
                            <div className="text-center py-12 space-y-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                    <Smartphone className="w-8 h-8 text-gray-600" />
                                </div>
                                <p className="text-slate-600">Proceed with Apple Pay securely</p>
                                <button onClick={handleSubmit} disabled={isProcessing} className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-all">
                                    Pay with <span className="font-bold"> Pay</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                        <h3 className="font-bold text-lg mb-6">Order Summary</h3>
                        <div className="space-y-4 border-b border-gray-100 pb-4 mb-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 font-medium">{planName} Plan</span>
                                <span className="font-bold text-slate-900">${planPrice}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-slate-500">
                                <span>Billing Cycle</span>
                                <span>Monthly</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-lg text-slate-900">Total</span>
                            <span className="font-bold text-2xl text-orange-600">${planPrice}</span>
                        </div>

                        <div className="bg-orange-50 p-4 rounded-xl text-xs text-orange-800 leading-relaxed">
                            By confirming your subscription, you allow PropList to charge your card for this payment and future payments in accordance with our terms.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading checkout...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
