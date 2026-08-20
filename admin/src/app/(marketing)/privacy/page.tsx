import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — FetchMart',
  description: 'How FetchMart collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-[#4CAF50] font-medium mb-3 tracking-wide uppercase text-sm">Legal</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-500">Last updated: August 05, 2026</p>
        </div>
      </section>

      {/* Termly policy content */}
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
            .termly-policy > span[style*="display: block"] { display: none !important; }
          `}</style>

          <div
            className="termly-policy prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{
              __html: `
<div data-custom-class="body">
<div><strong><span style="font-size: 26px;"><span data-custom-class="title"><h1>PRIVACY POLICY</h1></span></span></strong></div>
<div><span style="color: rgb(127, 127, 127);"><strong><span style="font-size: 15px;"><span data-custom-class="subtitle">Last updated August 05, 2026</span></span></strong></span></div>
<br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">This Privacy Notice for <strong>Fetchmart</strong> ("we", "us", or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you:</span></div>
<ul>
<li data-custom-class="body_text">Visit our website at <a target="_blank" data-custom-class="link" href="https://www.fetchmart.com.ng">https://www.fetchmart.com.ng</a> or any website of ours that links to this Privacy Notice</li>
<li data-custom-class="body_text">Download and use our mobile application (Fetchmart), or any other application of ours that links to this Privacy Notice</li>
<li data-custom-class="body_text">Engage with us in other related ways, including any marketing or events</li>
</ul>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a target="_blank" data-custom-class="link" href="mailto:support@fetchmart.com.ng">support@fetchmart.com.ng</a>.</span></div>
<br/>
<div style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>SUMMARY OF KEY POINTS</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>How do we keep your information safe?</strong> We have adequate organisational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet can be guaranteed to be 100% secure.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a <a data-custom-class="link" href="https://app.termly.io/dsar/616712c8-e83a-4b29-9210-dc58bb38e0cd" rel="noopener noreferrer" target="_blank">data subject access request</a>, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.</span></div>
<br/><br/>
<div id="toc" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>TABLE OF CONTENTS</h2></span></strong></div>
<div><a data-custom-class="link" href="#infocollect">1. WHAT INFORMATION DO WE COLLECT?</a></div>
<div><a data-custom-class="link" href="#infouse">2. HOW DO WE PROCESS YOUR INFORMATION?</a></div>
<div><a data-custom-class="link" href="#whoshare">3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a></div>
<div><a data-custom-class="link" href="#cookies">4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</a></div>
<div><a data-custom-class="link" href="#sociallogins">5. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</a></div>
<div><a data-custom-class="link" href="#inforetain">6. HOW LONG DO WE KEEP YOUR INFORMATION?</a></div>
<div><a data-custom-class="link" href="#infosafe">7. HOW DO WE KEEP YOUR INFORMATION SAFE?</a></div>
<div><a data-custom-class="link" href="#infominors">8. DO WE COLLECT INFORMATION FROM MINORS?</a></div>
<div><a data-custom-class="link" href="#privacyrights">9. WHAT ARE YOUR PRIVACY RIGHTS?</a></div>
<div><a data-custom-class="link" href="#DNT">10. CONTROLS FOR DO-NOT-TRACK FEATURES</a></div>
<div><a data-custom-class="link" href="#policyupdates">11. DO WE MAKE UPDATES TO THIS NOTICE?</a></div>
<div><a data-custom-class="link" href="#contact">12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a></div>
<div><a data-custom-class="link" href="#request">13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</a></div>
<br/><br/>

