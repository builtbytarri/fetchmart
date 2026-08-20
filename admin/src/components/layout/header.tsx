'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search, ShoppingCart, Store, Bike, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/lib/api';

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(query, 300);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['admin-search', debounced],
    queryFn: () => adminApi.search(debounced),
    enabled: debounced.trim().length >= 2,
  });

  const hasResults =
    (data?.orders?.length ?? 0) +
    (data?.stores?.length ?? 0) +
    (data?.users?.length ?? 0) +
    (data?.riders?.length ?? 0) > 0;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    setQuery('');
    router.push(path);
  };

  return (
    <header className="h-16 border-b border-[#DEE2E6] bg-white px-6 flex items-center justify-between">
      <div className="flex-1 max-w-md relative" ref={wrapRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C757D]" />
          <Input
            placeholder="Search orders, stores, riders, users…"
            className="pl-10 h-10 bg-[#F8F9FA] border-[#DEE2E6] rounded-xl focus:border-[#4CAF50] focus:ring-[#4CAF50]"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
        </div>

        {open && debounced.trim().length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DEE2E6] rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
            {isFetching && (
              <p className="px-4 py-3 text-sm text-gray-500">Searching…</p>
            )}
            {!isFetching && !hasResults && (
              <p className="px-4 py-3 text-sm text-gray-500">No results for &ldquo;{debounced}&rdquo;</p>
            )}

            {data?.orders?.length ? (
              <div className="py-1">
                <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">Orders</p>
                {data.orders.map((o: any) => (
                  <button
                    key={o.id}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-[#F8F9FA] flex items-center gap-2"
                    onClick={() => go('/orders')}
                  >
                    <ShoppingCart className="h-4 w-4 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">#{o.id.slice(0, 8)} · {o.store?.name}</p>
                      <p className="text-xs text-gray-500">{o.customer?.name} · {o.status}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {data?.stores?.length ? (
              <div className="py-1 border-t">
                <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">Stores</p>
                {data.stores.map((s: any) => (
                  <button
                    key={s.id}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-[#F8F9FA] flex items-center gap-2"
                    onClick={() => go('/stores')}
                  >
                    <Store className="h-4 w-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.owner?.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {data?.riders?.length ? (
              <div className="py-1 border-t">
                <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">Riders</p>
                {data.riders.map((r: any) => (
                  <button
                    key={r.id}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-[#F8F9FA] flex items-center gap-2"
                    onClick={() => go('/riders')}
                  >
                    <Bike className="h-4 w-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{r.user?.name}</p>
                      <p className="text-xs text-gray-500">{r.user?.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {data?.users?.length ? (
              <div className="py-1 border-t">
                <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">Users</p>
                {data.users.map((u: any) => (
                  <button
                    key={u.id}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-[#F8F9FA] flex items-center gap-2"
                    onClick={() => go('/users')}
                  >
                    <Users className="h-4 w-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email} · {u.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative hover:bg-[#E8F5E9]">
          <Bell className="h-5 w-5 text-[#6C757D]" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-[#DC3545] rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-[#E8F5E9]">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-[#E8F5E9] text-[#4CAF50] font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-[#212529]">{user?.name || 'Admin'}</p>
                <p className="text-xs text-[#6C757D]">{user?.email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-[#DC3545]">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
