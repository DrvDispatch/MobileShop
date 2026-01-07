'use client';

/**
 * Classic Skin - Contact Page
 * 
 * Simple contact page with form and info
 */

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';

export interface ContactPageVM {
    // Currently uses no props - can be extended later
}

export function ContactPage(_props: { vm?: ContactPageVM }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In production, this would send to an API
        setSubmitted(true);
    };

    return (
        <div className="bg-slate-50 py-16">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-12">
                    <h1 className="font-serif text-4xl font-bold text-slate-800 mb-4">Contact Us</h1>
                    <p className="text-slate-600 max-w-xl mx-auto">
                        Have questions or want to book an appointment? Get in touch with us.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Form */}
                    <div className="bg-white rounded-lg border-2 border-slate-200 p-8">
                        {submitted ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Send className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-slate-800 mb-2">Message Sent!</h2>
                                <p className="text-slate-600">Thank you for contacting us. We will get back to you soon.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <h2 className="text-xl font-semibold text-slate-800 mb-4">Send us a Message</h2>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-slate-800 focus:outline-none"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-slate-800 focus:outline-none"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-slate-800 focus:outline-none"
                                        placeholder="+31 6 12345678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Your Message</label>
                                    <textarea
                                        value={formData.message}
                                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-slate-800 focus:outline-none"
                                        placeholder="How can we help you?"
                                        rows={4}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                    Send Message
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
                            <h2 className="text-xl font-semibold text-slate-800 mb-6">Contact Information</h2>
                            <div className="space-y-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-6 h-6 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800">Phone</p>
                                        <p className="text-slate-600">+31 6 12345678</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-6 h-6 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800">Email</p>
                                        <p className="text-slate-600">info@example.com</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-6 h-6 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800">Address</p>
                                        <p className="text-slate-600">123 Main Street<br />Amsterdam, Netherlands</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
                            <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Opening Hours
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Monday - Friday</span>
                                    <span className="font-medium text-slate-800">9:00 - 18:00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Saturday</span>
                                    <span className="font-medium text-slate-800">10:00 - 16:00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Sunday</span>
                                    <span className="font-medium text-slate-800">Closed</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