<div id="infocollect" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>1. WHAT INFORMATION DO WE COLLECT?</h2></span></strong></div>
<div><strong><h3>Personal information you disclose to us</h3></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><em><strong>In Short:</strong> We collect personal information that you provide to us.</em></span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Personal Information Provided by You.</strong> The personal information we collect may include:</span></div>
<ul>
<li data-custom-class="body_text">names</li>
<li data-custom-class="body_text">phone numbers</li>
<li data-custom-class="body_text">email addresses</li>
<li data-custom-class="body_text">usernames</li>
<li data-custom-class="body_text">passwords</li>
<li data-custom-class="body_text">contact preferences</li>
<li data-custom-class="body_text">contact or authentication data</li>
<li data-custom-class="body_text">billing addresses</li>
</ul>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Sensitive Information.</strong> We do not process sensitive information.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases, such as your payment instrument number and the security code associated with your payment instrument. All payment data is handled and stored by <strong>Flutterwave</strong>. You may find their privacy notice here: <a target="_blank" data-custom-class="link" href="https://flutterwave.com/ng/privacy-notice">https://flutterwave.com/ng/privacy-notice</a>.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Social Media Login Data.</strong> We may provide you with the option to register with us using your existing social media account details, like your Apple or Google account. If you choose to register in this way, we will collect certain profile information about you from the social media provider, as described in the section called "HOW DO WE HANDLE YOUR SOCIAL LOGINS?" below.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Application Data.</strong> If you use our application(s), we also may collect the following information if you choose to provide us with access or permission:</span></div>
<ul>
<li data-custom-class="body_text"><em>Geolocation Information.</em> We may request access or permission to track location-based information from your mobile device, either continuously or while you are using our mobile application(s), to provide certain location-based services. If you wish to change our access or permissions, you may do so in your device's settings.</li>
<li data-custom-class="body_text"><em>Mobile Device Access.</em> We may request access or permission to certain features from your mobile device, including your mobile device's sensors, storage, and other features. If you wish to change our access or permissions, you may do so in your device's settings.</li>
<li data-custom-class="body_text"><em>Mobile Device Data.</em> We automatically collect device information (such as your mobile device ID, model, and manufacturer), operating system, version information and system configuration information, device and application identification numbers, browser type and version, hardware model, internet service provider and/or mobile carrier, and Internet Protocol (IP) address.</li>
<li data-custom-class="body_text"><em>Push Notifications.</em> We may request to send you push notifications regarding your account or certain features of the application(s). If you wish to opt out from receiving these types of communications, you may turn them off in your device's settings.</li>
</ul>
<div style="line-height: 1.5;"><span data-custom-class="body_text">All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Google API.</strong> Our use of information received from Google APIs will adhere to <a data-custom-class="link" href="https://developers.google.com/terms/api-services-user-data-policy" rel="noopener noreferrer" target="_blank">Google API Services User Data Policy</a>, including the <a data-custom-class="link" href="https://developers.google.com/terms/api-services-user-data-policy#limited-use" rel="noopener noreferrer" target="_blank">Limited Use requirements</a>.</span></div>
<br/>

<div id="infouse" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>2. HOW DO WE PROCESS YOUR INFORMATION?</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><em><strong>In Short:</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</em></span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</strong></span></div>
<ul>
<li data-custom-class="body_text"><strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong> We may process your information so you can create and log in to your account, as well as keep your account in working order.</li>
<li data-custom-class="body_text"><strong>To deliver and facilitate delivery of services to the user.</strong> We may process your information to provide you with the requested service.</li>
</ul>
<br/>

<div id="whoshare" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><em><strong>In Short:</strong> We may share information in specific situations described in this section and/or with the following third parties.</em></span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We may need to share your personal information in the following situations:</span></div>
<ul>
<li data-custom-class="body_text"><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
<li data-custom-class="body_text"><strong>When we use Google Maps Platform APIs.</strong> We may share your information with certain Google Maps Platform APIs (e.g. Google Maps API, Places API). Google Maps uses GPS, Wi-Fi, and cell towers to estimate your location. GPS is accurate to about 20 meters, while Wi-Fi and cell towers help improve accuracy when GPS signals are weak, like indoors.</li>
<li data-custom-class="body_text"><strong>Business Partners.</strong> We may share your information with our business partners to offer you certain products, services, or promotions.</li>
</ul>
<br/>

