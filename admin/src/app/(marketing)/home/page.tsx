'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Truck, Clock, Shield, Star, MapPin, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DownloadModal } from '@/components/ui/download-modal';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Clock,
    title: 'Your Time, Protected',
    description: 'No more battling Lagos traffic or spending hours in market queues. Reclaim your weekends and evenings for what truly matters.',
  },
  {
    icon: ShoppingBag,
    title: 'The Full Market Experience',
    description: 'Fresh produce, quality meats, household essentials, and market favorites — all from trusted supermarkets and local vendors.',
  },
  {
    icon: Truck,
    title: 'To Your Door, Fast',
    description: 'From the market to your doorstep in as little as 30 minutes. Track your order in real-time and plan your day with confidence.',
  },
  {
    icon: Shield,
    title: 'Freshness Guaranteed',
    description: "Every item is handpicked for quality. Not satisfied? We'll make it right — that's our promise to you.",
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Browse Your Favorite Stores',
    description: 'Explore supermarkets and markets near you. Find fresh produce, snacks, beverages, and everything your home needs.',
  },
  {
    step: '02',
    title: 'Fill Your Cart',
    description: 'Add items with a tap. No haggling, no stress. Transparent prices from vendors you can trust.',
  },
  {
    step: '03',
    title: 'We Handle the Rest',
    description: 'Our trained riders pick your items with care and deliver them fresh to your doorstep — rain or shine.',
  },
];

const testimonials = [
  {
    name: 'Adaeze Okonkwo',
    role: 'Marketing Manager, Victoria Island',
    content: 'I used to dread Saturday market runs. Now I order on Friday evening and wake up to fresh groceries at my door. FetchMart gave me my weekends back.',
    rating: 5,
  },
  {
    name: 'Emmanuel Adeyemi',
    role: 'Father of Three, Lekki',
    content: 'With three kids and a demanding job, finding time to shop was impossible. FetchMart feels like having a personal shopper who actually cares about quality.',
    rating: 5,
  },
  {
    name: 'Chioma Nwosu',
    role: 'Restaurant Owner, Ikeja',
    content: 'I run a small restaurant and reliability is everything. FetchMart delivers exactly what I need, when I need it. My customers taste the difference.',
    rating: 5,
  },
];

