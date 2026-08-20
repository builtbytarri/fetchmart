'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { TrendingUp, Store, Bike, Wallet, RefreshCw } from 'lucide-react';
import { adminApi } from '@/lib/api';

function naira(value: unknown) {
  const n = Number(value ?? 0);
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function poolBalanceLabel(
  subaccountId: string | null | undefined,
  balance: number | null | undefined,
) {
  if (!subaccountId) return 'Not set up';
  if (balance == null) return 'Fetching…';
  return naira(balance);
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
};

export default function FinancePage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['finance-overview'],
    queryFn: adminApi.getFinanceOverview,
  });

  const ensurePools = useMutation({
    mutationFn: adminApi.ensurePools,
    onSuccess: () => refetch(),
  });

  const sweepPools = useMutation({
    mutationFn: adminApi.sweepPools,
    onSuccess: () => refetch(),
  });

  const stats = [
    {
      label: 'Admin profit (lifetime)',
      value: data?.adminProfitTotal,
      icon: TrendingUp,
      color: 'text-primary bg-primary/10',
    },
    {
      label: 'Owed to stores',
      value: data?.storeOwedTotal,
      pending: data?.storePendingTotal,
      icon: Store,
      color: 'text-orange-600 bg-orange-50',
    },
    {
      label: 'Owed to riders',
      value: data?.riderOwedTotal,
      pending: data?.riderPendingTotal,
      icon: Bike,
      color: 'text-blue-600 bg-blue-50',
    },
  ];

  const storePoolId = data?.pools?.storePoolSubaccountId;
  const riderPoolId = data?.pools?.riderPoolSubaccountId;
  const poolsConfigured = Boolean(storePoolId && riderPoolId);
  const poolsPartial = Boolean(storePoolId || riderPoolId) && !poolsConfigured;

  const poolDescription = poolsConfigured
    ? 'Live balances in the Flutterwave pool wallets used for store and rider payouts. Funded automatically when customers pay.'
    : poolsPartial
      ? 'One pool wallet is set up; the other is still missing. Use “Retry setup” to provision it.'
      : 'Pool wallets are created once automatically when the server starts. Refresh this page to check status.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Finance</h1>
        <p className="text-gray-500">Profit, pool wallets and payout history</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${s.color}`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="text-2xl font-bold">{naira(s.value)}</p>
                    {Number(s.pending ?? 0) > 0 && (
                      <p
                        className="text-xs text-gray-400 mt-0.5"
                        title="Credited at payment, released once the order is delivered"
                      >
                        + {naira(s.pending)} pending delivery
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" /> Pool wallet balances
                  </CardTitle>
                  <CardDescription className="mt-1.5">{poolDescription}</CardDescription>
                </div>
                {poolsConfigured ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sweepPools.mutate()}
                    disabled={sweepPools.isPending || isFetching}
                    title="Top each pool up to the amount owed in the ledger (recovers failed transfers)"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${sweepPools.isPending ? 'animate-spin' : ''}`} />
                    Reconcile pools
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => ensurePools.mutate()}
                    disabled={ensurePools.isPending || isFetching}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${ensurePools.isPending ? 'animate-spin' : ''}`} />
                    Retry setup
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-gray-500">Store pool</p>
                <p className="text-xl font-bold">
                  {poolBalanceLabel(storePoolId, data?.pools?.storePoolBalance)}
                </p>
                {storePoolId ? (
                  <p className="text-xs text-gray-400 font-mono mt-1 truncate">{storePoolId}</p>
                ) : (
                  <p className="text-xs text-amber-600 mt-1">Wallet not provisioned yet</p>
                )}
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm text-gray-500">Rider pool</p>
                <p className="text-xl font-bold">
                  {poolBalanceLabel(riderPoolId, data?.pools?.riderPoolBalance)}
                </p>
                {riderPoolId ? (
                  <p className="text-xs text-gray-400 font-mono mt-1 truncate">{riderPoolId}</p>
                ) : (
                  <p className="text-xs text-amber-600 mt-1">Wallet not provisioned yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.recentWithdrawals?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No withdrawals yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentWithdrawals.map((w: any) => {
                      const name = w.wallet?.store?.name || w.wallet?.rider?.user?.name || w.accountName;
                      return (
                        <TableRow key={w.id}>
                          <TableCell>
                            <p className="font-medium">{name}</p>
                            <p className="text-xs text-gray-500">{w.accountNumber}</p>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-gray-100 text-gray-800">{w.wallet?.ownerType}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{naira(w.amount)}</TableCell>
                          <TableCell className="text-sm text-gray-500">{naira(w.fee)}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_STYLES[w.status] || 'bg-gray-100 text-gray-800'}>
                              {w.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{formatDate(w.createdAt)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