<div id="cookies" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><em><strong>In Short:</strong> We may use cookies and other tracking technologies to collect and store your information.</em></span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements or to tailor advertisements to your interests.</span></div>
<br/>

<div id="sociallogins" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>5. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><em><strong>In Short:</strong> If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.</em></span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Our Services offer you the ability to register and log in using your third-party social media account details (like your Apple or Google logins). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, and profile picture.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We will use the information we receive only for the purposes that are described in this Privacy Notice. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information.</span></div>
<br/>

<div id="inforetain" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>6. HOW LONG DO WE KEEP YOUR INFORMATION?</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><em><strong>In Short:</strong> We keep your information for as long as necessary to fulfil the purposes outlined in this Privacy Notice unless otherwise required by law.</em></span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymise such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.</span></div>
<br/>

<div id="infosafe" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>7. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><em><strong>In Short:</strong> We aim to protect your personal information through a system of organisational and technical security measures.</em></span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We have implemented appropriate and reasonable technical and organisational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorised third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.</span></div>
<br/>

<div id="infominors" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>8. DO WE COLLECT INFORMATION FROM MINORS?</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><em><strong>In Short:</strong> We do not knowingly collect data from or market to children under 18 years of age.</em></span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at <a target="_blank" data-custom-class="link" href="mailto:support@fetchmart.com.ng">support@fetchmart.com.ng</a>.</span></div>
<br/>

<div id="privacyrights" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>9. WHAT ARE YOUR PRIVACY RIGHTS?</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><em><strong>In Short:</strong> You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.</em></span></div><br/>
<div id="withdrawconsent" style="line-height: 1.5;"><span data-custom-class="body_text"><strong><u>Withdrawing your consent:</u></strong> If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us using the contact details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">However, please note that this will not affect the lawfulness of the processing before its withdrawal.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong><u>Opting out of marketing and promotional communications:</u></strong> You can unsubscribe from our marketing and promotional communications at any time by clicking on the unsubscribe link in the emails that we send, or by contacting us using the details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below.</span></div><br/>
<div style="line-height: 1.5;"><strong><h3>Account Information</h3></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">If you would at any time like to review or change the information in your account or terminate your account, you can log in to your account settings and update your user account.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">If you have questions or comments about your privacy rights, you may email us at <a target="_blank" data-custom-class="link" href="mailto:support@fetchmart.com.ng">support@fetchmart.com.ng</a>.</span></div>
<br/>

<div id="DNT" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>10. CONTROLS FOR DO-NOT-TRACK FEATURES</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognising and implementing DNT signals has been finalised. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.</span></div>
<br/>

<div id="policyupdates" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>11. DO WE MAKE UPDATES TO THIS NOTICE?</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><em><strong>In Short:</strong> Yes, we will update this notice as necessary to stay compliant with relevant laws.</em></span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.</span></div>
<br/>

<div id="contact" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">If you have questions or comments about this notice, you may email us at <a target="_blank" data-custom-class="link" href="mailto:support@fetchmart.com.ng">support@fetchmart.com.ng</a> or contact us by post at:</span></div><br/>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Fetchmart</strong><br/>188A A1 Crescent Federal Housing Authority, Lugbe Abuja, FCT, Nigeria<br/>Abuja, Federal Capital Territory 901002<br/>Nigeria</span></div>
<br/>

<div id="request" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2></span></strong></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please fill out and submit a <a data-custom-class="link" href="https://app.termly.io/dsar/616712c8-e83a-4b29-9210-dc58bb38e0cd" rel="noopener noreferrer" target="_blank">data subject access request</a>.</span></div>
</div>
<div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 13px; color: #9ca3af;">
  This Privacy Policy was created using <a href="https://termly.io/products/privacy-policy-generator/" target="_blank" rel="noopener external" style="color: #4CAF50;">Termly's Privacy Policy Generator</a>.
</div>
              `,
            }}
          />
        </div>
      </section>
    </div>
  );
}
