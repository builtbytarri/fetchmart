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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  UserPlus,
  Bell,
  XCircle,
  CheckCircle,
  Clock,
  Truck,
  Package,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '@/lib/api';

const statusColors: Record<string, string> = {
  CREATED: 'bg-gray-100 text-gray-800',
  PAID: 'bg-blue-100 text-blue-800',
  STORE_ACCEPTED: 'bg-indigo-100 text-indigo-800',
  PREPARING: 'bg-yellow-100 text-yellow-800',
  READY: 'bg-orange-100 text-orange-800',
  ASSIGNED: 'bg-purple-100 text-purple-800',
  PICKED_UP: 'bg-cyan-100 text-cyan-800',
  EN_ROUTE: 'bg-teal-100 text-teal-800',
  ARRIVED: 'bg-lime-100 text-lime-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, React.ElementType> = {
  CREATED: Clock,
  PAID: CheckCircle,
  STORE_ACCEPTED: Package,
  PREPARING: RefreshCw,
  READY: Package,
  ASSIGNED: UserPlus,
  PICKED_UP: Truck,
  EN_ROUTE: Truck,
  ARRIVED: CheckCircle,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
};

const statuses = [
  'ALL',
  'CREATED',
  'PAID',
  'STORE_ACCEPTED',
  'PREPARING',
  'READY',
  'ASSIGNED',
  'PICKED_UP',
  'EN_ROUTE',
  'ARRIVED',
  'COMPLETED',
  'CANCELLED',
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTimeAgo(date: string) {
  const now = new Date();
  const orderDate = new Date(date);
  const diffMs = now.getTime() - orderDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return formatDate(date);
}

interface Order {
  id: string;
  status: string;
  totalAmount: string | number;
  createdAt: string;
  riderId?: string;
  customer?: { id: string; name: string; email: string; phone?: string };
  store?: { id: string; name: string };
  rider?: { id: string; user: { name: string; phone?: string } };
  orderItems?: any[];
}

interface Rider {
  id: string;
  user: { id: string; name: string; phone?: string };
}

function OrderActionsMenu({ 
  order, 
  onAssignRider, 
  onUpdateStatus,
  onCancel 
}: { 
  order: Order;
  onAssignRider: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onCancel: (orderId: string) => void;
}) {
  const status = order.status;
  
  const getAvailableActions = () => {
    const actions: { label: string; icon: React.ElementType; action: () => void; variant?: 'destructive' }[] = [];
    
    switch (status) {
      case 'CREATED':
        actions.push({ label: 'Mark as Paid', icon: CheckCircle, action: () => onUpdateStatus(order.id, 'PAID') });
        break;
      case 'PAID':
        actions.push({ label: 'Store Accepted', icon: Package, action: () => onUpdateStatus(order.id, 'STORE_ACCEPTED') });
        break;
      case 'STORE_ACCEPTED':
        actions.push({ label: 'Start Preparing', icon: RefreshCw, action: () => onUpdateStatus(order.id, 'PREPARING') });
        break;
      case 'PREPARING':
        actions.push({ label: 'Mark Ready', icon: Package, action: () => onUpdateStatus(order.id, 'READY') });
        break;
      case 'READY':
        if (!order.riderId) {
          actions.push({ label: 'Assign Rider', icon: UserPlus, action: () => onAssignRider(order) });
        } else {
          actions.push({ label: 'Notify Rider', icon: Bell, action: () => alert('Notification sent to rider!') });
        }
        break;
      case 'ASSIGNED':
        actions.push({ label: 'Notify Rider', icon: Bell, action: () => alert('Notification sent to rider!') });
        actions.push({ label: 'Mark Picked Up', icon: Truck, action: () => onUpdateStatus(order.id, 'PICKED_UP') });
        break;
      case 'PICKED_UP':
        actions.push({ label: 'Mark En Route', icon: Truck, action: () => onUpdateStatus(order.id, 'EN_ROUTE') });
        break;
      case 'EN_ROUTE':
        actions.push({ label: 'Mark Arrived', icon: CheckCircle, action: () => onUpdateStatus(order.id, 'ARRIVED') });
        break;
      case 'ARRIVED':
        actions.push({ label: 'Complete Order', icon: CheckCircle, action: () => onUpdateStatus(order.id, 'COMPLETED') });
        break;
    }
    
    if (!['COMPLETED', 'CANCELLED'].includes(status)) {
      actions.push({ label: 'Cancel Order', icon: XCircle, action: () => onCancel(order.id), variant: 'destructive' });
    }
    
    return actions;
  };
  
  const actions = getAvailableActions();
  
  if (actions.length === 0) return null;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((action, index) => (
          <div key={index}>
            {action.variant === 'destructive' && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={action.action}
              className={action.variant === 'destructive' ? 'text-red-600 focus:text-red-600' : ''}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ActiveOrderCard({
  order,
  onAssignRider,
  onUpdateStatus,
  onCancel,
}: {
  order: Order;
  onAssignRider: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onCancel: (orderId: string) => void;
}) {
  const StatusIcon = statusIcons[order.status] || Clock;
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusColors[order.status]?.replace('text-', 'bg-').replace('100', '200')}`}>
            <StatusIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-gray-500">{formatTimeAgo(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[order.status] || 'bg-gray-100'}>
            {order.status.replace('_', ' ')}
          </Badge>
          <OrderActionsMenu
            order={order}
            onAssignRider={onAssignRider}
            onUpdateStatus={onUpdateStatus}
            onCancel={onCancel}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Customer</p>
          <p className="font-medium">{order.customer?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-500">Store</p>
          <p className="font-medium">{order.store?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-500">Rider</p>
          <p className="font-medium">{order.rider?.user?.name || 'Not assigned'}</p>
        </div>
        <div>
          <p className="text-gray-500">Total</p>
          <p className="font-semibold text-[#4CAF50]">{formatCurrency(Number(order.totalAmount))}</p>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('ALL');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: activeOrders, isLoading: activeLoading, refetch: refetchActive } = useQuery({
    queryKey: ['active-orders'],
    queryFn: adminApi.getActiveOrders,
    refetchInterval: 30000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, status],
    queryFn: () => adminApi.getOrders(page, 20, status === 'ALL' ? undefined : status),
  });

  const { data: availableRiders } = useQuery({
    queryKey: ['available-riders'],
    queryFn: adminApi.getAvailableRiders,
  });

  const assignRiderMutation = useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: string; riderId: string }) =>
      adminApi.assignRiderToOrder(orderId, riderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setAssignModalOpen(false);
      setSelectedOrder(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      adminApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) => adminApi.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleAssignRider = (order: Order) => {
    setSelectedOrder(order);
    setAssignModalOpen(true);
  };

  const handleUpdateStatus = (orderId: string, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  const handleCancel = (orderId: string) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const handleAssignRiderSubmit = (riderId: string) => {
    if (selectedOrder) {
      assignRiderMutation.mutate({ orderId: selectedOrder.id, riderId });
    }
  };

  const needsAttentionOrders = activeOrders?.filter((o: Order) => 
    ['CREATED', 'PAID', 'READY'].includes(o.status) && !o.riderId
  ) || [];

  const inProgressOrders = activeOrders?.filter((o: Order) => 
    !['CREATED', 'PAID', 'READY'].includes(o.status) || o.riderId
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="text-gray-500">Manage and track all orders</p>
        </div>
        <Button variant="outline" onClick={() => refetchActive()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Needs Attention Section */}
      {needsAttentionOrders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-orange-700">Needs Attention ({needsAttentionOrders.length})</CardTitle>
            </div>
            <p className="text-sm text-orange-600">Orders waiting for action - assign riders or update status</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
              ) : (
                needsAttentionOrders.map((order: Order) => (
                  <ActiveOrderCard
                    key={order.id}
                    order={order}
                    onAssignRider={handleAssignRider}
                    onUpdateStatus={handleUpdateStatus}
                    onCancel={handleCancel}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Progress Section */}
      {inProgressOrders.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-blue-700">In Progress ({inProgressOrders.length})</CardTitle>
            </div>
            <p className="text-sm text-blue-600">Orders being prepared or delivered</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
              ) : (
                inProgressOrders.map((order: Order) => (
                  <ActiveOrderCard
                    key={order.id}
                    order={order}
                    onAssignRider={handleAssignRider}
                    onUpdateStatus={handleUpdateStatus}
                    onCancel={handleCancel}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Orders Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Orders</CardTitle>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'ALL' ? 'All Statuses' : s.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Rider</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.orders?.map((order: Order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{order.customer?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.store?.name || 'N/A'}</TableCell>
                      <TableCell>{order.rider?.user?.name || '-'}</TableCell>
                      <TableCell>{formatCurrency(Number(order.totalAmount))}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || 'bg-gray-100'}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <OrderActionsMenu
                          order={order}
                          onAssignRider={handleAssignRider}
                          onUpdateStatus={handleUpdateStatus}
                          onCancel={handleCancel}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Page {data?.page} of {data?.totalPages} ({data?.total} total orders)
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

      {/* Assign Rider Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Rider</DialogTitle>
            <DialogDescription>
              Select a rider to assign to order #{selectedOrder?.id.slice(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {availableRiders?.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No riders available</p>
            ) : (
              availableRiders?.map((rider: Rider) => (
                <button
                  key={rider.id}
                  onClick={() => handleAssignRiderSubmit(rider.id)}
                  disabled={assignRiderMutation.isPending}
                  className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#4CAF50] hover:bg-green-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 font-semibold">
                      {rider.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{rider.user.name}</p>
                    <p className="text-sm text-gray-500">{rider.user.phone || 'No phone'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
