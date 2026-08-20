'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Users,
  Store,
  Bike,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
} from 'lucide-react';
import { adminApi } from '@/lib/api';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatHour(hour: number) {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-primary',
  bg = 'bg-primary/10',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  bg?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full ${bg} flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ec4899',
  '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4',
  '#84cc16', '#a855f7',
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(7);
  const [summaryDays, setSummaryDays] = useState(30);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminApi.getDashboard,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['orders-analytics', days],
    queryFn: () => adminApi.getOrdersAnalytics(days),
  });

  const { data: topStores, isLoading: storesLoading } = useQuery({
    queryKey: ['top-stores', summaryDays],
    queryFn: () => adminApi.getTopStores(summaryDays),
  });

  const { data: topRiders, isLoading: ridersLoading } = useQuery({
    queryKey: ['top-riders', summaryDays],
    queryFn: () => adminApi.getTopRiders(summaryDays),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary', summaryDays],
    queryFn: () => adminApi.getAnalyticsSummary(summaryDays),
  });

  const totalRevenue = chartData?.reduce((sum: number, d: any) => sum + d.revenue, 0) || 0;
  const totalOrders = chartData?.reduce((sum: number, d: any) => sum + d.orders, 0) || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-gray-500">Track your business performance</p>
      </div>

      {/* ── Summary KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              icon={DollarSign}
              label="Total Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              color="text-green-600"
              bg="bg-green-100"
            />
            <StatCard
              icon={ShoppingCart}
              label="Total Orders"
              value={stats?.totalOrders || 0}
              sub={`${stats?.activeOrders || 0} active`}
              color="text-blue-600"
              bg="bg-blue-100"
            />
            <StatCard
              icon={Users}
              label="Customers"
              value={stats?.totalUsers || 0}
              color="text-purple-600"
              bg="bg-purple-100"
            />
            <StatCard
              icon={Store}
              label="Stores"
              value={stats?.totalStores || 0}
              sub={`${stats?.totalRiders || 0} riders`}
              color="text-orange-600"
              bg="bg-orange-100"
            />
          </>
        )}
      </div>

      {/* ── Performance KPIs (last N days) ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
          <div className="flex gap-1 border rounded-md overflow-hidden text-sm">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setSummaryDays(d)}
                className={`px-3 py-1.5 transition-colors ${
                  summaryDays === d ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {summaryLoading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))
          ) : (
            <>
              <StatCard
                icon={CheckCircle2}
                label="Completion Rate"
                value={`${summary?.completionRate ?? 0}%`}
                sub={`${summary?.completedOrders ?? 0} completed`}
                color="text-green-600"
                bg="bg-green-100"
              />
              <StatCard
                icon={DollarSign}
                label="Avg. Order Value"
                value={formatCurrency(summary?.avgOrderValue ?? 0)}
                color="text-blue-600"
                bg="bg-blue-100"
              />
              <StatCard
                icon={XCircle}
                label="Cancelled Orders"
                value={summary?.cancelledOrders ?? 0}
                color="text-red-500"
                bg="bg-red-100"
              />
              <StatCard
                icon={Clock}
                label="Peak Hour"
                value={formatHour(summary?.peakHour ?? 0)}
                sub="most orders placed"
                color="text-orange-600"
                bg="bg-orange-100"
              />
            </>
          )}
        </div>
      </div>

      {/* ── Revenue & Orders Charts ────────────────────────────────────────── */}
      <Tabs defaultValue="7" onValueChange={(v) => setDays(parseInt(v))}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Revenue & Orders Over Time</h2>
          <TabsList>
            <TabsTrigger value="7">7 Days</TabsTrigger>
            <TabsTrigger value="14">14 Days</TabsTrigger>
            <TabsTrigger value="30">30 Days</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={String(days)} className="space-y-4">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Revenue</span>
                <span className="text-2xl">{formatCurrency(totalRevenue)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ChartContainer
                  config={{ revenue: { label: 'Revenue', color: 'hsl(var(--primary))' } }}
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) =>
                          new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        }
                        axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis
                        tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                        axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone" dataKey="revenue"
                        stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Orders</span>
                <span className="text-2xl">{totalOrders}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ChartContainer
                  config={{ orders: { label: 'Orders', color: 'hsl(var(--primary))' } }}
                  className="h-64 w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) =>
                          new Date(v).toLocaleDateString('en-US', { weekday: 'short' })
                        }
                        axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Top Stores & Top Riders ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Stores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Top Stores
              <Badge variant="secondary">{summaryDays}d</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {storesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !topStores?.length ? (
              <p className="text-sm text-gray-400 py-4 text-center">No completed orders yet</p>
            ) : (
              <div className="space-y-3">
                {topStores.map((store: any, i: number) => (
                  <div key={store.storeId} className="flex items-center gap-3">
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{store.name}</p>
                        <p className="text-sm font-semibold text-green-600 ml-2 flex-shrink-0">
                          {formatCurrency(store.revenue)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.round((store.revenue / (topStores[0]?.revenue || 1)) * 100)}%`,
                            backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                            minWidth: 4,
                            maxWidth: '70%',
                          }}
                        />
                        <p className="text-xs text-gray-400">{store.orders} orders</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Riders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bike className="h-5 w-5 text-primary" />
              Top Riders
              <Badge variant="secondary">{summaryDays}d</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ridersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !topRiders?.length ? (
              <p className="text-sm text-gray-400 py-4 text-center">No completed deliveries yet</p>
            ) : (
              <div className="space-y-3">
                {topRiders.map((rider: any, i: number) => (
                  <div key={rider.riderId} className="flex items-center gap-3">
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    >
                      {i === 0 ? <Star className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{rider.name}</p>
                        <p className="text-sm font-semibold text-blue-600 ml-2 flex-shrink-0">
                          {rider.deliveries} deliveries
                        </p>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.round((rider.deliveries / (topRiders[0]?.deliveries || 1)) * 100)}%`,
                            backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                            minWidth: 4,
                            maxWidth: '70%',
                          }}
                        />
                        <p className="text-xs text-gray-400">
                          {rider.earnings > 0 ? `Earned ${formatCurrency(rider.earnings)}` : 'No earnings yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
