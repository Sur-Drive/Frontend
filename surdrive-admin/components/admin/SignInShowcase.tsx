import Image from 'next/image';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { BarChartIcon } from '@/components/ui/icons/BarChartIcon';
import { ChartLineIcon } from '@/components/ui/icons/ChartLineIcon';
import { LockIcon } from '@/components/ui/icons/LockIcon';
import { UsersIcon } from '@/components/ui/icons/UsersIcon';
import { ShowcaseFeatureItem } from './ShowcaseFeatureItem';
import { SparkleCluster } from './SparkleCluster';

// TODO: confirm the feature copy and icon mapping are final
const FEATURES = [
  { id: 'fleets', label: 'Monitor all registered fleets', icon: ChartLineIcon },
  { id: 'orgs', label: 'Manage organizations and subscriptions', icon: UsersIcon },
  { id: 'analytics', label: 'View platform-wide analytics', icon: BarChartIcon },
  { id: 'security', label: 'Secure enterprise administration', icon: LockIcon },
] as const;

// Static decorative fill values — hardcoded scattered grid cells that get a
// translucent white fill, giving the grid a textured, uneven look.
// Cell size matches the 60px grid (h-[60px] w-[60px]).
const HIGHLIGHTED_CELLS = [
  'left-[120px] top-0',
  'left-0 top-[60px]',
  'left-[300px] top-[60px]',
  'left-[240px] top-[120px]',
  'left-[60px] top-[180px]',
  'left-[360px] top-[240px]',
  'left-[180px] top-[360px]',
  'left-[420px] top-[300px]',
] as const;

export function SignInShowcase() {
  return (
    <section className="relative hidden overflow-hidden bg-[#0B0015] lg:flex lg:w-1/2 lg:min-h-screen lg:flex-col lg:px-20 lg:py-16">
      {/* Control-room background image */}
      <Image
        src="/images/signin-img.png"
        alt=""
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover brightness-[0.55]"
        aria-hidden="true"
      />
      {/* Grid overlay — thin light lines forming a large grid across the image,
          with a scattered subset of cells carrying a translucent white fill
          for a textured, uneven look */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {HIGHLIGHTED_CELLS.map((cellClass) => (
          <div key={cellClass} className={`absolute h-[60px] w-[60px] bg-white/[0.5] ${cellClass}`} />
        ))}
      </div>
      {/* Darkening overlay so the logo, headline, and feature list stay legible */}
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,0,21,0.78)_0%,rgba(11,0,21,0.5)_34%,rgba(11,0,21,0.92)_72%,rgba(11,0,21,0.98)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-1 flex-col">
        <BrandLogo />

        <div className="mt-auto flex max-w-xl flex-col">
          <SparkleCluster className="mt-5" />
          <h1 className="mt-2 text-[32px] font-extrabold leading-[1.15] tracking-tight text-white">
            Manage Every Fleet.
            <br />
            Control Every Journey.
          </h1>
          <p className="mt-4 text-[14px] leading-6 text-white/85">
            Access the SUR–DRIVEHT Super Admin Portal to oversee organizations, monitor
            fleet operations, manage subscriptions, and maintain complete control of the
            platform from one secure dashboard.
          </p>

          <ul className="mt-6 flex flex-col gap-4">
            {FEATURES.map((feature) => (
              <ShowcaseFeatureItem key={feature.id} icon={feature.icon} label={feature.label} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

