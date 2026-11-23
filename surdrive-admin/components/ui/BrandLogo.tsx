import Image from 'next/image';

type BrandLogoProps = {
  className?: string;
  /** 'dark' = navy mark + navy text (light backgrounds), 'light' = white mark + white text (dark backgrounds) */
  tone?: 'light' | 'dark';
  showTagline?: boolean;
  /** compact = eye mark only, no wordmark/tagline */
  compact?: boolean;
};

// Mark assets: the "light" file has a navy mark for light backgrounds,
// the "dark" file has a white mark for dark backgrounds.
const MARK_SRC: Record<NonNullable<BrandLogoProps['tone']>, string> = {
  light: '/images/surdrive-logo-light.png', // navy mark → light backgrounds
  dark: '/images/surdrive-logo-dark.png', // white mark → dark backgrounds
};

export function BrandLogo({
  className = '',
  tone = 'light',
  showTagline = true,
  compact = false,
}: BrandLogoProps) {
  return (
    <div
      className={`flex items-center gap-3 ${
        tone === 'dark' ? 'text-[#14102B]' : 'text-white'
      } ${className}`}
    >
      <Image
        src={MARK_SRC[tone]}
        alt="Sur-Drive logo"
        width={44}
        height={38}
        priority
        className="h-10 w-auto shrink-0"
      />
      {!compact && (
        <div className="flex flex-col">
          <span className="text-xl font-extrabold leading-none tracking-wide">
            SUR-DRIVE
            <span className="ml-0.5 align-super text-[10px] font-bold tracking-normal text-[#F5A623]">
              HT
            </span>
          </span>
          {showTagline && (
            <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.3em] text-[#F5A623]">
              Your Road, Your Guide
            </span>
          )}
        </div>
      )}
    </div>
  );
}

