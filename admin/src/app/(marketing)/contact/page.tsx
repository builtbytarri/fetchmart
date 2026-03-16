'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Send, MessageSquare, Building, Users, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const contactInfo = [
  {
    icon: MapPin,
    title: 'Visit Us',
    details: ['Lagos, Nigeria'],
  },
  {
    icon: Phone,
    title: 'Call Us',
    details: ['+234 800 FETCH'],
  },
  {
    icon: Mail,
    title: 'Email Us',
    details: ['support@fetchmart.com.ng'],
  },
  {
    icon: Clock,
    title: 'Working Hours',
    details: ['Mon - Sun: 8AM - 8PM'],
  },
];

const inquiryTypes = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'support', label: 'Customer Support' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'vendor', label: 'Become a Vendor' },
  { value: 'rider', label: 'Become a Rider' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const cardsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.querySelectorAll('.contact-card');
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 85%',
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ name: '', email: '', phone: '', inquiryType: 'general', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <Image
          src="/pic/bg6.jpg"
          alt="Contact FetchMart"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full py-20">
          <div className="max-w-2xl">
            <p className="text-[#4CAF50] font-medium mb-4 tracking-wide uppercase text-sm">Get In Touch</p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium text-white leading-tight mb-6">
              We&apos;d love to
              <br />
              <span className="text-[#4CAF50]">hear from you.</span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-xl">
              Have questions, feedback, or want to partner with us? Our team is here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section ref={cardsRef} className="py-16 lg:py-20 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {contactInfo.map((item, index) => (
              <div key={index} className="contact-card bg-white rounded-2xl p-6 text-center opacity-0">
                <div className="w-12 h-12 bg-[#4CAF50]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-[#4CAF50]" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm lg:text-base">{item.title}</h3>
                <div className="mt-2">
                  {item.details.map((detail, i) => (
                    <p key={i} className="text-gray-500 text-sm">{detail}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Left - Form */}
            <div>
              <div className="mb-10">
                <p className="text-orange-500 font-medium mb-3 tracking-wide uppercase text-sm">Send a Message</p>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  Let&apos;s start a
                  <br />
                  <span className="text-gray-400">conversation.</span>
                </h2>
              </div>

              {submitted ? (
                <div className="bg-[#FAFAF9] rounded-2xl p-10 text-center">
                  <div className="w-16 h-16 bg-[#4CAF50]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-[#4CAF50]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Message Sent!</h3>
                  <p className="text-gray-500 mt-2">Thank you for reaching out. We&apos;ll respond within 24 hours.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-[#4CAF50] font-medium hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+234 800 000 0000"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700 mb-2">Inquiry Type</label>
                      <select
                        id="inquiryType"
                        name="inquiryType"
                        value={formData.inquiryType}
                        onChange={handleChange}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-colors bg-white"
                      >
                        {inquiryTypes.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      placeholder="Tell us how we can help you..."
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-colors resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-[#4CAF50] hover:bg-[#388E3C] text-white font-semibold transition-colors flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Right - Contact Options */}
            <div className="space-y-6">
              {/* Quick Contact */}
              <div className="bg-gray-950 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Quick Contact</h3>
                <div className="space-y-4">
                  <a href="tel:+2348001234567" className="flex items-center gap-4 bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-colors">
                    <div className="w-12 h-12 bg-[#4CAF50]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-[#4CAF50]" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Call Support</p>
                      <p className="text-gray-400 text-sm">+234 800 FETCH</p>
                    </div>
                  </a>
                  <a href="mailto:support@fetchmart.com.ng" className="flex items-center gap-4 bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-colors">
                    <div className="w-12 h-12 bg-[#4CAF50]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-[#4CAF50]" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Email Support</p>
                      <p className="text-gray-400 text-sm">support@fetchmart.com.ng</p>
                    </div>
                  </a>
                  <a href="mailto:info@fetchmart.com.ng" className="flex items-center gap-4 bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-colors">
                    <div className="w-12 h-12 bg-[#4CAF50]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-[#4CAF50]" />
                    </div>
                    <div>
                      <p className="font-medium text-white">General Inquiries</p>
                      <p className="text-gray-400 text-sm">info@fetchmart.com.ng</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Partner CTA */}
              <div className="bg-[#FAFAF9] rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Want to Partner?</h3>
                    <p className="text-gray-500 text-sm mt-1">Join our network of vendors.</p>
                    <a href="mailto:info@fetchmart.com.ng" className="inline-flex items-center gap-1 text-[#4CAF50] font-medium text-sm mt-2 hover:underline">
                      info@fetchmart.com.ng <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Rider CTA */}
              <div className="bg-[#FAFAF9] rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#4CAF50]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-[#4CAF50]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Become a Rider</h3>
                    <p className="text-gray-500 text-sm mt-1">Earn on your own schedule.</p>
                    <a href="mailto:info@fetchmart.com.ng" className="inline-flex items-center gap-1 text-[#4CAF50] font-medium text-sm mt-2 hover:underline">
                      Apply Now <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-[#FAFAF9] px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to start shopping?
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Fresh groceries delivered to your door in 30 minutes.
          </p>
          <a
            href="https://fetchmart.com.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#4CAF50] hover:bg-[#388E3C] text-white px-8 py-4 rounded-full font-semibold transition-all hover:scale-105"
          >
            Shop Now
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>
    </div>
  );
}