const stats = [
  { value: '50K+', label: 'Happy Homes' },
  { value: '100+', label: 'Partner Stores' },
  { value: '30min', label: 'Avg. Delivery' },
  { value: '4.9', label: 'App Rating' },
];

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero zoom-out effect on the background image
      gsap.fromTo(
        heroImageRef.current,
        { scale: 1.15 },
        { scale: 1, duration: 2.5, ease: 'power2.out' }
      );

      // Sequential text fade-in for hero content
      const heroElements = heroContentRef.current?.children;
      if (heroElements) {
        gsap.fromTo(
          heroElements,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            stagger: 0.3,
            delay: 0.5,
          }
        );
      }

      // Features section - fade in on scroll
      const featureItems = featuresRef.current?.querySelectorAll('.feature-item');
      if (featureItems && featureItems.length > 0) {
        gsap.fromTo(
          featureItems,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.15,
            scrollTrigger: {
              trigger: featuresRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

      // How it works - subtle slide in
      const stepItems = howItWorksRef.current?.querySelectorAll('.step-item');
      if (stepItems && stepItems.length > 0) {
        gsap.fromTo(
          stepItems,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            ease: 'power2.out',
            stagger: 0.2,
            scrollTrigger: {
              trigger: howItWorksRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

      // Testimonials - gentle fade
      const testimonialItems = testimonialsRef.current?.querySelectorAll('.testimonial-item');
      if (testimonialItems && testimonialItems.length > 0) {
        gsap.fromTo(
          testimonialItems,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.2,
            scrollTrigger: {
              trigger: testimonialsRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

      // CTA section - scale and fade
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, scale: 0.98 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-white">
      <DownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      {/* Hero Section - Full Background with Left-Aligned Content */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image with zoom effect */}
        <div ref={heroImageRef} className="absolute inset-0">
          <Image
            src="/pic/bg6.jpg"
            alt="Fresh produce delivered to your doorstep"
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Centered Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full text-center">
          <div ref={heroContentRef} className="max-w-3xl mx-auto">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-white leading-[1.15] mb-6 opacity-0">
              Fresh from the market.
              <br />
              <span className="text-[#4CAF50]">Right at your door.</span>
            </h1>
            
            <p className="text-base sm:text-lg text-white/80 mb-8 leading-relaxed max-w-2xl mx-auto opacity-0">
              Skip the queues, the traffic, and the stress. FetchMart brings market-fresh groceries and household essentials to you — fast, easy, and affordable.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-[#4CAF50] hover:bg-[#388E3C] text-white text-sm rounded-full font-semibold transition-all hover:shadow-lg hover:scale-105 flex items-center gap-2"
              >
                Get the App
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Minimal & Aesthetic */}
      <section ref={featuresRef} className="py-24 lg:py-32 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Section Header - Left aligned */}
          <div className="max-w-xl mb-16 lg:mb-20">
            <p className="text-orange-500 font-medium mb-3 tracking-wide uppercase text-sm">Why FetchMart</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Your time is precious.
              <br />
              <span className="text-gray-400">We protect it.</span>
            </h2>
          </div>

          {/* Features Grid - Clean 2x2 with generous spacing */}
          <div className="grid md:grid-cols-2 gap-x-12 lg:gap-x-20 gap-y-12 lg:gap-y-16">
            {features.map((feature, index) => (
              <div key={index} className="feature-item group flex gap-6 opacity-0">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#4CAF50]/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-[#4CAF50]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Excellence Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        {/* Background Image */}
        <Image
          src="/pic/bg7.jpg"
          alt="Fresh groceries delivered with care"
          fill
          className="object-cover"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[#4CAF50] font-medium mb-3 tracking-wide uppercase text-sm">Delivery Excellence</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Your groceries,
              <br />
              <span className="text-white/70">handled with care.</span>
            </h2>
            <p className="text-lg text-white/85 leading-relaxed mb-8">
              Our trained riders don't just deliver — they protect your order like it's their own. Fresh produce stays fresh. Fragile items arrive intact. Every single time.
            </p>
            
            <div className="space-y-4">
              {[
                'Real-time tracking from pickup to your door',
                'Temperature-controlled bags for freshness',
                'Contactless delivery for peace of mind',
                'Quality guarantee on every order'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-[#4CAF50] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white/90">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Elegant Steps */}
      <section ref={howItWorksRef} className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Two-column layout */}
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left - Header */}
            <div>
              <p className="text-[#4CAF50] font-medium mb-3 tracking-wide uppercase text-sm">How It Works</p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                From the market
                <br />
                <span className="text-gray-400">to your door.</span>
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed max-w-md">
                No more juggling multiple apps or store visits. Everything you need is right here.
              </p>
            </div>

            {/* Right - Steps */}
            <div className="space-y-8">
              {howItWorks.map((item, index) => (
                <div key={index} className="step-item flex gap-6 group opacity-0">
                  {/* Step number */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-full border-2 border-gray-200 group-hover:border-[#4CAF50] flex items-center justify-center transition-colors">
                    <span className="text-lg font-semibold text-gray-400 group-hover:text-[#4CAF50] transition-colors">{item.step}</span>
                  </div>
                  {/* Content */}
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

   

      {/* Testimonials - Improved Design */}
      <section ref={testimonialsRef} className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="max-w-xl mb-16 lg:mb-20">
            <p className="text-orange-500 font-medium mb-3 tracking-wide uppercase text-sm">Customer Stories</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Real stories from
              <br />
              <span className="text-gray-400">real homes.</span>
            </h2>
          </div>

          {/* Testimonials Grid */}
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-item group opacity-0">
                {/* Quote */}
                <div className="mb-6">
                  <svg className="w-8 h-8 text-[#4CAF50]/20 mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                  </svg>
                  <p className="text-lg text-gray-700 leading-relaxed font-medium">
                    {testimonial.content}
                  </p>
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#FFC107] text-[#FFC107]" />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4CAF50] to-[#388E3C] flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section - Dark Card Design */}
      <section ref={ctaRef} className="relative bg-white py-16 lg:py-20 px-6 lg:px-8 opacity-0">
        <div className="max-w-6xl mx-auto">
          {/* Dark Card - Matching Reference Design */}
          <div className="relative bg-gray-950 rounded-3xl overflow-hidden">
            {/* Gradient accent line at top */}
            <div className="absolute top-0 right-0 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-yellow-400/50 to-[#4CAF50]/50"></div>
            
            <div className="grid lg:grid-cols-2 gap-8 p-10 lg:p-16">
              {/* Left Content */}
              <div className="flex flex-col justify-center">
                <h3 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                  Experience superior
                  <br />
                  grocery delivery
                </h3>
                <p className="text-gray-400 text-lg mb-8">
                  30+ minute delivery across Lagos.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center bg-white text-gray-900 px-6 py-3 rounded-lg font-medium w-fit hover:bg-gray-100 transition-colors text-sm"
                >
                  Get started
                </button>
              </div>
              
              {/* Right Visual - Globe/Network Visualization with Background Image */}
              <div className="relative flex items-center justify-center lg:justify-end">
                <div className="relative w-72 h-72 lg:w-80 lg:h-80">
                  {/* Outer ring gradient */}
                  <div className="absolute inset-0 rounded-full border border-gray-700/50"></div>
                  <div className="absolute top-0 right-0 w-3/4 h-1/2 rounded-full border border-transparent bg-gradient-to-r from-transparent via-yellow-500/30 to-[#4CAF50]/30 blur-sm"></div>
                  
                  {/* Globe with background image and dots pattern overlay */}
                  <div className="absolute inset-4 rounded-full overflow-hidden">
                    {/* Background Image */}
                    <Image
                      src="/pic/bg7.jpg"
                      alt="Delivery"
                      fill
                      className="object-cover"
                    />
                    
                    {/* Dark overlay for better dot visibility */}
                    <div className="absolute inset-0 bg-gray-900/50"></div>
                    
                    {/* Dot pattern to simulate globe/network */}
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1.5px, transparent 1.5px)`,
                      backgroundSize: '14px 14px'
                    }}></div>
                    
                    {/* Curved lines overlay */}
                    <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 200 200">
                      <ellipse cx="100" cy="100" rx="80" ry="40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" transform="rotate(-20 100 100)"/>
                      <ellipse cx="100" cy="100" rx="60" ry="80" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" transform="rotate(10 100 100)"/>
                    </svg>
                    
                    {/* Highlight dots */}
                    <div className="absolute top-1/4 right-1/4 w-2.5 h-2.5 bg-white rounded-full opacity-80 shadow-lg shadow-white/50"></div>
                    <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-[#4CAF50] rounded-full opacity-90 shadow-lg shadow-green-500/50"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-80 shadow-lg shadow-yellow-400/50"></div>
                    <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-orange-400 rounded-full opacity-70 shadow-lg shadow-orange-400/50"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
