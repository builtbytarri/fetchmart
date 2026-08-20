'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, ShoppingCart, Store, Bike, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { adminApi } from '@/lib/api';
import Link from 'next/link';

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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trendValue && (
              <div className="flex items-center gap-1 mt-1">
                {trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={trend === 'up' ? 'text-green-500 text-sm' : 'text-red-500 text-sm'}>
                  {trendValue}
                </span>
              </div>
            )}
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function computeTrend(chartData: { revenue: number; orders: number }[] | undefined) {
  if (!chartData || chartData.length < 2) return { revTrend: null, ordTrend: null };
  const today = chartData[chartData.length - 1];
  const yesterday = chartData[chartData.length - 2];
  const revTrend = yesterday.revenue > 0
    ? ((today.revenue - yesterday.revenue) / yesterday.revenue) * 100
    : null;
  const ordTrend = yesterday.orders > 0
    ? ((today.orders - yesterday.orders) / yesterday.orders) * 100
    : null;
  return { revTrend, ordTrend };
}

export default function OverviewPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminApi.getDashboard,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => adminApi.getRecentOrders(5),
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['orders-analytics'],
    queryFn: () => adminApi.getOrdersAnalytics(7),
  });

  const { revTrend, ordTrend } = computeTrend(chartData);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
        <p className="text-gray-500">Hi Admin 👋 here&apos;s what is happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              icon={TrendingUp}
              trend={revTrend !== null ? (revTrend >= 0 ? 'up' : 'down') : undefined}
              trendValue={revTrend !== null ? `${revTrend >= 0 ? '+' : ''}${revTrend.toFixed(1)}% vs yesterday` : undefined}
            />
            <StatCard
              title="Total Orders"
              value={stats?.totalOrders || 0}
              icon={ShoppingCart}
              trend={ordTrend !== null ? (ordTrend >= 0 ? 'up' : 'down') : undefined}
              trendValue={ordTrend !== null ? `${ordTrend >= 0 ? '+' : ''}${ordTrend.toFixed(1)}% vs yesterday` : undefined}
            />
            <StatCard
              title="Active Stores"
              value={stats?.totalStores || 0}
              icon={Store}
              subtitle="Registered stores"
            />
            <StatCard
              title="Active Riders"
              value={stats?.totalRiders || 0}
              icon={Bike}
              subtitle="Available for delivery"
            />
          </>
        )}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Past 7 days</CardTitle>
          <Link href="/analytics" className="text-sm text-primary hover:underline">
            View details →
          </Link>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ChartContainer
              config={{
                revenue: {
                  label: 'Revenue',
                  color: 'hsl(var(--primary))',
                },
              }}
              className="h-64 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { weekday: 'short' });
                    }}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent orders</CardTitle>
          <Link href="/orders" className="text-sm text-primary hover:underline">
            View all orders →
          </Link>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders?.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>{order.customer?.name || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(Number(order.totalAmount))}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status] || 'bg-gray-100'}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatTime(order.createdAt)}</TableCell>
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
