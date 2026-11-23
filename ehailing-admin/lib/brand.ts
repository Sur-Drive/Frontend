// Brand assets. "light" = white lockup for dark backgrounds,
// "dark" = dark lockup for light backgrounds.
export const LOGO_ON_DARK = "/images/surdrive-logo-light.png";
export const LOGO_ON_LIGHT = "/images/surdrive-logo-dark.png";

// Intrinsic pixel dimensions (read from the PNG headers) for next/image.
// Both PNGs carry transparent padding, so the visible mark is smaller than
// these numbers. Non-transparent bounding boxes (offset x,y):
//   light (LOGO_ON_DARK):   1047x770 at (103,45)  -> ~13% side / ~9% top padding
//   dark  (LOGO_ON_LIGHT):  1324x950 at (98,56)
// The intrinsic size is intentionally NOT cropped (PNGs are not modified);
// sizing is centralized in components/ui/BrandLogo.tsx (height-driven).
export const LOGO_ON_DARK_DIMENSIONS = { width: 1245, height: 848 };
export const LOGO_ON_LIGHT_DIMENSIONS = { width: 1520, height: 1035 };

