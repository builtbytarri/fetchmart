'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Phone, Mail, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const FAQ = [
  {
    q: 'How do I assign a rider to an order?',
    a: 'Go to Orders → find the order in the "Needs Attention" section → click the ⋮ menu → Assign Rider. You can see all riders sorted by availability and proximity.',
  },
  {
    q: 'What happens when a store rejects an order?',
    a: 'The order status changes to CANCELLED, stock is restored, and the customer receives an automatic refund via Flutterwave.',
  },
  {
    q: 'How are payouts to stores and riders handled?',
    a: "Each payment is split automatically: the store's cut goes to the Store Payout Pool and the rider's cut goes to the Rider Payout Pool. Withdrawals are processed from these pools directly.",
  },
  {
    q: 'How do I add a store to the featured section?',
    a: 'Go to Stores → scroll to the "Featured Stores" panel → use the dropdown to search and select a store → click Add.',
  },
  {
    q: 'Where do I change commission rates and delivery pricing?',
    a: 'Go to Settings. All pricing parameters (base price, per-km rate, commission %, night surcharge, etc.) are configurable there.',
  },
  {
    q: 'Why is a rider not receiving notifications?',
    a: "The rider must have the app open at least once after installing the latest build so their device push token is registered. You can also use Orders → ⋮ → Notify Rider to re-send the push notification manually.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-gray-100 rounded-xl overflow-hidden"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
        <p className="font-medium text-gray-900 text-sm">{q}</p>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
        )}
      </div>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Help & Support</h1>
        <p className="text-gray-500">Documentation and contact options for FetchMart admin.</p>
      </div>

      {/* Contact cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Live Chat</p>
              <p className="text-sm text-gray-500 mt-1">Chat with the dev team</p>
            </div>
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Coming soon</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Email</p>
              <p className="text-sm text-gray-500 mt-1">support@fetchmart.ng</p>
            </div>
            <a
              href="mailto:support@fetchmart.ng"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Send email →
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Documentation</p>
              <p className="text-sm text-gray-500 mt-1">Full API & user docs</p>
            </div>
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Coming soon</Badge>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {FAQ.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
