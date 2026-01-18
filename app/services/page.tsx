import { SERVICES } from '../lib/services';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function ServicesPage() {
    return (
        <div className="bg-white min-h-screen pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Premium Real Estate Services</h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                        Everything you need to buy, sell, or manage your property efficiently. From legal assistance to professional marketing.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {SERVICES.map((service) => (
                        <Link
                            key={service.slug}
                            href={`/services/${service.slug}`}
                            className="group bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all duration-300 flex flex-col items-start"
                        >
                            <div className="mb-6 p-4 bg-orange-50 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <service.icon className="w-8 h-8 text-orange-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-orange-600 transition-colors">
                                {service.title}
                            </h3>
                            <p className="text-slate-500 mb-6 leading-relaxed flex-grow">
                                {service.description}
                            </p>
                            <div className="flex items-center text-orange-600 font-bold group-hover:gap-2 transition-all">
                                Learn More <ArrowRight className="w-4 h-4 ml-2" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
