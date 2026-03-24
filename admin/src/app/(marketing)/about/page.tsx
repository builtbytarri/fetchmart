'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Target, Eye, Heart, Users, TrendingUp, Award, ArrowRight, Truck, ShoppingBag, Clock, MapPin, Zap, Shield, Leaf, Sparkles, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const values = [
  {
    icon: Users,
    title: 'Community First',
    description: 'Empowering local vendors and preserving Abuja\'s rich market culture.',
  },
  {
    icon: Zap,
    title: 'Innovation',
    description: 'Leveraging modern tech with real-time tracking, secure payments, and AI recommendations.',
  },
  {
    icon: Heart,
    title: 'Customer-Centric',
    description: 'Convenience without compromise – fresh, affordable, and fast delivery.',
  },
  {
    icon: Leaf,
    title: 'Health & Sustainability',
    description: 'Promoting nutritious local foods to support healthier lifestyles.',
  },
];

const stats = [
  { value: '100+', label: 'Daily Orders Goal' },
  { value: '50+', label: 'Local Vendors' },
  { value: '1hr', label: 'Express Delivery' },
  { value: 'FCT', label: 'Coverage Area' },
];

const goals = [
  {
    title: 'Launch Success',
    description: 'Achieve 100 daily orders within the first 3 months in Abuja.',
  },
  {
    title: 'Vendor Partnerships',
    description: 'Build partnerships with 50+ trusted local market vendors in 6 months.',
  },
  {
    title: 'Sustainable Growth',
    description: 'Reach break-even within 12-18 months through efficient operations.',
  },
  {
    title: 'Scale Operations',
    description: 'Scale to 250+ daily orders in Year 2 while maintaining quality.',
  },
];

const team = [
  {
    name: 'Ekwoba Onyedikachukwu Precious',
    role: 'Founder & CEO',
    color: 'bg-pink-100',
    initials: 'EP',
  },
  {
    name: 'Oche',
    role: 'Operations Manager',
    color: 'bg-orange-100',
    initials: 'OC',
  },
  {
    name: 'Ezinne Obi',
    role: 'Marketing Manager',
    color: 'bg-purple-100',
    initials: 'EO',
  },
  {
    name: 'Theophilus Terri',
    role: 'Tech Lead',
    color: 'bg-blue-100',
    initials: 'TT',
  },
  {
    name: 'Nzube Ekwoba',
    role: 'Customer Service Lead',
    color: 'bg-green-100',
    initials: 'NE',
  },
  {
    name: 'Queen Nwabueze',
    role: 'Customer Service',
    color: 'bg-yellow-100',
    initials: 'QN',
  },
];

const coverageAreas = [
  'Maitama', 'Wuse', 'Garki', 'Asokoro', 'Lugbe', 'Gwarinpa', 'Jabi', 'Utako', 'Kubwa', 'Karu'
];

