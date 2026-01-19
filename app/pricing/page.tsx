'use client';

import { useState } from 'react';
import { Check, X, Building, Users, Briefcase, Zap, Star, ShieldCheck } from 'lucide-react';

export default function PricingPage() {
    const [userType, setUserType] = useState<'owner' | 'client' | 'agent' | 'developer'>('owner');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const toggleBilling = () => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly');

    const plans = {
        owner: [
            {
                name: 'Free',
                price: 0,
                description: 'Try out the platform',
                features: ['1 Property Listing', 'Basic Photos (5 max)', 'Standard Support', '30-day visibility'],
                missing: ['No Virtual Tours', 'No Featured Listings', 'No Analytics'],
                popular: false,
                icon: <Building className="w-6 h-6" />
            },
            {
                name: 'Basic',
                price: 29,
                description: 'For individual owners',
                features: ['5 Property Listings', 'Up to 15 Photos each', 'Virtual Tour Support', 'Email Support', '60-day visibility', 'Basic Analytics'],
                missing: [],
                popular: false,
                icon: <Star className="w-6 h-6" />
            },
            {
                name: 'Premium',
                price: 79,
                description: 'Professional owners',
                features: ['20 Property Listings', 'Unlimited Photos', 'Virtual Tour Support', 'Featured Listings (3/mo)', 'Priority Support', '90-day visibility', 'Advanced Analytics', 'Lead Management'],
                missing: [],
                popular: true,
                icon: <Zap className="w-6 h-6" />
            }
        ],
        client: [
            {
                name: 'Free',
                price: 0,
                description: 'Browse listings',
                features: ['Browse All Listings', 'Contact Owners/Agents', 'Save Favorites', 'Basic Search'],
                missing: ['No Virtual Tours', 'Limited Property Details'],
                popular: false,
                icon: <Building className="w-6 h-6" />
            },
            {
                name: 'Premium',
                price: 19,
                description: 'Full access',
                features: ['All Virtual Tours', 'Full Property Details', 'Advanced Search', 'Price History', 'Neighborhood Data', 'Priority Support', 'Early Access to Listings'],
                missing: [],
                popular: true,
                icon: <Zap className="w-6 h-6" />
            }
        ],
        agent: [
            {
                name: 'Free',
                price: 0,
                description: 'New Agents',
                features: ['5 Property Listings', 'Basic Profile', 'Standard Support', '30-day visibility'],
                missing: ['Virtual Tours', 'Analytics', 'Featured Listings'],
                popular: false,
                icon: <Building className="w-6 h-6" />
            },
            {
                name: 'Basic',
                price: 49,
                description: 'Start your agency',
                features: ['100 Property Listings', 'Virtual Tour Support', 'Lead Management', 'Basic Analytics', 'Email Support'],
                missing: ['CRM Integration', 'Team Members'],
                popular: false,
                icon: <Star className="w-6 h-6" />
            },
            {
                name: 'Professional',
                price: 149,
                description: 'Growing agents',
                features: ['500 Property Listings', 'Premium Virtual Tours', 'Featured Listings (5/mo)', 'Advanced Analytics', 'CRM Integration', 'Priority Support', 'Team Members (3)'],
                missing: [],
                popular: true,
                icon: <Zap className="w-6 h-6" />
            },
            {
                name: 'Enterprise',
                price: 399,
                description: 'Large agencies',
                features: ['Unlimited Listings', 'All Premium Features', 'Featured Listings (20/mo)', 'Full API Access', 'Dedicated Support', 'Unlimited Team', 'Custom Branding', 'White-label Solution'],
                missing: [],
                popular: false,
                icon: <Briefcase className="w-6 h-6" />
            }
        ],
        developer: [
            {
                name: 'Starter',
                price: 0,
                description: 'Perfect for small projects',
                features: ['5 Property Listings', 'Basic Analytics', 'Standard Support', '30-day visibility', 'Standard Photos'],
                missing: ['Project Branding', 'API Access', 'Featured Projects'],
                popular: false,
                icon: <Building className="w-6 h-6" />
            },
            {
                name: 'Growth',
                price: 199,
                description: 'Scale your construction projects',
                features: ['50 Property Listings', 'Project Branding', 'Advanced Analytics', 'Featured Projects (2/mo)', 'Priority Support', 'Unlimited Photos'],
                missing: ['API Access'],
                popular: true,
                icon: <Zap className="w-6 h-6" />
            },
            {
                name: 'Scale',
                price: 499,
                description: 'Full enterprise solution',
                features: ['200 Property Listings', 'Dedicated Account Manager', 'API Access', 'Full Customization', 'White-label Map View', 'Unlimited Featured Projects'],
                missing: [],
                popular: false,
                icon: <Briefcase className="w-6 h-6" />
            }
        ]
    };

    const currentPlans = plans[userType];

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
    const currentStyle = selectorStyles[userType];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-block mb-4 px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-xl shadow-cyan-500/50">
                        <span className="mr-1">⭐</span> Flexible Plans
                    </div>
                    <p className="text-xl text-gray-100 max-w-2xl mx-auto font-medium" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
                        Select the perfect plan for your needs. Upgrade or downgrade anytime.
                    </p>
                </div>

                {/* Role Selector */}
                <div className={`bg-slate-800 p-2 rounded-2xl shadow-2xl border-2 ${currentStyle.border} max-w-5xl mx-auto mb-12 flex flex-col gap-6 transition-colors duration-300`}>
                    <h1 className={`text-4xl md:text-5xl font-bold ${currentStyle.text} mb-2 drop-shadow-2xl text-center mt-4 transition-all duration-300`} style={{ WebkitTextStroke: `1px ${currentStyle.stroke}`, textShadow: `0 0 20px ${currentStyle.shadow}` }}>
                        I am...
                    </h1>
                    <div className="flex flex-col md:flex-row gap-2">
                        <button
                            onClick={() => setUserType('owner')}
                            className={`flex-1 flex items-center gap-4 p-4 rounded-xl transition-all border-2 text-left ${userType === 'owner' ? 'border-cyan-400 bg-cyan-500/20' : 'border-transparent hover:bg-slate-700'}`}
                        >
                            <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50">
                                <Building className="w-6 h-6" />
                            </div>
                            <div>
                                <div className={`font-bold ${userType === 'owner' ? 'text-cyan-300' : 'text-gray-300'}`}>Property Owner</div>
                                <div className="text-xs text-gray-400">List your properties</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setUserType('client')}
                            className={`flex-1 flex items-center gap-4 p-4 rounded-xl transition-all border-2 text-left ${userType === 'client' ? 'border-rose-400 bg-rose-500/20' : 'border-transparent hover:bg-slate-700'}`}
                        >
                            <div className="p-3 rounded-lg bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-lg shadow-rose-500/50">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <div className={`font-bold ${userType === 'client' ? 'text-rose-300' : 'text-gray-300'}`}>Client</div>
                                <div className="text-xs text-gray-400">Browse and find properties</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setUserType('agent')}
                            className={`flex-1 flex items-center gap-4 p-4 rounded-xl transition-all border-2 text-left ${userType === 'agent' ? 'border-emerald-400 bg-emerald-500/20' : 'border-transparent hover:bg-slate-700'}`}
                        >
                            <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg shadow-emerald-500/50">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <div>
                                <div className={`font-bold ${userType === 'agent' ? 'text-emerald-300' : 'text-gray-300'}`}>Real Estate Agent</div>
                                <div className="text-xs text-gray-400">Manage multiple listings</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setUserType('developer')}
                            className={`flex-1 flex items-center gap-4 p-4 rounded-xl transition-all border-2 text-left ${userType === 'developer' ? 'border-fuchsia-400 bg-fuchsia-500/20' : 'border-transparent hover:bg-slate-700'}`}
                        >
                            <div className="p-3 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/50">
                                <Building className="w-6 h-6" />
                            </div>
                            <div>
                                <div className={`font-bold ${userType === 'developer' ? 'text-fuchsia-300' : 'text-gray-300'}`}>RE Developer</div>
                                <div className="text-xs text-gray-400">Large projects & scale</div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Banner */}
                <div className="bg-gradient-to-r from-lime-500/20 to-emerald-500/20 border-2 border-lime-500/30 rounded-xl p-4 flex items-center justify-center gap-2 mb-12 text-lime-200 font-bold max-w-4xl mx-auto shadow-lg">
                    <ShieldCheck className="w-5 h-5 text-lime-400" />
                    You're currently on the <span className="text-lime-300 font-extrabold">Free</span> plan
                </div>

                {/* Plans Grid */}
                <div className="flex flex-wrap justify-center gap-8">
                    {currentPlans.map((plan) => (
                        <div key={plan.name} className={`relative rounded-3xl p-8 transition-all duration-500 flex flex-col w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] min-w-[300px] max-w-[340px] group ${plan.popular
                            ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-400/50 shadow-2xl shadow-cyan-500/20 scale-105 z-10'
                            : 'bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700 hover:border-cyan-500/30 shadow-xl'}`}>

                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-cyan-500/50 border border-cyan-400">
                                    Most Popular
                                </div>
                            )}

                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 mx-auto transition-transform group-hover:scale-110 duration-300 bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
                                {plan.icon}
                            </div>

                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">{plan.name}</h3>
                                <p className="text-sm text-gray-400 mb-6 h-10 leading-relaxed">{plan.description}</p>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-5xl font-black text-white tracking-tighter">${plan.price}</span>
                                    <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">/month</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-10 flex-grow">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-4 text-sm text-gray-300">
                                        <div className="mt-1 bg-emerald-500/20 rounded-full p-1 border border-emerald-500/30">
                                            <Check className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span className="font-medium">{feature}</span>
                                    </div>
                                ))}
                                {plan.missing.map((feature) => (
                                    <div key={feature} className="flex items-start gap-4 text-sm text-gray-500">
                                        <div className="mt-1 bg-slate-700/50 rounded-full p-1 border border-slate-600">
                                            <X className="w-3 h-3 text-gray-500" />
                                        </div>
                                        <span className="line-through decoration-gray-600">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    if (plan.price > 0) {
                                        window.location.href = `/checkout?plan=${encodeURIComponent(plan.name)}&price=${plan.price}`;
                                    }
                                }}
                                disabled={plan.price === 0}
                                className={`w-full py-4 rounded-xl font-black text-lg transition-all duration-300 transform hover:-translate-y-1 active:scale-95 ${plan.price === 0
                                    ? 'bg-slate-700 text-gray-500 cursor-default opacity-50'
                                    : plan.popular
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/40 hover:shadow-cyan-500/60 border-2 border-cyan-400/50'
                                        : 'bg-white text-slate-900 hover:bg-cyan-50 hover:text-cyan-600 border-2 border-transparent shadow-lg'
                                    }`}
                            >
                                {plan.price === 0 ? 'Current Plan' : 'Get Started Now'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* FAQ */}
                <div className="mt-32 max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Got Questions?</h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mx-auto rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-800/40 backdrop-blur-md p-8 rounded-2xl border-2 border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                            <h3 className="font-bold text-white mb-3 text-lg">Can I upgrade or downgrade my plan?</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">Yes! You can change your plan at any time. Changes take effect immediately, and any remaining balance will be credited to your account.</p>
                        </div>
                        <div className="bg-slate-800/40 backdrop-blur-md p-8 rounded-2xl border-2 border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                            <h3 className="font-bold text-white mb-3 text-lg">What payment methods do you accept?</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">We accept all major credit cards, Apple Pay, Google Pay, and bank transfers for our annual enterprise plans.</p>
                        </div>
                        <div className="bg-slate-800/40 backdrop-blur-md p-8 rounded-2xl border-2 border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                            <h3 className="font-bold text-white mb-3 text-lg">Is there a free trial?</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">Absolutely! Our Free plan is unlimited in time. You only upgrade when you need the premium tools and features.</p>
                        </div>
                        <div className="bg-slate-800/40 backdrop-blur-md p-8 rounded-2xl border-2 border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                            <h3 className="font-bold text-white mb-3 text-lg">What happens if I downgrade?</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">Your listings remain active but you won't be able to add new ones until you're within your new plan's limit. Your virtual tours will remain private.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
