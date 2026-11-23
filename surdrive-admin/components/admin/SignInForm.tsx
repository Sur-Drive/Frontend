'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { TextField } from '@/components/ui/TextField';
import { EyeIcon } from '@/components/ui/icons/EyeIcon';
import { EyeOffIcon } from '@/components/ui/icons/EyeOffIcon';
import { LockIcon } from '@/components/ui/icons/LockIcon';
import { MailIcon } from '@/components/ui/icons/MailIcon';
import { ShieldIcon } from '@/components/ui/icons/ShieldIcon';
import { login } from '@/lib/auth';

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen w-full flex-1 flex-col bg-[#F6F4F9] px-6 py-10 sm:px-16 sm:py-12 lg:w-1/2 lg:flex-none lg:px-16 xl:px-24">
      <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col">
        <Badge>WELCOME BACK</Badge>
        <h2 className="mt-3 text-[28px] font-extrabold tracking-tight text-[#14102B]">Super Admin Sign In</h2>
        <p className="mt-2 text-[14px] text-[#6B7280]">
          Sign in to access the SUR–DRIVEHT Administration Portal.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <TextField
            id="email"
            label="Email"
            type="email"
            name="email"
            placeholder="e.g. you@example.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
            leadingIcon={<MailIcon className="h-[18px] w-[18px]" />}
          />

          <TextField
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
            leadingIcon={<LockIcon className="h-[18px] w-[18px]" />}
            labelAction={
              <a
                href="#"
                className="text-[13px] font-medium text-[#F97066] hover:text-[#F04438]"
              >
                Forgot password
              </a>
            }
            trailingAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-[#9CA3AF] transition-colors hover:text-[#6B7280]"
              >
                {showPassword ? (
                  <EyeOffIcon className="h-[18px] w-[18px]" />
                ) : (
                  <EyeIcon className="h-[18px] w-[18px]" />
                )}
              </button>
            }
          />

          <Checkbox id="remember" label="Remember for 30 days" name="remember" />

          <Button
            type="submit"
            fullWidth
            className="mt-3 h-11 text-[14px] font-semibold"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>

          {error ? (
            <AlertBanner icon={<ShieldIcon className="h-4 w-4" />}>{error}</AlertBanner>
          ) : null}

          <AlertBanner icon={<ShieldIcon className="h-4 w-4" />}>
            Your session is protected with enterprise-grade security and encrypted
            authentication.
          </AlertBanner>
        </form>
      </div>

      <p className="mx-auto mt-12 w-full max-w-[600px] px-6 text-center text-[12px] text-[#6B7280] sm:mt-16 sm:px-0">
        © 2026 SUR-DRIVEHT. All rights reserved.
      </p>
    </section>
  );
}
