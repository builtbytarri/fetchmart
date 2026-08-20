'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, Store, Package, ShoppingCart, Star, Trash2, Plus, CheckCircle2, XCircle, Clock, MoreHorizontal, Ban, RotateCcw } from 'lucide-react';
import { adminApi } from '@/lib/api';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Featured stores panel ────────────────────────────────────────────────────
function FeaturedStoresPanel({ allStores }: { allStores: any[] }) {
  const qc = useQueryClient();
  const [storeId, setStoreId] = useState('');
  const [label, setLabel] = useState('');
  const [open, setOpen] = useState(false);

  const { data: featured = [], isLoading } = useQuery({
    queryKey: ['featured-stores'],
    queryFn: adminApi.getFeaturedStores,
  });

  const addMutation = useMutation({
    mutationFn: () => adminApi.addFeaturedStore(storeId, label || undefined, featured.length),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['featured-stores'] });
      setStoreId('');
      setLabel('');
      setOpen(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (sid: string) => adminApi.removeFeaturedStore(sid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['featured-stores'] }),
  });

  // Stores not yet featured
  const featuredIds = new Set(featured.map((f: any) => f.storeId));
  const available = allStores.filter(s => !featuredIds.has(s.id) && s.isVerified);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Handpicked for You
          </CardTitle>
          <CardDescription>
            These stores appear in the "Handpicked for you" section on the customer home screen.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" disabled={available.length === 0}>
              <Plus className="h-4 w-4" />
              Add store
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Feature a store</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="storeSelect">Store</Label>
                <select
                  id="storeSelect"
                  value={storeId}
                  onChange={e => setStoreId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a store…</option>
                  {available.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="labelInput">Label (optional)</Label>
                <Input
                  id="labelInput"
                  placeholder="e.g. Staff pick, New arrival"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={!storeId || addMutation.isPending}
                onClick={() => addMutation.mutate()}
              >
                {addMutation.isPending ? 'Adding…' : 'Feature this store'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : featured.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No featured stores yet. Add stores to show them in "Handpicked for you".
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {featured.map((f: any) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                      <span className="font-medium">{f.store?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {f.label || <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge className={f.store?.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {f.store?.isOpen ? 'Open' : 'Closed'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(f.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      disabled={removeMutation.isPending}
                      onClick={() => removeMutation.mutate(f.storeId)}
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
  );
}

function StoreActionsMenu({
  store,
  onApprove,
  onReject,
  onSuspend,
  onUnsuspend,
  onDelete,
  isPending,
}: {
  store: any;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSuspend: (id: string, reason: string) => void;
  onUnsuspend: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const suspended = store.status === 'SUSPENDED';
  const deleted = Boolean(store.deletedAt);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {!store.isVerified ? (
          <>
            <DropdownMenuItem onClick={() => onApprove(store.id)} disabled={isPending}>
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
              Approve store
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (window.confirm(`Reject "${store.name}"? The owner will remain unverified.`)) {
                  onReject(store.id);
                }
              }}
              className="text-red-600 focus:text-red-600"
              disabled={isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject application
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem
            onClick={() => {
              if (window.confirm(
                `Revoke verification for "${store.name}"?\n\nThe store will be hidden from customers and cannot receive orders until re-approved.`,
              )) {
                onReject(store.id);
              }
            }}
            className="text-red-600 focus:text-red-600"
            disabled={isPending}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Revoke verification
          </DropdownMenuItem>
        )}

        {!deleted && (
          <>
            <DropdownMenuSeparator />
            {suspended ? (
              <DropdownMenuItem onClick={() => onUnsuspend(store.id)} disabled={isPending}>
                <RotateCcw className="h-4 w-4 mr-2 text-green-600" />
                Lift suspension
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => {
                  const reason = window.prompt(
                    `Suspend "${store.name}"?\n\nThe store is hidden from customers, cannot take orders, and the owner is signed out. Reason (shown to the owner):`,
                  );
                  // prompt returns null on cancel, '' if submitted empty.
                  if (reason !== null) onSuspend(store.id, reason);
                }}
                className="text-amber-600 focus:text-amber-600"
                disabled={isPending}
              >
                <Ban className="h-4 w-4 mr-2" />
                Suspend store
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                if (
                  window.confirm(
                    `Delete "${store.name}"?\n\nThe store is removed from the marketplace and the owner loses access. Past orders and payout history are kept for your records. This cannot be undone from here.`,
                  )
                ) {
                  onDelete(store.id);
                }
              }}
              className="text-red-600 focus:text-red-600"
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete store
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StoresPage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['stores', page],
    queryFn: () => adminApi.getStores(page, 20),
  });

  // Separate query to load ALL stores for the featured picker (no pagination)
  const { data: allStoresData } = useQuery({
    queryKey: ['all-stores'],
    queryFn: adminApi.getAllStores,
  });

  const approveMutation = useMutation({
    mutationFn: (storeId: string) => adminApi.approveStore(storeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['all-stores'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (storeId: string) => adminApi.rejectStore(storeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['all-stores'] });
    },
  });

  const invalidateStores = () => {
    qc.invalidateQueries({ queryKey: ['stores'] });
    qc.invalidateQueries({ queryKey: ['all-stores'] });
  };

  const onModerationError = (err: any) => {
    // The backend refuses deletion while orders are in flight — surface that
    // reason rather than failing silently.
    window.alert(err?.response?.data?.message || 'Action failed. Please try again.');
  };

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.suspendStore(id, reason || undefined),
    onSuccess: invalidateStores,
    onError: onModerationError,
  });

  const unsuspendMutation = useMutation({
    mutationFn: (storeId: string) => adminApi.unsuspendStore(storeId),
    onSuccess: invalidateStores,
    onError: onModerationError,
  });

  const deleteMutation = useMutation({
    mutationFn: (storeId: string) => adminApi.deleteStore(storeId),
    onSuccess: invalidateStores,
    onError: onModerationError,
  });

  const allStores: any[] = allStoresData?.stores || data?.stores || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Stores</h1>
        <p className="text-gray-500">Manage registered stores and curate the home screen</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Stores</p>
              <p className="text-2xl font-bold">{data?.total || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Verified</p>
              <p className="text-2xl font-bold">{allStores.filter((s: any) => s.isVerified).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold">{allStores.filter((s: any) => !s.isVerified).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured stores — admin curation panel */}
      <FeaturedStoresPanel allStores={allStores} />

      {/* All stores table */}
      <Card>
        <CardHeader>
          <CardTitle>All Stores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.stores || []).map((store: any) => (
                    <TableRow key={store.id} className={!store.isVerified ? 'bg-yellow-50/50' : undefined}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{store.name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[180px]">{store.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{store.owner?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{store.owner?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-gray-400" />
                          {store._count?.products || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="h-4 w-4 text-gray-400" />
                          {store._count?.orders || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* Moderation state outranks verification — a banned
                            store should never read as simply "Verified". */}
                        {store.deletedAt ? (
                          <Badge className="bg-red-100 text-red-800 gap-1">
                            <Trash2 className="h-3 w-3" /> Deleted
                          </Badge>
                        ) : store.status === 'SUSPENDED' ? (
                          <Badge
                            className="bg-amber-100 text-amber-800 gap-1"
                            title={store.suspendedReason || undefined}
                          >
                            <Ban className="h-3 w-3" /> Suspended
                          </Badge>
                        ) : store.isVerified ? (
                          <Badge className="bg-green-100 text-green-800 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 gap-1">
                            <Clock className="h-3 w-3" /> Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={store.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {store.isOpen ? 'Open' : 'Closed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(store.createdAt)}</TableCell>
                      <TableCell>
                        <StoreActionsMenu
                          store={store}
                          onApprove={(id) => approveMutation.mutate(id)}
                          onReject={(id) => rejectMutation.mutate(id)}
                          onSuspend={(id, reason) => suspendMutation.mutate({ id, reason })}
                          onUnsuspend={(id) => unsuspendMutation.mutate(id)}
                          onDelete={(id) => deleteMutation.mutate(id)}
                          isPending={
                            approveMutation.isPending ||
                            rejectMutation.isPending ||
                            suspendMutation.isPending ||
                            unsuspendMutation.isPending ||
                            deleteMutation.isPending
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Page {data?.page} of {data?.totalPages} ({data?.total} total)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= (data?.totalPages || 1)}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
