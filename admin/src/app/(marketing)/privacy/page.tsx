'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[#4CAF50] font-medium mb-3 tracking-wide uppercase text-sm">Legal</p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Privacy Policy
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
                At FetchMart, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services. We are committed to protecting your personal data and being transparent about our practices.
              </p>
            </div>

            {/* Section 1 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We collect information that you provide directly to us, as well as information collected automatically when you use our services.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Personal Information</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Name, email address, and phone number</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Delivery addresses and location data</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Payment information (processed securely by our payment partners)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Order history and preferences</span>
                </li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Automatically Collected Information</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Device information (type, operating system, unique identifiers)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Log data (IP address, browser type, pages visited)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Location data (with your permission)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Usage patterns and interaction data</span>
                </li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use the information we collect to provide, maintain, and improve our services:
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Process and fulfill your orders</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Communicate with you about orders, updates, and promotions</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Personalize your shopping experience</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Improve our platform and develop new features</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Detect and prevent fraud or security issues</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Comply with legal obligations</span>
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Service Providers:</strong> With vendors and partners who help us operate our platform (payment processors, delivery partners, analytics providers)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Partner Stores:</strong> With stores to fulfill your orders</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Legal Requirements:</strong> When required by law or to protect our rights</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</span>
                </li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Encryption of data in transit and at rest</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Regular security assessments and audits</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Access controls and authentication measures</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Employee training on data protection</span>
                </li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You have certain rights regarding your personal information:
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Access:</strong> Request a copy of your personal data</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Correction:</strong> Request correction of inaccurate information</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Deletion:</strong> Request deletion of your personal data</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Opt-out:</strong> Unsubscribe from marketing communications</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Portability:</strong> Request transfer of your data to another service</span>
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                To exercise any of these rights, please contact us at support@fetchmart.com.ng.
              </p>
            </div>

            {/* Section 6 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy. When your data is no longer needed, we will securely delete or anonymize it. Some information may be retained longer to comply with legal obligations or resolve disputes.
              </p>
            </div>

            {/* Section 7 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                FetchMart is not intended for children under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately so we can take appropriate action.
              </p>
            </div>

            {/* Section 8 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our platform and updating the "Last updated" date. Your continued use of FetchMart after such changes constitutes acceptance of the updated policy.
              </p>
            </div>

            {/* Contact */}
            <div className="mt-16 p-8 bg-[#FAFAF9] rounded-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Privacy Concerns?</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or how we handle your personal information, please reach out to our privacy team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/contact" 
                  className="inline-flex items-center gap-2 text-[#4CAF50] font-medium hover:underline"
                >
                  Contact Us
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <span className="text-gray-400 hidden sm:inline">|</span>
                <a 
                  href="mailto:support@fetchmart.com.ng" 
                  className="text-gray-600 hover:text-gray-900"
                >
                  support@fetchmart.com.ng
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
