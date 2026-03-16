'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Target, Eye, Heart, Users, TrendingUp, Award, ArrowRight, Truck, ShoppingBag, Clock } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const values = [
  {
    icon: Heart,
    title: 'Your Time Matters',
    description: 'We exist because you deserve to spend less time shopping and more time living.',
  },
  {
    icon: Award,
    title: 'Freshness Guaranteed',
    description: 'If it\'s not fresh enough for our families, it\'s not good enough for yours.',
  },
  {
    icon: TrendingUp,
    title: 'Always Improving',
    description: 'Your feedback shapes every update we make to serve you better.',
  },
  {
    icon: Users,
    title: 'Empowering Local',
    description: 'Behind every order is a local vendor earning a living.',
  },
];

const stats = [
  { value: '50K+', label: 'Orders Delivered' },
  { value: '100+', label: 'Partner Stores' },
  { value: '30min', label: 'Avg. Delivery' },
  { value: '4.9', label: 'App Rating' },
];

const journey = [
  {
    year: '2023',
    title: 'The Beginning',
    description: 'Started as busy professionals tired of traffic and market queues.',
  },
  {
    year: '2024',
    title: 'Lagos Trusted Us',
    description: 'Over 10,000 homes chose FetchMart for their grocery needs.',
  },
  {
    year: '2025',
    title: 'Growing Together',
    description: '50,000+ deliveries. More stores. Faster delivery. Better experience.',
  },
  {
    year: 'Next',
    title: 'Beyond Lagos',
    description: 'Expanding to bring convenience to every Nigerian home.',
  },
];

export default function AboutPage() {
  const heroRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const valuesRef = useRef<HTMLElement>(null);

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
          <div className="max-w-2xl">
            <p className="text-[#4CAF50] font-medium mb-4 tracking-wide uppercase text-sm">About FetchMart</p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium text-white leading-tight mb-6">
              We understand.
              <br />
              <span className="text-[#4CAF50]">Your time is precious.</span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-xl">
              FetchMart connects you to supermarkets and local markets across Lagos. No traffic. No queues. Just fresh groceries delivered to your door.
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

      {/* Mission & Vision */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Mission */}
            <div className="bg-gray-950 rounded-3xl p-8 md:p-12">
              <div className="w-14 h-14 bg-[#4CAF50]/20 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-[#4CAF50]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                To give busy Nigerians their time back. We connect homes to supermarkets and local markets through a platform that makes fresh groceries just a tap away.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-[#FAFAF9] rounded-3xl p-8 md:p-12">
              <div className="w-14 h-14 bg-[#4CAF50]/10 rounded-2xl flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-[#4CAF50]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                A Nigeria where no one has to choose between career success and a well-stocked kitchen. Fresh, quality groceries accessible to every home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-orange-500 font-medium mb-3 tracking-wide uppercase text-sm">Our Story</p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Built for people
                <br />
                <span className="text-gray-400">like us.</span>
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  We know what it&apos;s like. The alarm goes off, you rush to work, sit in traffic, push through meetings, and by the time you&apos;re heading home, the market is the last place you want to be.
                </p>
                <p>
                  But you still need to eat. Your family still needs fresh food. That&apos;s why we built FetchMart — a bridge between you and the markets you trust, without the traffic, queues, or stress.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl overflow-hidden">
                <Image
                  src="/pic/bg6.jpg"
                  alt="Fresh groceries"
                  width={600}
                  height={500}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section ref={valuesRef} className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-16">
            <p className="text-[#4CAF50] font-medium mb-3 tracking-wide uppercase text-sm">Our Values</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              What we
              <br />
              <span className="text-gray-400">stand for.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="value-item opacity-0">
                <div className="w-12 h-12 bg-[#4CAF50]/10 rounded-2xl flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-[#4CAF50]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-500 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-16">
            <p className="text-orange-500 font-medium mb-3 tracking-wide uppercase text-sm">Our Journey</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              From idea
              <br />
              <span className="text-gray-400">to impact.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {journey.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <span className="inline-block px-3 py-1 bg-[#4CAF50]/10 text-[#4CAF50] text-sm font-semibold rounded-full mb-4">
                  {item.year}
                </span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-white px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-gray-950 rounded-3xl overflow-hidden">
            <div className="absolute top-0 right-0 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-yellow-400/50 to-[#4CAF50]/50"></div>
            
            <div className="p-10 lg:p-16 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                Ready to reclaim your time?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                Join 50,000+ homes across Lagos who&apos;ve discovered a better way to shop.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://fetchmart.com.ng"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-full font-semibold transition-all hover:scale-105"
                >
                  Start Shopping
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
