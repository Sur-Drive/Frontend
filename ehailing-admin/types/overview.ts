import type { LucideIcon } from "lucide-react";

export type Tone = "brand" | "success" | "warning" | "info" | "danger" | "orange";

// Single mapping from a semantic tone to its Tailwind classes and CSS var, so
// tiles, dots, bars and chart strokes stay in sync.
export const TONE_STYLES: Record<
  Tone,
  { soft: string; solid: string; avatar: string; text: string; var: string }
> = {
  brand: { soft: "bg-brand-soft", solid: "bg-brand", avatar: "bg-brand-avatar", text: "text-brand", var: "var(--brand)" },
  success: { soft: "bg-success-soft", solid: "bg-success", avatar: "bg-success-avatar", text: "text-success", var: "var(--success)" },
  warning: { soft: "bg-warning-soft", solid: "bg-warning", avatar: "bg-warning-avatar", text: "text-warning", var: "var(--warning)" },
  info: { soft: "bg-info-soft", solid: "bg-info", avatar: "bg-info-avatar", text: "text-info", var: "var(--info)" },
  danger: { soft: "bg-danger-soft", solid: "bg-danger", avatar: "bg-danger", text: "text-danger", var: "var(--danger)" },
  orange: { soft: "bg-orange-soft", solid: "bg-orange", avatar: "bg-orange", text: "text-orange", var: "var(--orange)" },
};

// City scope for the Overview dashboard selector.
export type CityScope = "all" | "lagos" | "abuja" | "port-harcourt";

// Selector order: platform-wide first, then cities.
export const CITY_SCOPES: CityScope[] = [
  "all",
  "lagos",
  "abuja",
  "port-harcourt",
];

export const CITY_SCOPE_LABELS: Record<CityScope, string> = {
  all: "All Cities",
  lagos: "Lagos",
  abuja: "Abuja",
  "port-harcourt": "Port Harcourt",
};

// Server-safe type guard (no "use client" here), matching isCategory in
// types/analytics.
export function isCityScope(value: string): value is CityScope {
  return (CITY_SCOPES as string[]).includes(value);
}

export interface Kpi {
  key: string;
  label: string;
  value: string;
  note?: string;
  noteTone?: "success" | "muted";
  tone: Tone;
  icon: LucideIcon;
}

// KPI as mapped from the dashboard endpoint; the view attaches the design
// icon per key, so lib mappers stay free of component imports.
export type KpiData = Omit<Kpi, "icon">;

// One hourly bucket of the dashboard's 24-hour activity series (UTC hours).
export interface HourPoint {
  label: string;
  count: number;
}

export interface CategorySlice {
  name: string;
  count: number;
  percent: number;
}

export interface AvailabilitySlice {
  label: string;
  value: number;
  tone: Tone;
  // Explicit bar fill width (%), from the mock data.
  bar: number;
}

export interface LiveOperation {
  label: string;
  // null = the dashboard endpoint has no field for this row; it renders as
  // "Not available yet" once loaded and "—" before the first fetch.
  value: number | null;
  tone: Tone;
}

export interface ActivityEntry {
  title: string;
  detail: string;
  time: string;
  tone: Tone;
  icon: LucideIcon;
}

export interface AttentionItem {
  title: string;
  detail: string;
  level: "warning" | "danger";
  count: number;
  href: string;
  icon: LucideIcon;
}
