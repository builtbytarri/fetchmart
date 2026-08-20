'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft, ChevronRight, Bike, ShoppingCart, MapPin, Car,
  MoreHorizontal, Ban, RotateCcw, Trash2,
} from 'lucide-react';
import { adminApi } from '@/lib/api';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatLastSeen(date: string | null) {
  if (!date) return 'Never';
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(date);
}

function RiderActionsMenu({
  rider,
  onSuspend,
  onUnsuspend,
  onDelete,
  isPending,
}: {
  rider: any;
  onSuspend: (id: string, reason: string) => void;
  onUnsuspend: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const name = rider.user?.name || 'this rider';
  const suspended = rider.status === 'SUSPENDED';
  if (rider.deletedAt) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {suspended ? (
          <DropdownMenuItem onClick={() => onUnsuspend(rider.id)} disabled={isPending}>
            <RotateCcw className="h-4 w-4 mr-2 text-green-600" />
            Lift suspension
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => {
              const reason = window.prompt(
                `Suspend ${name}?\n\nThey are taken offline immediately, cannot accept deliveries, and are signed out. Reason (shown to the rider):`,
              );
              if (reason !== null) onSuspend(rider.id, reason);
            }}
            className="text-amber-600 focus:text-amber-600"
            disabled={isPending}
          >
            <Ban className="h-4 w-4 mr-2" />
            Suspend rider
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            if (
              window.confirm(
                `Delete ${name}?\n\nThey lose access to the app. Past deliveries and earnings history are kept for your records.`,
              )
            ) {
              onDelete(rider.id);
            }
          }}
          className="text-red-600 focus:text-red-600"
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete rider
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function RidersPage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['riders', page],
    queryFn: () => adminApi.getRiders(page, 20),
  });

  const invalidateRiders = () => qc.invalidateQueries({ queryKey: ['riders'] });
  const onModerationError = (err: any) => {
    // e.g. the backend refuses deletion while a delivery is in progress.
    window.alert(err?.response?.data?.message || 'Action failed. Please try again.');
  };

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.suspendRider(id, reason || undefined),
    onSuccess: invalidateRiders,
    onError: onModerationError,
  });

  const unsuspendMutation = useMutation({
    mutationFn: (riderId: string) => adminApi.unsuspendRider(riderId),
    onSuccess: invalidateRiders,
    onError: onModerationError,
  });

  const deleteMutation = useMutation({
    mutationFn: (riderId: string) => adminApi.deleteRider(riderId),
    onSuccess: invalidateRiders,
    onError: onModerationError,
  });

  const moderationPending =
    suspendMutation.isPending || unsuspendMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Riders</h1>
          <p className="text-gray-500">Manage delivery riders and track their activity</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bike className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Riders</p>
              <p className="text-2xl font-bold">{data?.total || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Riders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rider</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Deliveries</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.riders?.map((rider: any) => (
                    <TableRow key={rider.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bike className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{rider.user?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{rider.user?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{rider.user?.phone || 'N/A'}</p>
                      </TableCell>
                      <TableCell>
                        {rider.vehiclePlate ? (
                          <div className="flex items-center gap-1.5">
                            <Car className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">{rider.vehiclePlate}</p>
                              <p className="text-xs text-gray-500 capitalize">
                                {rider.vehicleType || '—'}{rider.vehicleColor ? ` · ${rider.vehicleColor}` : ''}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="h-4 w-4 text-gray-400" />
                          {rider._count?.orders || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {rider.deletedAt ? (
                          <Badge className="bg-red-100 text-red-800 gap-1">
                            <Trash2 className="h-3 w-3" /> Deleted
                          </Badge>
                        ) : rider.status === 'SUSPENDED' ? (
                          <Badge
                            className="bg-amber-100 text-amber-800 gap-1"
                            title={rider.suspendedReason || undefined}
                          >
                            <Ban className="h-3 w-3" /> Suspended
                          </Badge>
                        ) : (
                          <Badge className={rider.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {rider.isAvailable ? 'Available' : 'Busy'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          {formatLastSeen(rider.lastPingAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(rider.createdAt)}
                      </TableCell>
                      <TableCell>
                        <RiderActionsMenu
                          rider={rider}
                          onSuspend={(id, reason) => suspendMutation.mutate({ id, reason })}
                          onUnsuspend={(id) => unsuspendMutation.mutate(id)}
                          onDelete={(id) => deleteMutation.mutate(id)}
                          isPending={moderationPending}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Page {data?.page} of {data?.totalPages} ({data?.total} total riders)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= (data?.totalPages || 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
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
