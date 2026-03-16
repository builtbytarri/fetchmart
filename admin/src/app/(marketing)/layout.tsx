'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/ui/mini-navbar';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - Dark Premium Design */}
      <footer className="bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8">
            {/* Brand & Contact Info - Left Column */}
            <div className="lg:col-span-4">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <Image
                    src="/images/icon.png"
                    alt="FetchMart"
                    width={24}
                    height={24}
                    className="h-6 w-auto"
                  />
                </div>
                <span className="text-xl font-semibold text-white">FetchMart</span>
              </div>
              
              {/* Address */}
              <address className="not-italic text-gray-400 text-sm leading-relaxed mb-6">
                123 Market Street<br />
                Lagos, Nigeria<br />
                West Africa
              </address>
              
              {/* Contact Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">Phone number</span>
                  <span className="text-gray-300">+234 800 FETCH</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-300">support@fetchmart.com.ng</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-2 lg:col-start-6">
              <h4 className="text-gray-500 text-sm mb-4">Quick links</h4>
              <ul className="space-y-3">
                {[
                  { label: 'About us', href: '/about' },
                  { label: 'FAQ', href: '/faq' },
                  { label: 'Contact us', href: '/contact' }
                ].map((item) => (
                  <li key={item.label}>
                    <Link 
                      href={item.href}
                      className="text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div className="lg:col-span-2">
              <h4 className="text-gray-500 text-sm mb-4">Social</h4>
              <ul className="space-y-3">
                {['Facebook', 'Instagram', 'LinkedIn', 'Twitter', 'Youtube'].map((item) => (
                  <li key={item}>
                    <a 
                      href="#" 
                      className="text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div className="lg:col-span-2">
              <h4 className="text-gray-500 text-sm mb-4">Legal</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Terms of service', href: '/terms' },
                  { label: 'Privacy policy', href: '/privacy' },
                  { label: 'Cookie policy', href: '/cookies' }
                ].map((item) => (
                  <li key={item.label}>
                    <Link 
                      href={item.href}
                      className="text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-16 pt-8 border-t border-gray-800 text-center">
            <Link href="/login" className="text-gray-500 text-sm hover:text-gray-400 transition-colors">
              © {new Date().getFullYear()} FetchMart. All rights reserved.
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
