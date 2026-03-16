'use client';

import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[#4CAF50] font-medium mb-3 tracking-wide uppercase text-sm">Legal</p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-500">
              Last updated: March 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="prose prose-lg prose-gray max-w-none">
            
            {/* Introduction */}
            <div className="mb-12">
              <p className="text-gray-600 leading-relaxed text-lg">
                Welcome to FetchMart. These Terms of Service govern your use of our platform, mobile application, and services. By accessing or using FetchMart, you agree to be bound by these terms. Please read them carefully.
              </p>
            </div>

            {/* Section 1 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                By creating an account, placing an order, or otherwise using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
              </p>
              <p className="text-gray-600 leading-relaxed">
                If you do not agree with any part of these terms, you may not use our services. We reserve the right to modify these terms at any time, and your continued use of FetchMart constitutes acceptance of any changes.
              </p>
            </div>

            {/* Section 2 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Our Services</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                FetchMart provides an online platform connecting customers with local grocery stores, supermarkets, and vendors. We facilitate the ordering and delivery of groceries and household essentials to your doorstep.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Browse and order products from partner stores</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Schedule deliveries at your convenience</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Track orders in real-time</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Make secure payments through our platform</span>
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To use certain features of our service, you must create an account. When registering, you agree to:
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Provide accurate, current, and complete information</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Maintain the security of your account credentials</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Notify us immediately of any unauthorized access</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Be responsible for all activities under your account</span>
                </li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Orders and Payments</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                When you place an order through FetchMart, you are making an offer to purchase products. We reserve the right to accept or decline any order at our discretion.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong className="text-gray-900">Pricing:</strong> All prices displayed are in Nigerian Naira (NGN) and include applicable taxes unless otherwise stated. Prices may vary based on location and vendor.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong className="text-gray-900">Payment:</strong> We accept various payment methods including debit cards, bank transfers, and cash on delivery. All electronic payments are processed securely through our payment partners.
              </p>
              <p className="text-gray-600 leading-relaxed">
                <strong className="text-gray-900">Refunds:</strong> Refund requests are handled on a case-by-case basis. If you receive damaged or incorrect items, please contact our support team within 24 hours of delivery.
              </p>
            </div>

            {/* Section 5 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Delivery</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We strive to deliver your orders within the estimated timeframe. However, delivery times may vary due to factors beyond our control, including traffic, weather conditions, and order volume.
              </p>
              <p className="text-gray-600 leading-relaxed">
                You are responsible for ensuring that someone is available to receive the delivery at the specified address. If delivery cannot be completed due to your unavailability, additional charges may apply for redelivery.
              </p>
            </div>

            {/* Section 6 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Conduct</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                When using FetchMart, you agree not to:
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Violate any applicable laws or regulations</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Provide false or misleading information</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Interfere with the proper functioning of our platform</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Harass or abuse our staff, riders, or other users</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Use our service for any fraudulent purposes</span>
                </li>
              </ul>
            </div>

            {/* Section 7 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                All content on FetchMart, including logos, text, graphics, images, and software, is the property of FetchMart or its licensors and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
              </p>
            </div>

            {/* Section 8 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To the fullest extent permitted by law, FetchMart shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our total liability for any claims arising from these terms or your use of our services shall not exceed the amount you paid to FetchMart in the twelve months preceding the claim.
              </p>
            </div>

            {/* Section 9 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-600 leading-relaxed">
                We may suspend or terminate your account at any time if you violate these terms or engage in conduct that we deem harmful to our platform, users, or partners. You may also close your account at any time by contacting our support team.
              </p>
            </div>

            {/* Section 10 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Governing Law</h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms of Service shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from these terms shall be resolved in the courts of Lagos State, Nigeria.
              </p>
            </div>

            {/* Contact */}
            <div className="mt-16 p-8 bg-[#FAFAF9] rounded-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Questions About These Terms?</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions or concerns about these Terms of Service, please don't hesitate to reach out to us.
              </p>
              <Link 
                href="/contact" 
                className="inline-flex items-center gap-2 text-[#4CAF50] font-medium hover:underline"
              >
                Contact Us
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
