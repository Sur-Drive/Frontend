import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { BrandLogo } from "@/components/ui/BrandLogo";

// Shared shell for every auth screen: the lg+ split with the showcase panel,
// the mobile header, the centred form column, and the pinned footer. Each page
// renders only its own form content as `children`.
export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-dvh bg-bg">
      <AuthShowcase />

      <div className="relative flex w-full flex-none flex-col overflow-hidden lg:w-1/2">
        {/* Faint violet glow, top-right (clipped by overflow-hidden) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-40 size-105 rounded-full blur-2xl"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in srgb, var(--brand) 14%, transparent), transparent)",
          }}
        />

        {/* Header: logo top-left (mobile only) */}
        <header className="px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] lg:hidden">
          <BrandLogo variant="onLight" size="sm" priority />
        </header>

        {/* Form column: vertically centred on lg+, top-aligned below lg. */}
        <main className="flex flex-1 flex-col px-5 pt-8 lg:items-center lg:justify-center lg:px-10">
          <div className="w-full sm:mx-auto sm:max-w-105">{children}</div>
        </main>

        {/* Footer pinned to the bottom */}
        <footer className="mt-auto flex items-center justify-center gap-2 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-6 text-xs text-ink-subtle">
          <Lock className="size-3.5" aria-hidden="true" />
          Protected by encrypted session authentication
        </footer>
      </div>
    </div>
  );
}
