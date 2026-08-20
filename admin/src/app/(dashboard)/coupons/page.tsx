'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, Tag } from 'lucide-react';
import { adminApi } from '@/lib/api';

function formatDate(date?: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CouponsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENT' as 'PERCENT' | 'FIXED',
    discountValue: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    expiresAt: '',
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: adminApi.getCoupons,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createCoupon({
        code: form.code,
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        expiresAt: form.expiresAt || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons'] });
      setOpen(false);
      setForm({ code: '', description: '', discountType: 'PERCENT', discountValue: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateCoupon(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCoupon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Coupons</h1>
          <p className="text-gray-500">Create and manage discount codes for customers at checkout</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              New coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label>Code</Label>
                <Input
                  placeholder="FETCH20"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Description (optional)</Label>
                <Input
                  placeholder="20% off your first order"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.discountType}
                    onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as 'PERCENT' | 'FIXED' }))}
                  >
                    <option value="PERCENT">Percent %</option>
                    <option value="FIXED">Fixed ₦</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    placeholder={form.discountType === 'PERCENT' ? '20' : '500'}
                    value={form.discountValue}
                    onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Min order (₦)</Label>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Max discount (₦)</Label>
                  <Input
                    type="number"
                    placeholder="For % coupons"
                    value={form.maxDiscount}
                    onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Usage limit</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={form.usageLimit}
                    onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Expires</Label>
                  <Input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                disabled={!form.code || !form.discountValue || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? 'Creating…' : 'Create coupon'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Active codes
          </CardTitle>
          <CardDescription>Customers enter these at checkout in the mobile app</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : coupons.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">No coupons yet. Create one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-mono font-semibold">{c.code}</p>
                      {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                    </TableCell>
                    <TableCell>
                      {c.discountType === 'PERCENT'
                        ? `${Number(c.discountValue)}%`
                        : `₦${Number(c.discountValue).toLocaleString()}`}
                      {c.minOrderAmount && (
                        <p className="text-xs text-gray-400">Min ₦{Number(c.minOrderAmount).toLocaleString()}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(c.expiresAt)}</TableCell>
                    <TableCell>
                      <Badge
                        className={c.isActive ? 'bg-green-100 text-green-800 cursor-pointer' : 'bg-gray-100 text-gray-600 cursor-pointer'}
                        onClick={() => toggleMutation.mutate({ id: c.id, isActive: !c.isActive })}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteMutation.mutate(c.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
