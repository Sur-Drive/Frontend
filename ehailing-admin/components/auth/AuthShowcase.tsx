import { Radio, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

const badgeIcon = "size-4 text-accent shrink-0";

export function AuthShowcase() {
  return (
    <aside className="relative hidden overflow-hidden bg-auth-panel text-white lg:flex lg:w-1/2 lg:flex-none flex-col">
      {/* Violet radial glow, top-left */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-48 size-140 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--brand) 55%, transparent), transparent)",
        }}
      />
      {/* Faint grid */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full text-white/10"
      >
        <defs>
          <pattern
            id="auth-grid"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M36 0H0V36"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>
      {/* Decorative circles + dashed route with dots */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full text-white/15"
        fill="none"
      >
        <circle cx="135" cy="70" r="34" stroke="currentColor" strokeWidth="1" />
        <circle
          cx="470"
          cy="640"
          r="150"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <path
          d="M-10 700 C 180 690 240 520 420 470 S 700 360 900 300"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="8 10"
          strokeLinecap="round"
        />
      </svg>
      {/* Route dots */}
      <span
        aria-hidden="true"
        className="absolute size-3.5 rounded-full bg-brand ring-4 ring-brand/20"
        style={{ left: "416px", top: "462px" }}
      />
      <span
        aria-hidden="true"
        className="absolute size-3.5 rounded-full bg-accent ring-4 ring-accent/20"
        style={{ left: "700px", top: "350px" }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
        <BrandLogo variant="onDark" size="lg" priority />

        <div className="max-w-md">
          <span
            aria-hidden="true"
            className="mb-6 block h-0.5 w-12 bg-accent"
          />
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Enterprise Mobility Operations
          </p>
          <h2 className="text-5xl font-light leading-[1.05] xl:text-6xl">
            <span className="block text-white">Your Platform.</span>
            <span className="block text-accent">Your Control.</span>
          </h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-white/70">
            Manage rides, drivers, passengers and operations from one central
            workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            <span className="flex items-center gap-2 text-sm text-white/80">
              <ShieldCheck className={badgeIcon} aria-hidden="true" />
              Secure administration
            </span>
            <span className="flex items-center gap-2 text-sm text-white/80">
              <Radio className={badgeIcon} aria-hidden="true" />
              Real-time operations
            </span>
          </div>
        </div>

        <p className="text-xs text-white/40">
          © 2026 SUR-DRIVEHT. All rights reserved.
        </p>
      </div>
    </aside>
  );
}
