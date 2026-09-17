import type { Metadata } from 'next';
import Link from 'next/link';
import { Smartphone, Mail, Trash2, Archive, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Delete Your Account — FetchMart',
  description:
    'How to request deletion of your FetchMart account, what data is removed, and what we are required to keep.',
};

const deletedItems = [
  'Your name, email address and phone number',
  'Your password and all active sign-in sessions',
  'Linked Google and Apple sign-in methods',
  'Your delivery address, saved addresses and location data',
  'Saved payment cards and bank account details',
  'Your favourites and notification preferences',
];

const retainedItems = [
  {
    record: 'Order and transaction history',
    reason: 'Tax and financial record-keeping',
    period: '7 years',
  },
  {
    record: 'Payout and settlement records (stores and riders)',
    reason: 'Tax and financial record-keeping',
    period: '7 years',
  },
  {
    record: 'Store or rider profile, if you had one',
    reason: 'Past orders reference it',
    period: 'Deactivated immediately, retained 7 years',
  },
];

export default function DeleteAccountPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-[#4CAF50] font-medium mb-3 tracking-wide uppercase text-sm">
            Your data
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Delete your FetchMart account
          </h1>
          <p className="text-lg text-gray-500">
            You can delete your FetchMart account and the personal data attached to it at any
            time. Here is how, and what happens afterwards.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          {/* Option 1 — in app */}
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 w-11 h-11 rounded-full bg-[#4CAF50]/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-[#4CAF50]" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 mb-1">
                Option 1 — Delete from inside the app
              </h2>
              <p className="text-gray-500 text-sm">Takes effect immediately.</p>
            </div>
          </div>

          <ol className="list-decimal pl-16 space-y-2 text-gray-700 leading-relaxed mb-6">
            <li>Open the FetchMart app and sign in.</li>
            <li>
              Go to the <strong className="font-semibold text-gray-900">Profile</strong> tab.
            </li>
            <li>
              Scroll to the bottom and tap{' '}
              <strong className="font-semibold text-gray-900">Delete Account</strong>.
            </li>
            <li>Confirm when prompted.</li>
          </ol>

          <div className="ml-16 mb-16 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 leading-relaxed">
                <strong className="font-semibold">If you have an order in progress</strong>,
                deletion is blocked until that order is completed or cancelled. Finish or cancel
                the order, then try again.
              </p>
            </div>
          </div>

          {/* Option 2 — email */}
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 w-11 h-11 rounded-full bg-[#4CAF50]/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#4CAF50]" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 mb-1">
                Option 2 — Request deletion by email
              </h2>
              <p className="text-gray-500 text-sm">If you can no longer sign in.</p>
            </div>
          </div>

          <div className="pl-16 mb-16">
            <p className="text-gray-700 leading-relaxed mb-4">
              Email us from the address registered to your account:
            </p>
            <ul className="space-y-2 text-gray-700 mb-4">
              <li>
                <span className="text-gray-500">Email — </span>
                <a
                  href="mailto:support@fetchmart.com.ng?subject=Account%20deletion%20request"
                  className="text-[#4CAF50] underline underline-offset-2"
                >
                  support@fetchmart.com.ng
                </a>
              </li>
              <li>
                <span className="text-gray-500">Subject — </span>
                <span className="font-medium text-gray-900">Account deletion request</span>
              </li>
              <li>
                <span className="text-gray-500">Include — </span>the email address or phone
                number registered to the account
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              We verify ownership before acting on a request, and complete verified requests
              within <strong className="font-semibold text-gray-900">30 days</strong>.
            </p>
          </div>

          {/* What is deleted */}
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 w-11 h-11 rounded-full bg-[#4CAF50]/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-[#4CAF50]" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 mb-1">
                What is deleted
              </h2>
              <p className="text-gray-500 text-sm">Permanent and unrecoverable.</p>
            </div>
          </div>

          <div className="pl-16 mb-16">
            <ul className="space-y-2 text-gray-700 mb-4">
              {deletedItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#4CAF50] shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Your account is then anonymised, and nobody can sign in to it again.
            </p>
          </div>

          {/* What is kept */}
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
              <Archive className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 mb-1">
                What is kept, and for how long
              </h2>
              <p className="text-gray-500 text-sm">Detached from your identity.</p>
            </div>
          </div>

          <div className="pl-16">
            <p className="text-gray-700 leading-relaxed mb-6">
              Some records must be retained to meet tax, accounting and anti-fraud obligations.
              These no longer carry your name, email address, phone number or address.
            </p>

            <div className="overflow-hidden rounded-xl border border-gray-200 mb-6">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAF9]">
                  <tr>
                    <th className="text-left font-semibold text-gray-900 px-4 py-3">Record</th>
                    <th className="text-left font-semibold text-gray-900 px-4 py-3">
                      Why it is kept
                    </th>
                    <th className="text-left font-semibold text-gray-900 px-4 py-3">
                      Retention
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {retainedItems.map((row) => (
                    <tr key={row.record} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-gray-900 align-top">{row.record}</td>
                      <td className="px-4 py-3 text-gray-600 align-top">{row.reason}</td>
                      <td className="px-4 py-3 text-gray-600 align-top">{row.period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-gray-700 leading-relaxed">
              Once the retention period ends, these records are deleted.
            </p>
          </div>

          {/* Questions */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <p className="text-gray-700 leading-relaxed">
              Questions? Contact{' '}
              <a
                href="mailto:support@fetchmart.com.ng"
                className="text-[#4CAF50] underline underline-offset-2"
              >
                support@fetchmart.com.ng
              </a>{' '}
              or read our{' '}
              <Link href="/privacy" className="text-[#4CAF50] underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
