import { SERVICES } from '../../lib/services';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react';

export function generateStaticParams() {
    return SERVICES.map((service) => ({
        slug: service.slug,
    }));
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const service = SERVICES.find(s => s.slug === slug);

    if (!service) {
        notFound();
    }

    return (
        <div className="bg-gray-50 min-h-screen py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/services" className="inline-flex items-center text-slate-500 hover:text-orange-600 mb-8 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Services
                </Link>

                <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                    <div className="bg-slate-900 p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="relative z-10 flex items-start gap-6">
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                                <service.icon className="w-12 h-12 text-orange-400" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold mb-4">{service.title}</h1>
                                <p className="text-xl text-gray-300 max-w-2xl">{service.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-12">
                        <div className="prose prose-lg max-w-none text-slate-600 mb-12">
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Service Overview</h3>
                            <p>{service.fullDescription}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            <div className="bg-orange-50 p-8 rounded-2xl">
                                <h3 className="font-bold text-xl text-slate-900 mb-6">Key Benefits</h3>
                                <ul className="space-y-4">
                                    {service.benefits.map((benefit, idx) => (
                                        <li key={idx} className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                            <span className="font-medium text-slate-700">{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="border border-gray-100 rounded-2xl p-8 flex flex-col justify-center items-center text-center">
                                <div className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-2">Pricing</div>
                                <div className="text-4xl font-bold text-slate-900 mb-8">{service.price}</div>
                                <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg hover:shadow-orange-500/25 flex items-center justify-center gap-2">
                                    Request Service <ArrowRight className="w-5 h-5" />
                                </button>
                                <p className="text-xs text-slate-400 mt-4">No payment required to inquire</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
