'use client';

import { useState, useEffect, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, getStoredAuth, setStoredAuth, clearStoredAuth } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { token: storedToken, user: storedUser } = getStoredAuth();
    setToken(storedToken);
    setUser(storedUser);
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setStoredAuth(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
