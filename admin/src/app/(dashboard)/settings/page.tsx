'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/lib/api';

type Field = {
  key: string;
  label: string;
  hint?: string;
  suffix?: string;
};

const SECTIONS: { title: string; description: string; fields: Field[] }[] = [
  {
    title: 'Commission & service fee',
    description: 'Percentages taken on each order. Stores set their own prices; we never mark up.',
    fields: [
      { key: 'commissionPercent', label: 'Commission %', hint: 'Deducted from the store payout', suffix: '%' },
      { key: 'serviceFeePercent', label: 'Service fee %', hint: 'Added on top for the customer', suffix: '%' },
    ],
  },
  {
    title: 'Delivery pricing',
    description: 'Base fare, distance and surcharge parameters used to quote delivery.',
    fields: [
      { key: 'deliveryBaseFee', label: 'Base fee', hint: 'Covers the free radius', suffix: '₦' },
      { key: 'freeRadiusKm', label: 'Free radius', hint: 'Distance included in base fee', suffix: 'km' },
      { key: 'perKmRate', label: 'Per-km rate', hint: 'Charged per km beyond the free radius', suffix: '₦/km' },
      { key: 'extraStopFee', label: 'Extra stop fee', hint: 'Per additional store pickup', suffix: '₦' },
      { key: 'bulkyItemFee', label: 'Bulky item fee', hint: 'Per item flagged bulky', suffix: '₦' },
      { key: 'nightSurcharge', label: 'Night surcharge', hint: 'Applied during night hours', suffix: '₦' },
      { key: 'nightStartHour', label: 'Night start hour', hint: '0–23 (e.g. 20 = 8PM)', suffix: 'h' },
      { key: 'nightEndHour', label: 'Night end hour', hint: '0–23 (e.g. 6 = 6AM)', suffix: 'h' },
    ],
  },
  {
    title: 'Payout split',
    description: 'How the delivery fee is shared between the rider and the platform.',
    fields: [
      { key: 'riderDeliverySharePercent', label: 'Rider delivery share %', hint: 'Rest is the admin cut', suffix: '%' },
    ],
  },
  {
    title: 'Withdrawals',
    description: 'Minimum payout amount and processing fee for store and rider withdrawals.',
    fields: [
      { key: 'withdrawalMinAmount', label: 'Minimum withdrawal', hint: 'Stores and riders must withdraw at least this amount', suffix: '₦' },
      { key: 'withdrawalFeePercent', label: 'Processing fee %', hint: 'Deducted from each withdrawal (0 = no fee)', suffix: '%' },
    ],
  },
  {
    title: 'Order handling',
    description: 'How long a store has to accept a paid order before it is auto-cancelled and refunded.',
    fields: [
      { key: 'storeAcceptTimeoutMinutes', label: 'Store accept timeout', hint: 'Auto-cancel + refund if the store does not accept in time (0 = never)', suffix: 'min' },
    ],
  },
];

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: adminApi.getSettings,
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [sweepEnabled, setSweepEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      const next: Record<string, string> = {};
      SECTIONS.forEach((s) =>
        s.fields.forEach((f) => {
          next[f.key] = String(data[f.key] ?? '');
        }),
      );
      setForm(next);
      setSweepEnabled(Boolean(data.poolSweepEnabled));
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, number | boolean> = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '') payload[k] = Number(v);
      });
      payload.poolSweepEnabled = sweepEnabled;
      return adminApi.updateSettings(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-500">Tune pricing, commission and payout parameters</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : (
        <>
          {SECTIONS.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map((f) => (
                    <div key={f.key} className="space-y-1">
                      <Label htmlFor={f.key}>
                        {f.label} {f.suffix && <span className="text-gray-400">({f.suffix})</span>}
                      </Label>
                      <Input
                        id={f.key}
                        type="number"
                        value={form[f.key] ?? ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      />
                      {f.hint && <p className="text-xs text-gray-500">{f.hint}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle>Pool reconciliation</CardTitle>
              <CardDescription>
                Automatically top up the Flutterwave pool wallets to match the ledger if a
                transfer fails. Leave off until the Flutterwave Transfers API (IP whitelisting)
                is configured — you can always reconcile manually from the Finance page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={sweepEnabled}
                  onChange={(e) => setSweepEnabled(e.target.checked)}
                />
                <span className="text-sm text-gray-800">
                  Enable automatic pool sweep (runs periodically and when the Finance page loads)
                </span>
              </label>
            </CardContent>
          </Card>

          {data?.storePoolSubaccountId || data?.riderPoolSubaccountId ? (
            <Card>
              <CardHeader>
                <CardTitle>Payout pools</CardTitle>
                <CardDescription>Flutterwave pool wallet references (configured in Finance)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-gray-600">
                <p>Store pool: <span className="font-mono">{data?.storePoolSubaccountId || '—'}</span></p>
                <p>Rider pool: <span className="font-mono">{data?.riderPoolSubaccountId || '—'}</span></p>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex items-center gap-3">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
            {saved && <span className="text-sm text-green-600">Saved</span>}
            {mutation.isError && <span className="text-sm text-red-600">Failed to save</span>}
          </div>
        </>
      )}
    </div>
  );
}
