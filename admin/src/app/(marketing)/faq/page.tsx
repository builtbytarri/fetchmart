'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, ShoppingBag, Truck, CreditCard, Users, HelpCircle, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const faqCategories = [
  {
    id: 'ordering',
    icon: ShoppingBag,
    title: 'Ordering',
    questions: [
      {
        question: 'How do I place an order?',
        answer: 'Visit fetchmart.com.ng, browse products, add items to your cart, and checkout. You can pay online or choose cash on delivery. It\'s that simple!',
      },
      {
        question: 'Can I schedule a delivery for later?',
        answer: 'Yes! During checkout, you can select your preferred delivery time slot. We offer same-day and next-day delivery options.',
      },
      {
        question: 'Is there a minimum order amount?',
        answer: 'Yes, the minimum order amount is ₦2,000. This helps us ensure efficient delivery operations.',
      },
    ],
  },
  {
    id: 'delivery',
    icon: Truck,
    title: 'Delivery',
    questions: [
      {
        question: 'What areas do you deliver to?',
        answer: 'We currently deliver across Lagos. We\'re expanding to other major cities soon. Enter your address at checkout to confirm delivery availability.',
      },
      {
        question: 'How long does delivery take?',
        answer: 'Standard delivery takes 30 minutes to 2 hours depending on your location and order size. You can track your order in real-time through our app.',
      },
      {
        question: 'What if I\'m not home during delivery?',
        answer: 'Our rider will call you before arriving. If you\'re unavailable, you can reschedule or designate someone else to receive the order.',
      },
    ],
  },
  {
    id: 'payment',
    icon: CreditCard,
    title: 'Payment',
    questions: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept debit/credit cards, bank transfers, and cash on delivery. All online payments are processed securely.',
      },
      {
        question: 'Can I get a refund?',
        answer: 'Yes, if you receive damaged or incorrect items, contact our support team within 24 hours of delivery. We\'ll process your refund or replacement promptly.',
      },
      {
        question: 'Are there any hidden fees?',
        answer: 'No hidden fees. You\'ll see the complete breakdown including delivery fee before checkout. What you see is what you pay.',
      },
    ],
  },
  {
    id: 'partnership',
    icon: Users,
    title: 'Partnership',
    questions: [
      {
        question: 'How can I become a vendor?',
        answer: 'Email us at info@fetchmart.com.ng with your business details. Our partnerships team will review your application and get back to you within 48 hours.',
      },
      {
        question: 'How do I become a delivery rider?',
        answer: 'Send your application to info@fetchmart.com.ng. Include your contact details, location, and whether you have your own vehicle.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('ordering');
  const faqRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = faqRef.current?.querySelectorAll('.faq-item');
      if (items && items.length > 0) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: faqRef.current,
              start: 'top 85%',
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, [activeCategory]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const currentCategory = faqCategories.find(cat => cat.id === activeCategory);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[#4CAF50] font-medium mb-4 tracking-wide uppercase text-sm">Help Center</p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium text-gray-900 leading-tight mb-6">
              Frequently Asked
              <br />
              <span className="text-gray-400">Questions</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              Find quick answers to common questions about ordering, delivery, payments, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {faqCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === category.id
                    ? 'bg-[#4CAF50] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <category.icon className="w-4 h-4" />
                {category.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section ref={faqRef} className="py-16 lg:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              {currentCategory && <currentCategory.icon className="w-6 h-6 text-[#4CAF50]" />}
              <h2 className="text-2xl font-bold text-gray-900">{currentCategory?.title}</h2>
            </div>
          </div>

          <div className="space-y-4">
            {currentCategory?.questions.map((item, index) => {
              const itemId = `${activeCategory}-${index}`;
              const isOpen = openItems.includes(itemId);
              
              return (
                <div 
                  key={index} 
                  className="faq-item bg-[#FAFAF9] rounded-2xl overflow-hidden opacity-0"
                >
                  <button
                    onClick={() => toggleItem(itemId)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="font-semibold text-gray-900 pr-4">{item.question}</span>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <p className="px-6 pb-6 text-gray-500 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 lg:py-20 bg-[#FAFAF9]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-[#4CAF50]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-[#4CAF50]" />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Still have questions?
          </h2>
          <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-[#4CAF50] hover:bg-[#388E3C] text-white px-8 py-4 rounded-full font-semibold transition-all hover:scale-105"
            >
              Contact Support
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="mailto:support@fetchmart.com.ng"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-full font-semibold border border-gray-200 hover:border-gray-300 transition-all"
            >
              support@fetchmart.com.ng
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-white px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-gray-950 rounded-3xl overflow-hidden">
            <div className="absolute top-0 right-0 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-yellow-400/50 to-[#4CAF50]/50"></div>
            
            <div className="p-10 lg:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
                Ready to start shopping?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                Fresh groceries delivered to your door in 30 minutes.
              </p>
              <a
                href="https://fetchmart.com.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-full font-semibold transition-all hover:scale-105"
              >
                Shop Now
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
