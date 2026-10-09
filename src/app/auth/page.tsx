'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Trophy,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

function AuthPageContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams?.get('mode') === 'register' ? 'register' : 'login',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ email, password, firstName });
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
    setIsLoading(false);
  }

  // const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'; // used by the Google button

  return (
    <div className="flex min-h-screen">
      {/* ─── Left Panel — Dark Ink Branding ─── */}
      <div className="relative hidden w-1/2 overflow-hidden bg-dark-ink lg:flex lg:flex-col lg:justify-between p-12">
        {/* Decorative letter */}
        <span
          className="pointer-events-none absolute -left-8 -top-16 select-none font-display font-bold text-white"
          style={{ fontSize: '32rem', lineHeight: '0.8', opacity: 0.04 }}
        >
          O
        </span>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="mb-16 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-oracle-md bg-oracle-gold/20">
              <Trophy className="h-7 w-7 text-oracle-gold" />
            </div>
            <span className="font-display text-display-md tracking-tight text-txt-inverse">
              OraQL_
            </span>
          </div>

          {/* Headline */}
          <h1 className="max-w-lg font-display text-display-xl leading-[1.05] tracking-tight text-txt-inverse">
            Smarter bets start with{' '}
            <span className="text-oracle-gradient">proof.</span>
          </h1>

          <p className="mt-6 max-w-md text-body-lg leading-relaxed text-txt-inverse-2">
            Team patterns that beat the usual rate, honest chances, and a record you
            can check — wins and losses.
          </p>

          {/* Feature highlights */}
          <div className="mt-12 space-y-4">
            {[
              'Two days of full access, free',
              'Every pick locked before kickoff',
              'Full results record, losses included',
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 text-body-sm text-txt-inverse-2"
              >
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-oracle-gold" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-caption text-txt-inverse-2/50">
          OraQL_ is a research tool. It does not take bets or promise winnings. 18+ only — bet responsibly.
        </p>
      </div>

      {/* ─── Right Panel — Warm White Form ─── */}
      <div className="flex flex-1 items-center justify-center bg-warm-white p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-oracle-sm bg-dark-ink">
              <Trophy className="h-5 w-5 text-oracle-gold" />
            </div>
            <span className="font-display text-display-sm tracking-tight">
              OraQL_
            </span>
          </div>

          {/* Header */}
          <h2 className="font-display text-display-md tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-body text-txt-secondary">
            {mode === 'login'
              ? 'Sign in to access your dashboard and picks.'
              : 'Get started with OraQL_ in seconds.'}
          </p>

          {/* Google SSO — hidden for now, along with the "or" divider.
          <a
            href={`${API_URL}/api/v1/auth/google`}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-oracle-sm border border-warm-stone bg-white px-4 py-3 text-body font-medium transition-all duration-normal hover:bg-warm-cream hover:border-warm-taupe"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </a>

          Divider:
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-warm-sand" />
            <span className="text-caption text-txt-tertiary">or</span>
            <div className="flex-1 border-t border-warm-sand" />
          </div> */}

          {/* Email form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'register' && (
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-txt-tertiary" />
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-oracle-sm border border-warm-stone bg-white py-3 pl-11 pr-4 text-body outline-none transition-all duration-normal placeholder:text-txt-tertiary focus:border-oracle-gold focus:ring-2 focus:ring-oracle-gold/20"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-txt-tertiary" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-oracle-sm border border-warm-stone bg-white py-3 pl-11 pr-4 text-body outline-none transition-all duration-normal placeholder:text-txt-tertiary focus:border-oracle-gold focus:ring-2 focus:ring-oracle-gold/20"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-txt-tertiary" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-oracle-sm border border-warm-stone bg-white py-3 pl-11 pr-11 text-body outline-none transition-all duration-normal placeholder:text-txt-tertiary focus:border-oracle-gold focus:ring-2 focus:ring-oracle-gold/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-txt-tertiary transition-colors hover:text-txt-secondary"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {error && (
              <div className="rounded-oracle-sm bg-danger/10 px-4 py-3 text-body-sm text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-oracle-sm px-5 py-3 font-display text-body font-semibold transition-all duration-normal',
                'bg-dark-ink text-txt-inverse hover:bg-dark-charcoal active:bg-dark-graphite',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oracle-gold focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {isLoading
                ? 'Loading...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Toggle */}
          <p className="mt-8 text-center text-body-sm text-txt-tertiary">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="font-medium text-oracle-gold-dark transition-colors hover:text-oracle-gold hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="font-medium text-oracle-gold-dark transition-colors hover:text-oracle-gold hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageContent />
    </Suspense>
  );
}
