import { useEffect, useRef, useState } from "react";
import { GoogleLogin, type GoogleLoginProps } from "@react-oauth/google";

/**
 * Google's button only accepts a PIXEL width (200–400). Passing "100%"
 * is ignored and Google draws a small default button, so the invisible
 * overlay used on top of our styled buttons covers only part of them.
 * This wrapper measures its container and passes a valid pixel width.
 */
type Props = Omit<GoogleLoginProps, "width">;

export default function FitGoogleLogin(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setWidth(Math.min(400, Math.max(200, w)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex h-full w-full justify-center">
      {width !== null && <GoogleLogin {...props} width={String(width)} />}
    </div>
  );
}
