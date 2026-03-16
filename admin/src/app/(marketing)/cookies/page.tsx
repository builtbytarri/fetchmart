'use client';

import Link from 'next/link';

export default function CookiePolicyPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[#4CAF50] font-medium mb-3 tracking-wide uppercase text-sm">Legal</p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Cookie Policy
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
                This Cookie Policy explains how FetchMart uses cookies and similar technologies when you visit our website or use our mobile application. We believe in being transparent about how we collect and use data, and this policy will help you understand your choices.
              </p>
            </div>

            {/* Section 1 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They help websites remember your preferences, understand how you use the site, and improve your overall experience.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Similar technologies include pixels, web beacons, and local storage, which serve similar purposes and are covered by this policy.
              </p>
            </div>

            {/* Section 2 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
              
              <div className="space-y-6">
                <div className="p-6 bg-[#FAFAF9] rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Essential Cookies</h3>
                  <p className="text-gray-600 leading-relaxed">
                    These cookies are necessary for the website to function properly. They enable core features like secure login, shopping cart functionality, and payment processing. Without these cookies, our services cannot be provided.
                  </p>
                </div>

                <div className="p-6 bg-[#FAFAF9] rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Cookies</h3>
                  <p className="text-gray-600 leading-relaxed">
                    These cookies help us understand how visitors interact with our platform by collecting anonymous information about page visits, time spent on pages, and any error messages. This helps us improve our website's performance.
                  </p>
                </div>

                <div className="p-6 bg-[#FAFAF9] rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Functionality Cookies</h3>
                  <p className="text-gray-600 leading-relaxed">
                    These cookies remember your preferences and choices (such as your delivery address, language, or region) to provide a more personalized experience. They may also remember changes you've made to customizable parts of the platform.
                  </p>
                </div>

                <div className="p-6 bg-[#FAFAF9] rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketing Cookies</h3>
                  <p className="text-gray-600 leading-relaxed">
                    These cookies track your browsing activity to help us deliver relevant advertisements and measure the effectiveness of our marketing campaigns. They may be set by us or by third-party advertising partners.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third-Party Cookies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Some cookies on our platform are placed by third-party services that appear on our pages. We use trusted partners for:
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Analytics:</strong> Google Analytics to understand user behavior</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Payment Processing:</strong> Secure payment gateways</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Social Media:</strong> Share buttons and embedded content</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Advertising:</strong> Relevant ad delivery and measurement</span>
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                These third parties have their own privacy policies governing how they use your information.
              </p>
            </div>

            {/* Section 4 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How Long Do Cookies Last?</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Cookies can be either session cookies or persistent cookies:
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Session Cookies:</strong> These are temporary and are deleted when you close your browser. They help maintain your session while you browse.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span><strong className="text-gray-900">Persistent Cookies:</strong> These remain on your device for a set period (from days to years) or until you delete them. They remember your preferences for future visits.</span>
                </li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Managing Your Cookie Preferences</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You have control over how cookies are used on your device. Here are your options:
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Browser Settings</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Most web browsers allow you to control cookies through their settings. You can typically:
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>View what cookies are stored on your device</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Delete all or specific cookies</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Block all cookies or only third-party cookies</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Set your browser to notify you when a cookie is set</span>
                </li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Opt-Out Links</h3>
              <p className="text-gray-600 leading-relaxed">
                For advertising cookies, you can opt out through industry opt-out tools or directly through our advertising partners' websites. Note that opting out doesn't mean you won't see ads — just that they won't be personalized based on your browsing behavior.
              </p>
            </div>

            {/* Section 6 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Impact of Disabling Cookies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you choose to disable cookies, please be aware that:
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Some features of our platform may not work properly</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>You may need to log in each time you visit</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Your shopping cart may not be saved between sessions</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Your preferences and settings won't be remembered</span>
                </li>
              </ul>
            </div>

            {/* Section 7 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Mobile Applications</h2>
              <p className="text-gray-600 leading-relaxed">
                Our mobile app uses similar technologies to cookies, including device identifiers and local storage. You can manage these through your device settings. On iOS, you can limit ad tracking in Settings → Privacy → Advertising. On Android, you can opt out of personalized ads in Settings → Google → Ads.
              </p>
            </div>

            {/* Section 8 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Updates to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business practices. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
              </p>
            </div>

            {/* Contact */}
            <div className="mt-16 p-8 bg-[#FAFAF9] rounded-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Questions About Cookies?</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about our use of cookies or this policy, we're happy to help.
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

            {/* Related Links */}
            <div className="mt-10 pt-10 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Policies</h3>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/privacy" 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms" 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
