import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use — FetchMart',
  description: 'The legal terms governing your use of the FetchMart website and mobile application.',
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-[#4CAF50] font-medium mb-3 tracking-wide uppercase text-sm">Legal</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Terms of Use
          </h1>
          <p className="text-lg text-gray-500">Last updated: August 06, 2026</p>
        </div>
      </section>

      {/* Terms content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <style>{`
            .termly-policy [data-custom-class='body'],
            .termly-policy [data-custom-class='body'] * { background: transparent !important; }
            .termly-policy [data-custom-class='title'],
            .termly-policy [data-custom-class='title'] * { font-family: inherit !important; font-size: 26px !important; color: #111827 !important; }
            .termly-policy [data-custom-class='subtitle'],
            .termly-policy [data-custom-class='subtitle'] * { font-family: inherit !important; color: #6b7280 !important; font-size: 14px !important; }
            .termly-policy [data-custom-class='heading_1'],
            .termly-policy [data-custom-class='heading_1'] * { font-family: inherit !important; font-size: 19px !important; color: #111827 !important; }
            .termly-policy [data-custom-class='heading_2'],
            .termly-policy [data-custom-class='heading_2'] * { font-family: inherit !important; font-size: 17px !important; color: #111827 !important; }
            .termly-policy [data-custom-class='body_text'],
            .termly-policy [data-custom-class='body_text'] * { color: #374151 !important; font-size: 15px !important; font-family: inherit !important; line-height: 1.7 !important; }
            .termly-policy [data-custom-class='link'],
            .termly-policy [data-custom-class='link'] * { color: #4CAF50 !important; font-size: 15px !important; font-family: inherit !important; word-break: break-word !important; }
            .termly-policy h1, .termly-policy h2, .termly-policy h3 { color: #111827; margin-top: 2rem; margin-bottom: 0.75rem; font-weight: 700; }
            .termly-policy h1 { font-size: 1.75rem; }
            .termly-policy h2 { font-size: 1.25rem; }
            .termly-policy h3 { font-size: 1.05rem; }
            .termly-policy ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.75rem 0; }
            .termly-policy li { margin: 0.4rem 0; }
            .termly-policy a { color: #4CAF50; text-decoration: underline; }
          `}</style>

          <div
            className="termly-policy prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{
              __html: `
<div data-custom-class="body">
<div><strong><span data-custom-class="title"><h1>TERMS OF USE</h1></span></strong></div>
<div><strong><span data-custom-class="subtitle">Last updated August 06, 2026</span></strong></div>
<br/>

<div style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>AGREEMENT TO OUR LEGAL TERMS</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We are <strong>Fetchmart</strong> ("Company," "we," "us," "our").</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We operate the website <a data-custom-class="link" href="https://www.fetchmart.com.ng" target="_blank">https://www.fetchmart.com.ng</a> (the "Site") and the Fetchmart mobile application (the "App"), as well as any other related products and services that refer or link to these legal terms (the "Legal Terms") (collectively, the "Services").</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Fetchmart is an on-demand marketplace that connects customers with independent partner stores and independent delivery riders. Customers place orders with partner stores through the Services, and independent riders deliver those orders. Fetchmart facilitates these transactions and processes payment; it does not itself sell the goods listed by partner stores.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">You can contact us by email at <a data-custom-class="link" href="mailto:support@fetchmart.com.ng">support@fetchmart.com.ng</a> or by mail to 188A A1 Crescent Federal Housing Authority, Lugbe Abuja, Abuja, Federal Capital Territory 901002, Nigeria.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you"), and Fetchmart, concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Supplemental terms and conditions or documents that may be posted on the Services from time to time are hereby expressly incorporated herein by reference. We reserve the right, in our sole discretion, to make changes or modifications to these Legal Terms at any time and for any reason. We will alert you about any changes by updating the "Last updated" date of these Legal Terms, and you waive any right to receive specific notice of each such change. It is your responsibility to periodically review these Legal Terms to stay informed of updates.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">The Services are intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or register for the Services.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We recommend that you print a copy of these Legal Terms for your records.</span></div>
<br/>

<div id="toc" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>TABLE OF CONTENTS</h2></span></strong></div>
<div><a data-custom-class="link" href="#services">1. OUR SERVICES</a></div>
<div><a data-custom-class="link" href="#ip">2. INTELLECTUAL PROPERTY RIGHTS</a></div>
<div><a data-custom-class="link" href="#userreps">3. USER REPRESENTATIONS</a></div>
<div><a data-custom-class="link" href="#userreg">4. USER REGISTRATION</a></div>
<div><a data-custom-class="link" href="#orders">5. ORDERS, PRICING, AND PAYMENT</a></div>
<div><a data-custom-class="link" href="#delivery">6. DELIVERY</a></div>
<div><a data-custom-class="link" href="#cancellations">7. CANCELLATIONS AND REFUNDS</a></div>
<div><a data-custom-class="link" href="#partners">8. PARTNER STORES AND RIDERS</a></div>
<div><a data-custom-class="link" href="#prohibited">9. PROHIBITED ACTIVITIES</a></div>
<div><a data-custom-class="link" href="#ugc">10. USER GENERATED CONTRIBUTIONS</a></div>
<div><a data-custom-class="link" href="#license">11. CONTRIBUTION LICENSE</a></div>
<div><a data-custom-class="link" href="#sitemanage">12. SERVICES MANAGEMENT</a></div>
<div><a data-custom-class="link" href="#terms">13. TERM AND TERMINATION</a></div>
<div><a data-custom-class="link" href="#modifications">14. MODIFICATIONS AND INTERRUPTIONS</a></div>
<div><a data-custom-class="link" href="#law">15. GOVERNING LAW</a></div>
<div><a data-custom-class="link" href="#disputes">16. DISPUTE RESOLUTION</a></div>
<div><a data-custom-class="link" href="#corrections">17. CORRECTIONS</a></div>
<div><a data-custom-class="link" href="#disclaimer">18. DISCLAIMER</a></div>
<div><a data-custom-class="link" href="#liability">19. LIMITATIONS OF LIABILITY</a></div>
<div><a data-custom-class="link" href="#indemnification">20. INDEMNIFICATION</a></div>
<div><a data-custom-class="link" href="#userdata">21. USER DATA</a></div>
<div><a data-custom-class="link" href="#electronic">22. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</a></div>
<div><a data-custom-class="link" href="#misc">23. MISCELLANEOUS</a></div>
<div><a data-custom-class="link" href="#contact">24. CONTACT US</a></div>
<br/><br/>

<div id="services" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>1. OUR SERVICES</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">The Services are currently offered within Nigeria. Availability of partner stores and delivery riders depends on your delivery address and may change at any time.</span></div>
<br/>

<div id="ip" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>2. INTELLECTUAL PROPERTY RIGHTS</h2></span></strong></div>
<div><strong><h3>Our intellectual property</h3></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the "Content"), as well as the trademarks, service marks, and logos contained therein (the "Marks").</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Our Content and Marks are protected by copyright and trademark laws (and various other intellectual property rights and unfair competition laws) and treaties around the world. The Content and Marks are provided in or through the Services "AS IS" for your personal, non-commercial use or internal business purpose only.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Product names, descriptions, images, and pricing supplied by partner stores remain the property of those partner stores or their respective licensors.</span></div><br/>
<div><strong><h3>Your use of our Services</h3></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Subject to your compliance with these Legal Terms, including the "PROHIBITED ACTIVITIES" section below, we grant you a non-exclusive, non-transferable, revocable license to:</span></div>
<ul>
<li data-custom-class="body_text">access the Services; and</li>
<li data-custom-class="body_text">download or print a copy of any portion of the Content to which you have properly gained access,</li>
</ul>
<div style="line-height: 1.5;"><span data-custom-class="body_text">solely for your personal, non-commercial use or internal business purpose.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Except as set out in this section or elsewhere in our Legal Terms, no part of the Services and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">If you wish to make any use of the Services, Content, or Marks other than as set out in this section or elsewhere in our Legal Terms, please address your request to: <a data-custom-class="link" href="mailto:support@fetchmart.com.ng">support@fetchmart.com.ng</a>. We reserve all rights not expressly granted to you in and to the Services, Content, and Marks. Any breach of these Intellectual Property Rights will constitute a material breach of our Legal Terms and your right to use our Services will terminate immediately.</span></div><br/>
<div><strong><h3>Your submissions</h3></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">By directly sending us any question, comment, suggestion, idea, feedback, or other information about the Services ("Submissions"), you agree to assign to us all intellectual property rights in such Submission. You agree that we shall own this Submission and be entitled to its unrestricted use and dissemination for any lawful purpose, commercial or otherwise, without acknowledgment or compensation to you.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">By sending us Submissions through any part of the Services you: (a) confirm that you have read and agree with our "PROHIBITED ACTIVITIES" and will not post, send, publish, upload, or transmit through the Services any Submission that is illegal, harassing, hateful, harmful, defamatory, obscene, bullying, abusive, discriminatory, threatening to any person or group, sexually explicit, false, inaccurate, deceitful, or misleading; (b) to the extent permissible by applicable law, waive any and all moral rights to any such Submission; (c) warrant that any such Submission is original to you or that you have the necessary rights and licenses to submit it; and (d) warrant and represent that your Submissions do not constitute confidential information.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">You are solely responsible for your Submissions and you expressly agree to reimburse us for any and all losses that we may suffer because of your breach of (a) this section, (b) any third party's intellectual property rights, or (c) applicable law.</span></div>
<br/>

<div id="userreps" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>3. USER REPRESENTATIONS</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update it as necessary; (3) you have the legal capacity and you agree to comply with these Legal Terms; (4) you are not a minor in the jurisdiction in which you reside and you are at least 18 years of age; (5) you will not access the Services through automated or non-human means, whether through a bot, script or otherwise; (6) you will not use the Services for any illegal or unauthorized purpose; and (7) your use of the Services will not violate any applicable law or regulation.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right to suspend or terminate your account and refuse any and all current or future use of the Services (or any portion thereof).</span></div>
<br/>

<div id="userreg" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>4. USER REGISTRATION</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">You are required to register to use the Services. Registration requires a valid mobile phone number, which we verify by sending a one-time passcode. You agree to receive such verification messages, and you acknowledge that message and data rates from your mobile carrier may apply.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">You may also register or sign in using a third-party account, such as Apple. Your use of such sign-in methods is governed by the applicable third party's own terms and privacy policy.</span></div>
<br/>

<div id="orders" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>5. ORDERS, PRICING, AND PAYMENT</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Item prices displayed in the Services are set by the partner store, not by us. In addition to item prices, your order total may include a delivery fee, a service fee, applicable surcharges, and any taxes or levies required by law. All applicable charges are itemised and shown to you before you confirm your order.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">All payments are made in Nigerian Naira (₦). We accept payment through our third-party payment processor, Flutterwave. By submitting an order you authorise us, through our payment processor, to charge your selected payment method for the total amount of your order. Your payment details are handled by the payment processor in accordance with its own privacy notice; we do not store your full card details.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Placing an order constitutes an offer to purchase. An order is only accepted once payment has been confirmed and the partner store has accepted the order. If the partner store does not accept your order within the time window we specify, or declines it, the order is cancelled and payment is refunded in accordance with the "CANCELLATIONS AND REFUNDS" section below.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We reserve the right to refuse or cancel any order at any time, including where an item is unavailable, where a pricing or product listing error has occurred, or where we suspect fraud or a violation of these Legal Terms.</span></div>
<br/>

<div id="delivery" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>6. DELIVERY</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Delivery is performed by independent riders. Delivery fees are calculated based on factors that may include distance from the partner store to your delivery address, the number of pickup locations, the nature of the items ordered, and the time of day.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Delivery times shown in the Services are estimates only and are not guaranteed. Estimates may be affected by traffic, weather, partner store preparation times, rider availability, and other factors outside our control.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">You are responsible for providing an accurate and complete delivery address and for being available to receive your order. If a delivery cannot be completed because the address is inaccurate or you are unavailable, the order may be treated as completed and no refund may be due.</span></div>
<br/>

<div id="cancellations" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>7. CANCELLATIONS AND REFUNDS</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">You may cancel an order without charge at any time before the partner store accepts it. Once a partner store has accepted your order and begun preparing it, the order may no longer be cancellable by you.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Where an order is cancelled because the partner store declines it, because the partner store does not accept it within the applicable time window, or because we cancel it, the amount you paid is refunded to your original payment method. Refunds are initiated by us promptly, but the time taken for funds to appear depends on your bank or payment provider.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">If there is a problem with your order — for example missing, incorrect, or damaged items — you must contact us at <a data-custom-class="link" href="mailto:support@fetchmart.com.ng">support@fetchmart.com.ng</a> within 48 hours of delivery. We review such reports and may, at our discretion, issue a full or partial refund or other appropriate remedy.</span></div>
<br/>

<div id="partners" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>8. PARTNER STORES AND RIDERS</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Partner stores and riders are independent third parties. They are not employees, agents, or partners of Fetchmart, and no joint venture, partnership, or employment relationship is created between them and us by these Legal Terms.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Partner stores are solely responsible for the goods they list and sell, including their description, quality, safety, legality, labelling, handling, and fitness for purpose, and for complying with all laws applicable to their business, including food safety and licensing requirements. Riders are solely responsible for conducting deliveries lawfully and safely.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">If you use the Services as a partner store or as a rider, you additionally agree that: the information you supply during onboarding is true and complete; you hold all licences, permits, registrations, and insurance required to operate; you will fulfil accepted orders promptly and accurately; and you will not use the Services to conduct any unlawful activity.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Amounts earned by partner stores and riders are credited to an account balance within the Services after the relevant order is completed, net of any applicable commission, service fee, or platform share disclosed to you. Withdrawals of that balance may be subject to a minimum withdrawal amount and a processing fee, each as published in the Services and as varied by us from time to time. You are responsible for providing accurate payout account details and for any taxes payable on your earnings.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We may withhold, reverse, or adjust amounts credited to a partner store or rider where an order is cancelled, refunded, disputed, or found to have been obtained fraudulently or in breach of these Legal Terms.</span></div>
<br/>

<div id="prohibited" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>9. PROHIBITED ACTIVITIES</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">You may not access or use the Services for any purpose other than that for which we make the Services available. The Services may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">As a user of the Services, you agree not to:</span></div>
<ul>
<li data-custom-class="body_text">Systematically retrieve data or other content from the Services to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
<li data-custom-class="body_text">Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
<li data-custom-class="body_text">Circumvent, disable, or otherwise interfere with security-related features of the Services.</li>
<li data-custom-class="body_text">Place orders you do not intend to pay for or receive, or otherwise abuse our refund, promotion, or coupon facilities.</li>
<li data-custom-class="body_text">Falsify your location, delivery address, or order status, or manipulate delivery tracking data.</li>
<li data-custom-class="body_text">Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.</li>
<li data-custom-class="body_text">Use any information obtained from the Services in order to harass, abuse, or harm another person, including partner store staff and riders.</li>
<li data-custom-class="body_text">Make improper use of our support services or submit false reports of abuse or misconduct.</li>
<li data-custom-class="body_text">Use the Services in a manner inconsistent with any applicable laws or regulations.</li>
<li data-custom-class="body_text">Engage in unauthorized framing of or linking to the Services.</li>
<li data-custom-class="body_text">Upload or transmit (or attempt to upload or transmit) viruses, Trojan horses, or other material that interferes with any party's uninterrupted use and enjoyment of the Services.</li>
<li data-custom-class="body_text">Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.</li>
<li data-custom-class="body_text">Delete the copyright or other proprietary rights notice from any Content.</li>
<li data-custom-class="body_text">Attempt to impersonate another user or person or use the username of another user.</li>
<li data-custom-class="body_text">Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services.</li>
<li data-custom-class="body_text">Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you.</li>
<li data-custom-class="body_text">Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services.</li>
<li data-custom-class="body_text">Copy or adapt the Services' software, including but not limited to HTML, JavaScript, or other code.</li>
<li data-custom-class="body_text">Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services.</li>
<li data-custom-class="body_text">Use, launch, develop, or distribute any automated system, including any spider, robot, scraper, or offline reader that accesses the Services, or use or launch any unauthorized script or other software.</li>
<li data-custom-class="body_text">Make any unauthorized use of the Services, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretenses.</li>
<li data-custom-class="body_text">Use the Services as part of any effort to compete with us or otherwise use the Services and/or the Content for any revenue-generating endeavor or commercial enterprise not authorised by us.</li>
</ul>
<br/>

<div id="ugc" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>10. USER GENERATED CONTRIBUTIONS</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We may provide you with the opportunity to create, submit, post, display, transmit, or otherwise make available content and materials to us or on the Services, including product listings, store information, images, ratings, reviews, and delivery notes (collectively, "Contributions"). Contributions may be viewable by other users of the Services.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">When you create or make available any Contributions, you represent and warrant that: your Contributions do not infringe the proprietary rights of any third party; you have the necessary licences, rights, and permissions to publish them; they are not false, inaccurate, or misleading; they are not obscene, harassing, defamatory, discriminatory, or otherwise objectionable; and they do not violate any applicable law or regulation.</span></div>
<br/>

<div id="license" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>11. CONTRIBUTION LICENSE</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">You and the Services agree that we may access, store, process, and use any information and personal data that you provide and your choices (including settings). By submitting suggestions or other feedback regarding the Services, you agree that we can use and share such feedback for any purpose without compensation to you.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We do not assert any ownership over your Contributions. You retain full ownership of all of your Contributions and any intellectual property rights or other proprietary rights associated with your Contributions. You grant us a non-exclusive, worldwide, royalty-free licence to host, display, and distribute your Contributions to the extent necessary to operate and promote the Services. We are not liable for any statements or representations in your Contributions provided by you in any area on the Services. You are solely responsible for your Contributions to the Services.</span></div>
<br/>

<div id="sitemanage" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>12. SERVICES MANAGEMENT</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We reserve the right, but not the obligation, to: (1) monitor the Services for violations of these Legal Terms; (2) take appropriate legal action against anyone who, in our sole discretion, violates the law or these Legal Terms, including reporting such user to law enforcement authorities; (3) in our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable any of your Contributions or any portion thereof; (4) in our sole discretion and without limitation, notice, or liability, remove from the Services or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and (5) otherwise manage the Services in a manner designed to protect our rights and property and to facilitate the proper functioning of the Services.</span></div>
<br/>

<div id="terms" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>13. TERM AND TERMINATION</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">These Legal Terms shall remain in full force and effect while you use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE LEGAL TERMS OR OF ANY APPLICABLE LAW OR REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE SERVICES OR DELETE ANY CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party. In addition to terminating or suspending your account, we reserve the right to take appropriate legal action, including pursuing civil, criminal, and injunctive redress. Termination does not affect any amount properly due to you in respect of orders completed before termination.</span></div>
<br/>

<div id="modifications" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>14. MODIFICATIONS AND INTERRUPTIONS</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Services. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Services.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Services, resulting in interruptions, delays, or errors. You agree that we have no liability whatsoever for any loss, damage, or inconvenience caused by your inability to access or use the Services during any downtime or discontinuance of the Services.</span></div>
<br/>

<div id="law" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>15. GOVERNING LAW</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">These Legal Terms shall be governed by and defined following the laws of the Federal Republic of Nigeria. Fetchmart and yourself irrevocably consent that the courts of the Federal Capital Territory, Abuja, Nigeria shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these Legal Terms.</span></div>
<br/>

<div id="disputes" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>16. DISPUTE RESOLUTION</h2></span></strong></div>
<div><strong><h3>Informal Negotiations</h3></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">To expedite resolution and control the cost of any dispute, controversy, or claim related to these Legal Terms (each a "Dispute" and collectively, the "Disputes") brought by either you or us (individually, a "Party" and collectively, the "Parties"), the Parties agree to first attempt to negotiate any Dispute (except those Disputes expressly provided below) informally for at least thirty (30) days before initiating arbitration. Such informal negotiations commence upon written notice from one Party to the other Party.</span></div><br/>
<div><strong><h3>Binding Arbitration</h3></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">If the Parties are unable to resolve the Dispute through informal negotiation, the Dispute shall be finally resolved by arbitration in accordance with the Arbitration and Mediation Act of Nigeria in force at the time of commencement of the arbitration. The number of arbitrators shall be one (1). The seat, or legal place, of arbitration shall be Abuja, Nigeria. The language of the proceedings shall be English. The governing law of these Legal Terms shall be the substantive law of the Federal Republic of Nigeria.</span></div><br/>
<div><strong><h3>Restrictions</h3></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">The Parties agree that any arbitration shall be limited to the Dispute between the Parties individually. To the full extent permitted by law, (a) no arbitration shall be joined with any other proceeding; (b) there is no right or authority for any Dispute to be arbitrated on a class-action basis or to utilize class action procedures; and (c) there is no right or authority for any Dispute to be brought in a purported representative capacity on behalf of the general public or any other persons.</span></div><br/>
<div><strong><h3>Exceptions to Informal Negotiations and Arbitration</h3></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">The Parties agree that the following Disputes are not subject to the above provisions concerning informal negotiations and binding arbitration: (a) any Disputes seeking to enforce or protect, or concerning the validity of, any of the intellectual property rights of a Party; (b) any Dispute related to, or arising from, allegations of theft, piracy, invasion of privacy, or unauthorized use; and (c) any claim for injunctive relief. If this provision is found to be illegal or unenforceable, then neither Party will elect to arbitrate any Dispute falling within that portion of this provision found to be illegal or unenforceable and such Dispute shall be decided by a court of competent jurisdiction within the courts listed for jurisdiction above.</span></div>
<br/>

<div id="corrections" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>17. CORRECTIONS</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">There may be information on the Services that contains typographical errors, inaccuracies, or omissions, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Services at any time, without prior notice.</span></div>
<br/>

<div id="disclaimer" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>18. DISCLAIMER</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES' CONTENT OR THE CONTENT OF ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE SERVICES AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICES, (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICES, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH THE SERVICES BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICES.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY PRODUCT OR SERVICE ADVERTISED OR OFFERED BY A THIRD PARTY THROUGH THE SERVICES, INCLUDING GOODS SOLD BY PARTNER STORES AND DELIVERIES PERFORMED BY RIDERS, AND WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND ANY THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES. AS WITH THE PURCHASE OF A PRODUCT OR SERVICE THROUGH ANY MEDIUM OR IN ANY ENVIRONMENT, YOU SHOULD USE YOUR BEST JUDGMENT AND EXERCISE CAUTION WHERE APPROPRIATE.</span></div>
<br/>

<div id="liability" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>19. LIMITATIONS OF LIABILITY</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US IN RESPECT OF THE ORDER GIVING RISE TO THE CLAIM. CERTAIN LAWS DO NOT ALLOW LIMITATIONS ON IMPLIED WARRANTIES OR THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF THESE LAWS APPLY TO YOU, SOME OR ALL OF THE ABOVE DISCLAIMERS OR LIMITATIONS MAY NOT APPLY TO YOU, AND YOU MAY HAVE ADDITIONAL RIGHTS.</span></div>
<br/>

<div id="indemnification" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>20. INDEMNIFICATION</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys' fees and expenses, made by any third party due to or arising out of: (1) use of the Services; (2) breach of these Legal Terms; (3) any breach of your representations and warranties set forth in these Legal Terms; (4) your violation of the rights of a third party, including but not limited to intellectual property rights; or (5) any overt harmful act toward any other user of the Services with whom you connected via the Services. Notwithstanding the foregoing, we reserve the right, at your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us, and you agree to cooperate, at your expense, with our defense of such claims.</span></div>
<br/>

<div id="userdata" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>21. USER DATA</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services, as well as data relating to your use of the Services. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Services. You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data. Our handling of personal information is described in our <a data-custom-class="link" href="/privacy">Privacy Policy</a>.</span></div>
<br/>

<div id="electronic" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>22. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email, SMS, push notification, and on the Services, satisfy any legal requirement that such communication be in writing. YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SERVICES.</span></div>
<br/>

<div id="misc" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>23. MISCELLANEOUS</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">These Legal Terms and any policies or operating rules posted by us on the Services constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Legal Terms shall not operate as a waiver of such right or provision. These Legal Terms operate to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time. We shall not be responsible or liable for any loss, damage, delay, or failure to act caused by any cause beyond our reasonable control. If any provision or part of a provision of these Legal Terms is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from these Legal Terms and does not affect the validity and enforceability of any remaining provisions. There is no joint venture, partnership, employment or agency relationship created between you and us as a result of these Legal Terms or use of the Services. You agree that these Legal Terms will not be construed against us by virtue of having drafted them.</span></div>
<br/>

<div id="contact" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>24. CONTACT US</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Fetchmart</strong><br/>188A A1 Crescent Federal Housing Authority, Lugbe Abuja<br/>Abuja, Federal Capital Territory 901002<br/>Nigeria<br/><a data-custom-class="link" href="mailto:support@fetchmart.com.ng">support@fetchmart.com.ng</a></span></div>
</div>
              `,
            }}
          />
        </div>
      </section>
    </div>
  );
}
