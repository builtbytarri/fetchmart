'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  ShoppingCart,
  Store,
  Bike,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Package,
  RefreshCw,
  Filter,
  Search,
} from 'lucide-react';
import { adminApi } from '@/lib/api';

type ActivityType = 'order' | 'store' | 'rider' | 'user' | 'system';
type ActivityPriority = 'high' | 'medium' | 'low';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
  priority: ActivityPriority;
  status?: string;
}

const activityIcons: Record<ActivityType, React.ElementType> = {
  order: ShoppingCart,
  store: Store,
  rider: Bike,
  user: Users,
  system: Bell,
};

const activityColors: Record<ActivityType, string> = {
  order: 'bg-blue-100 text-blue-600',
  store: 'bg-purple-100 text-purple-600',
  rider: 'bg-green-100 text-green-600',
  user: 'bg-orange-100 text-orange-600',
  system: 'bg-gray-100 text-gray-600',
};

const priorityColors: Record<ActivityPriority, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function ActivityCard({ activity }: { activity: Activity }) {
  const Icon = activityIcons[activity.type];

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${activityColors[activity.type]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-gray-900">{activity.title}</h4>
            <p className="text-sm text-gray-500 mt-0.5">{activity.description}</p>
          </div>
          <Badge className={`flex-shrink-0 ${priorityColors[activity.priority]}`}>
            {activity.priority}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(activity.time)}
          </span>
          {activity.status && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {activity.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickStatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center">
          <div className={`w-2 h-full min-h-[80px] ${color}`} />
          <div className="flex items-center justify-between flex-1 p-4">
            <div>
              <p className="text-sm text-gray-500">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {change && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  {change}
                </p>
              )}
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${color.replace('bg-', 'bg-').replace('-500', '-100')}`}>
              <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: dashboardData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminApi.getDashboard,
  });

  const { data: recentOrders, isLoading: ordersLoading, refetch, isFetching } = useQuery({
    queryKey: ['recent-orders-activity'],
    queryFn: () => adminApi.getRecentOrders(20),
    refetchInterval: 15000,
  });

  // Transform orders into activities
  const activities: Activity[] = (recentOrders || []).map((order: any) => ({
    id: order.id,
    type: 'order' as ActivityType,
    title: `Order #${order.id.slice(0, 8).toUpperCase()}`,
    description: `${order.customer?.name || 'Customer'} placed an order worth ₦${Number(order.totalAmount).toLocaleString()}`,
    time: order.createdAt,
    priority: order.status === 'CREATED' ? 'high' : order.status === 'COMPLETED' ? 'low' : 'medium',
    status: order.status?.replace('_', ' '),
  }));

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    if (filter !== 'all' && activity.type !== filter) return false;
    if (searchQuery && !activity.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !activity.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Activity Center</h1>
          <p className="text-gray-500">Real-time updates and notifications</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <QuickStatCard
              title="Total Orders"
              value={dashboardData?.totalOrders || 0}
              icon={ShoppingCart}
              color="bg-blue-500"
            />
            <QuickStatCard
              title="Total Stores"
              value={dashboardData?.totalStores || 0}
              icon={Store}
              color="bg-purple-500"
            />
            <QuickStatCard
              title="Registered Riders"
              value={dashboardData?.totalRiders || 0}
              icon={Bike}
              color="bg-green-500"
            />
            <QuickStatCard
              title="Pending Actions"
              value={activities.filter(a => a.priority === 'high').length}
              icon={AlertCircle}
              color="bg-red-500"
            />
          </>
        )}
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Live Activity Feed
            </CardTitle>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-[200px]"
                />
              </div>
              {/* Filter — only 'all' and 'order' have data today */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['all', 'order'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                      filter === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {type === 'all' ? 'All' : 'Orders'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No activities found</h3>
              <p className="text-gray-500 mt-1">
                {searchQuery ? 'Try a different search term' : 'Activities will appear here as they happen'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span>Auto-refreshing every 15 seconds</span>
      </div>
    </div>
  );
}