export default function AboutPage() {
  const heroRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const valuesRef = useRef<HTMLElement>(null);
  const teamRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stats counter animation
      const statItems = statsRef.current?.querySelectorAll('.stat-item');
      if (statItems && statItems.length > 0) {
        gsap.fromTo(
          statItems,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: statsRef.current,
              start: 'top 85%',
            },
          }
        );
      }

      // Values animation
      const valueItems = valuesRef.current?.querySelectorAll('.value-item');
      if (valueItems && valueItems.length > 0) {
        gsap.fromTo(
          valueItems,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: valuesRef.current,
              start: 'top 80%',
            },
          }
        );
      }

      // Team animation
      const teamItems = teamRef.current?.querySelectorAll('.team-item');
      if (teamItems && teamItems.length > 0) {
        gsap.fromTo(
          teamItems,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: teamRef.current,
              start: 'top 80%',
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[70vh] flex items-center overflow-hidden">
        <Image
          src="/pic/bg7.jpg"
          alt="FetchMart delivery"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full py-20">
          <div className="max-w-3xl">
            <p className="text-[#4CAF50] font-medium mb-4 tracking-wide uppercase text-sm">About FetchMart</p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium text-white leading-tight mb-6">
              Fresh from Abuja Markets
              <br />
              <span className="text-[#4CAF50]">to Your Door.</span>
            </h1>
            <p className="text-xl text-white/90 leading-relaxed max-w-2xl mb-4">
              Fast, Reliable, Healthy
            </p>
            <p className="text-lg text-white/70 leading-relaxed max-w-2xl">
              FetchMart is revolutionizing how Abuja residents access everyday essentials from local markets. We bridge the gap between bustling traditional markets and modern convenience.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 lg:py-20 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item text-center opacity-0">
                <p className="text-4xl md:text-5xl font-bold text-[#4CAF50]">{stat.value}</p>
                <p className="text-gray-500 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About FetchMart - Detailed */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-[#4CAF50] font-medium mb-3 tracking-wide uppercase text-sm">Who We Are</p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                A dynamic marketplace
                <br />
                <span className="text-gray-400">for Abuja.</span>
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Through our user-friendly mobile app and website, customers browse, order, and receive fresh groceries, spices, grains, meats, household items, electronics, and more – delivered straight from trusted local vendors to their doorstep.
                </p>
                <p>
                  We stand out by focusing exclusively on Abuja&apos;s vibrant local markets, ensuring authenticity, freshness, and support for small vendors while promoting healthy, nutritious food choices.
                </p>
                <p>
                  In a city where traffic and busy schedules make market runs challenging, FetchMart delivers speed (same-day, express 1-hour, or scheduled options), transparency, and reliability – making everyday shopping effortless and community-driven.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/pic/bg6.jpg"
                  alt="Fresh groceries from Abuja markets"
                  width={600}
                  height={500}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Mission */}
            <div className="bg-gray-950 rounded-3xl p-8 md:p-12">
              <div className="w-14 h-14 bg-[#4CAF50]/20 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-[#4CAF50]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                To make Abuja&apos;s local markets accessible to everyone by providing fast, reliable, and convenient delivery services, while championing healthy, fresh, and locally-sourced food for better living.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg">
              <div className="w-14 h-14 bg-[#4CAF50]/10 rounded-2xl flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-[#4CAF50]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                To become Nigeria&apos;s leading hyperlocal marketplace delivery service, building stronger connections between customers, vendors, and communities across major cities – starting right here in Abuja.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Area */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-orange-500 font-medium mb-3 tracking-wide uppercase text-sm">Location & Coverage</p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Serving Greater
                <br />
                <span className="text-gray-400">Abuja.</span>
              </h2>
              <div className="space-y-4 text-gray-600 mb-8">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#4CAF50] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Headquarters</p>
                    <p>188A A1 Crescent, Federal Housing Authority, Lugbe, Abuja</p>
                    <p className="text-sm text-gray-500">Landmark: Police sign board</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-[#4CAF50] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Primary Service Area</p>
                    <p>Greater Abuja (Federal Capital Territory)</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {coverageAreas.map((area, index) => (
                  <span key={index} className="px-4 py-2 bg-[#4CAF50]/10 text-[#4CAF50] rounded-full text-sm font-medium">
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#4CAF50]/10 to-[#4CAF50]/5 rounded-3xl p-8 md:p-12">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Expansion Focus</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#4CAF50]" />
                  <span className="text-gray-700">Scaling within Abuja first</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#4CAF50]" />
                  <span className="text-gray-700">Plans for neighboring cities</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#4CAF50]" />
                  <span className="text-gray-700">Phased nationwide rollout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Goals Section */}
      <section className="py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-16">
            <p className="text-[#4CAF50] font-medium mb-3 tracking-wide uppercase text-sm">Our Goals</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Building for
              <br />
              <span className="text-gray-400">the future.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {goals.map((goal, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow border border-gray-100">
                <div className="w-10 h-10 bg-[#4CAF50]/10 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-[#4CAF50] font-bold">{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{goal.title}</h3>
                <p className="text-gray-500">{goal.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section ref={valuesRef} className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-16">
            <p className="text-orange-500 font-medium mb-3 tracking-wide uppercase text-sm">What Drives Us</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Our core
              <br />
              <span className="text-gray-400">values.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="value-item opacity-0">
                <div className="w-14 h-14 bg-[#4CAF50]/10 rounded-2xl flex items-center justify-center mb-4">
                  <value.icon className="w-7 h-7 text-[#4CAF50]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-500 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section - Commented out for now
      <section ref={teamRef} className="py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-4">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
                Our Best Working Team
              </h2>
              <p className="text-gray-500 mb-8">
                A dedicated, passionate core team with expertise in e-commerce, logistics, technology, and customer service. Our family-oriented team brings local insight, hustle, and commitment.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#4CAF50] hover:bg-[#388E3C] text-white rounded-full font-medium transition-colors"
              >
                Join Our Team
              </Link>
            </div>
            <div className="lg:col-span-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {team.map((member, index) => (
                  <div 
                    key={index} 
                    className={`team-item opacity-0 ${member.color} rounded-3xl p-6 text-center hover:shadow-lg transition-all`}
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/60 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-700">{member.initials}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{member.role}</p>
                    <div className="flex items-center justify-center gap-4">
                      <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                      <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                      </a>
                      <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* Differentiators */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#4CAF50] font-medium mb-3 tracking-wide uppercase text-sm">Why FetchMart</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              What makes us
              <br />
              <span className="text-gray-400">different.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Deep Local Roots</h3>
              <p className="text-gray-500 text-sm">Focused exclusively on Abuja&apos;s traditional markets</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Transparent Pricing</h3>
              <p className="text-gray-500 text-sm">Honest vendor pricing with no hidden fees</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Flexible Delivery</h3>
              <p className="text-gray-500 text-sm">Same-day, 1-hour express, or scheduled options</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fresh & Healthy</h3>
              <p className="text-gray-500 text-sm">Genuine focus on nutritious local essentials</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-[#FAFAF9] px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-gray-950 rounded-3xl overflow-hidden">
            <div className="absolute top-0 right-0 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-yellow-400/50 to-[#4CAF50]/50"></div>
            
            <div className="p-10 lg:p-16 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                Ready to experience the future of local shopping?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                Download the FetchMart app today or visit our website. Let&apos;s bring the market to you!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://fetchmart.com.ng"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#4CAF50] hover:bg-[#388E3C] text-white px-8 py-4 rounded-full font-semibold transition-all hover:scale-105"
                >
                  Download App
                  <ArrowRight className="w-5 h-5" />
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-semibold border border-white/20 transition-all"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
