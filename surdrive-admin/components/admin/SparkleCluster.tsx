/**
 * Decorative sparkle cluster for the sign-in showcase — one large white
 * four-pointed star with two small amber sparkles tucked close to its
 * upper-left and upper-right, positioned above the headline.
 */
type SparkleClusterProps = {
  className?: string;
  /** Size (px) of the main white star. Amber accents scale relative to this. */
  size?: number;
};

const STAR_PATH =
  'M11 2c.9 4.8 3.2 7.1 8 8-4.8.9-7.1 3.2-8 8-.9-4.8-3.2-7.1-8-8 4.8-.9 7.1-3.2 8-8Z';

export function SparkleCluster({ className = '', size = 64 }: SparkleClusterProps) {
  const bigAccent = size * 0.28;
  const smallAccent = size * 0.2;
  const padding = size * 0.2; // room for accents to sit outside the star's edges

  return (
    <span
      className={`relative inline-block ${className}`}
      style={{ height: size + padding, width: size + padding }}
      aria-hidden="true"
    >
      {/* Small amber sparkle — upper-left, larger accent */}
      <svg
        className="absolute text-amber-400"
        style={{ top: 0, left: 0, height: bigAccent, width: bigAccent }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d={STAR_PATH} />
      </svg>
      {/* Main white sparkle */}
      <svg
        className="absolute text-white"
        style={{ top: padding * 0.6, left: padding * 0.6, height: size, width: size }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d={STAR_PATH} />
      </svg>
      {/* Small amber sparkle — upper-right, smaller accent */}
      <svg
        className="absolute text-amber-400"
        style={{ top: 0, right: 0, height: smallAccent, width: smallAccent }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d={STAR_PATH} />
      </svg>
    </span>
  );
}