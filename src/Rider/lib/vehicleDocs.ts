import type { DriverVehicle, VehicleDocKind } from "../api/accountVehicle";

export type DocStatus =
  | "expiring"
  | "warning"
  | "ok"
  | "verified"
  | "pending"
  | "on-file"
  | "missing"
  | "expired";

export interface VehicleDocument {
  key: string;
  kind: VehicleDocKind;
  label: string;
  expiresLabel: string;
  status: DocStatus;
  badgeText: string;
  fileName?: string;
  previewUrl?: string;
}

const DOCS: { key: string; kind: VehicleDocKind; label: string; field: string }[] = [
  { key: "vehicle-license", kind: "license", label: "Vehicle License", field: "vehicleLicense" },
  { key: "road-worthiness", kind: "roadworthiness", label: "Vehicle Road Worthiness", field: "roadworthiness" },
  { key: "drivers-license", kind: "drivers-license", label: "Driver's License", field: "driversLicense" },
  { key: "ownership", kind: "ownership", label: "Ownership Document", field: "ownershipDocument" },
];

const fmt = (d: Date) =>
  d.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });

/** Accepts ISO dates or MM/YYYY. */
function parseExpiry(v?: string): Date | null {
  if (!v) return null;
  const m = /^(\d{1,2})\/(\d{4})$/.exec(v);
  const d = m ? new Date(Number(m[2]), Number(m[1]), 0) : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function buildDocuments(vehicle?: DriverVehicle): VehicleDocument[] {
  return DOCS.map(({ key, kind, label, field }) => {
    const raw = (vehicle?.documents as any)?.[field];
    const info = typeof raw === "string" ? { url: raw } : raw || {};
    const url: string | undefined = info.url || info.fileUrl || info.documentUrl;
    const fileName = url ? decodeURIComponent(url.split("?")[0].split("/").pop() || "Document") : undefined;
    const base = { key, kind, label, fileName, previewUrl: url };

    if (!raw || (!url && !Object.keys(info).length))
      return { ...base, status: "missing", badgeText: "Not uploaded", expiresLabel: "No document on file" };

    const expiry = parseExpiry(info.expiryDate || info.expiresAt || info.expiry);
    if (expiry) {
      const days = Math.ceil((expiry.getTime() - Date.now()) / 86_400_000);
      const expiresLabel = `${days < 0 ? "Expired" : "Expires"} ${fmt(expiry)}`;
      if (days < 0) return { ...base, status: "expired", badgeText: "Expired", expiresLabel };
      if (days <= 7) return { ...base, status: "expiring", badgeText: `Expires in ${days} day${days === 1 ? "" : "s"}`, expiresLabel };
      if (days <= 30) return { ...base, status: "warning", badgeText: "Expiring soon", expiresLabel };
      return { ...base, status: "ok", badgeText: "Up to date", expiresLabel };
    }

    const s = String(info.status || "").toLowerCase();
    if (info.verified === true || s === "verified" || s === "approved")
      return { ...base, status: "verified", badgeText: "Verified", expiresLabel: "Document has been Verified" };
    if (s === "pending" || s === "under_review")
      return { ...base, status: "pending", badgeText: "Pending Review", expiresLabel: "Submitted for review" };
    return { ...base, status: "on-file", badgeText: "On file", expiresLabel: "Document on file" };
  });
}
