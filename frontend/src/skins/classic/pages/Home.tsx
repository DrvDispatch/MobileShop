'use client';

/**
 * Classic Skin - Home Page
 * 
 * Traditional professional homepage with:
 * - Clean hero section with image
 * - Service cards with pricing
 * - Why choose us section
 * - Call to action
 */

import Link from 'next/link';
import { Calendar, Clock, Star, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface HomePageVM {
    // Currently uses no props - can be extended later
}

export function HomePage(_props: { vm?: HomePageVM }) {
    // Sample services - in production these would come from API
    const services = [
        {
            name: 'Basic Service',
            duration: '30 min',
            price: '€25',
            description: 'Quick and efficient service for your everyday needs.'
        },
        {
            name: 'Standard Service',
            duration: '45 min',
            price: '€40',
            description: 'Our most popular option with comprehensive care.'
        },
        {
            name: 'Premium Service',
            duration: '60 min',
            price: '€55',
            description: 'Full treatment with extra attention to detail.'
        },
        {
            name: 'Deluxe Package',
            duration: '90 min',
            price: '€75',
            description: 'The complete experience including all premium extras.'
        },
    ];

    const features = [
        { icon: Clock, title: 'Flexible Hours', desc: 'Open 6 days a week with convenient time slots' },
        { icon: Star, title: 'Expert Team', desc: 'Skilled professionals with years of experience' },
        { icon: Users, title: 'Personalized Care', desc: 'Every client receives individual attention' },
        { icon: CheckCircle2, title: 'Quality Guaranteed', desc: 'Satisfaction guaranteed or we make it right' },
    ];

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="relative bg-slate-50 overflow-hidden">
                <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Text Content */}
                        <div>
                            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-slate-800 leading-tight mb-6">
                                Professional Service
                                <br />
                                <span className="text-slate-600">You Can Trust</span>
                            </h1>
                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                Experience quality service from our team of dedicated professionals.
                                We take pride in delivering exceptional results every time.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/book"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded transition-all hover:shadow-lg"
                                >
                                    <Calendar className="w-5 h-5" />
                                    Book Appointment
                                </Link>
                                <Link
                                    href="/contact"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded transition-colors"
                                >
                                    Contact Us
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>

                        {/* Hero Image/Visual */}
                        <div className="relative">
                            <div className="bg-slate-200 rounded-lg aspect-[4/3] flex items-center justify-center overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop"
                                    alt="Professional service"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {/* Floating Badge */}
                            <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-4 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                        <Star className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">4.9 Rating</p>
                                        <p className="text-sm text-slate-500">500+ Reviews</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-3xl font-bold text-slate-800 mb-4">Our Services</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            Choose from our range of professional services, each designed to meet your specific needs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {services.map((service, index) => (
                            <div
                                key={index}
                                className="bg-white border-2 border-slate-200 rounded-lg p-6 hover:border-slate-400 hover:shadow-md transition-all group"
                            >
                                <div className="mb-4">
                                    <h3 className="font-semibold text-lg text-slate-800 mb-1">{service.name}</h3>
                                    <p className="text-sm text-slate-500">{service.duration}</p>
                                </div>
                                <p className="text-slate-600 text-sm mb-4 min-h-[48px]">{service.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-slate-800">{service.price}</span>
                                    <Link
                                        href="/book"
                                        className="text-slate-600 hover:text-slate-800 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all"
                                    >
                                        Book <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-10">
                        <Link
                            href="/book"
                            className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold"
                        >
                            View All Services
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-3xl font-bold text-slate-800 mb-4">Why Choose Us</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            We are committed to providing you with the best possible experience.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="text-center">
                                <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <feature.icon className="w-7 h-7 text-slate-700" />
                                </div>
                                <h3 className="font-semibold text-slate-800 mb-2">{feature.title}</h3>
                                <p className="text-slate-600 text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-slate-800">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="font-serif text-3xl font-bold text-white mb-4">
                        Ready to Get Started?
                    </h2>
                    <p className="text-slate-300 mb-8 max-w-xl mx-auto">
                        Book your appointment today and experience our professional service firsthand.
                    </p>
                    <Link
                        href="/book"
                        className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white hover:bg-slate-100 text-slate-800 font-semibold rounded transition-colors"
                    >
                        <Calendar className="w-5 h-5" />
                        Book Your Appointment
                    </Link>
                </div>
            </section>
        </div>
    );
}
