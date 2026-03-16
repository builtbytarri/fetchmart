'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Store,
  Bike,
  Users,
  Map,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Stores', href: '/stores', icon: Store },
  { name: 'Riders', href: '/riders', icon: Bike },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Map View', href: '/map', icon: Map },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help & Support', href: '/help', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-[#DEE2E6]">
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-[#DEE2E6]">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo.png"
            alt="FetchMart"
            width={40}
            height={40}
          />
          <span className="font-semibold text-lg text-[#212529]">FetchMart</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#4CAF50] text-white'
                  : 'text-[#6C757D] hover:bg-[#E8F5E9] hover:text-[#388E3C]'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="px-3 py-4 border-t border-[#DEE2E6] space-y-1">
        {secondaryNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6C757D] hover:bg-[#E8F5E9] hover:text-[#388E3C] transition-colors"
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#DC3545] hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </button>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-4 py-3 border-t border-[#DEE2E6]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#E8F5E9] flex items-center justify-center">
              <span className="text-[#4CAF50] font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#212529] truncate">{user.name}</p>
              <p className="text-xs text-[#6C757D] truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
