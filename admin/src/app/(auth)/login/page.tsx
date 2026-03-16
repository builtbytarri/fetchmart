'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password);
      
      // Check if user is admin
      if (response.user.role !== 'ADMIN') {
        setError('Access denied. Admin privileges required.');
        setIsLoading(false);
        return;
      }

      login(response.accessToken, response.user);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#4CAF50] flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4CAF50] via-[#43A047] to-[#388E3C]" />
        
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large circle top right */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10" />
          {/* Medium circle bottom left */}
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/10" />
          {/* Small circles */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full bg-white/5" />
          {/* Floating dots */}
          <div className="absolute top-20 right-1/3 w-3 h-3 rounded-full bg-white/30" />
          <div className="absolute top-1/3 left-20 w-2 h-2 rounded-full bg-white/40" />
          <div className="absolute bottom-1/4 right-20 w-4 h-4 rounded-full bg-white/20" />
          <div className="absolute top-1/2 right-1/2 w-2 h-2 rounded-full bg-white/30" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm">
            <Image
              src="/images/iconw.png"
              alt="FetchMart Logo"
              width={48}
              height={48}
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">FetchMart Admin</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Manage your delivery platform, track orders, monitor riders, and grow your business.
          </p>
          
         
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-8 right-8 flex justify-between text-white/50 text-sm z-10">
          <span>© 2026 FetchMart</span>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-[#F8F9FA]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/images/logo.png"
              alt="FetchMart Logo"
              width={100}
              height={100}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#212529]">Welcome Back</h2>
              <p className="text-[#6C757D] mt-2">Sign in to your admin account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 text-sm text-[#DC3545] bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#212529] font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6C757D]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@fetchmart.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-[#DEE2E6] focus:border-[#4CAF50] focus:ring-[#4CAF50]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#212529] font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6C757D]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 rounded-xl border-[#DEE2E6] focus:border-[#4CAF50] focus:ring-[#4CAF50]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6C757D] hover:text-[#212529]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-[#4CAF50] hover:bg-[#388E3C] text-white font-semibold text-base transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#6C757D]">
                Protected area. Admin access only.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-[#6C757D] mt-6">
            Need help? Contact{' '}
            <a href="mailto:support@fetchmart.com" className="text-[#4CAF50] hover:underline">
              support@fetchmart.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
