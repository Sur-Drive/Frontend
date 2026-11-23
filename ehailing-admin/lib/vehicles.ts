import { apiFetch } from "@/lib/api";
import { EM_DASH, formatDateLabel, humanize } from "@/lib/format";
import type { Person } from "@/types/rides";
import type { Vehicle } from "@/types/vehicles";
import type {
  VehicleDetailResponse,
  VehicleListItem,
  VehicleListResponse,
} from "@/types/vehicles-api";

// Confirmed query params: page, limit, search, status,
// category, hasInspection, inspectionIncomplete. Only the ones this page
// wires are accepted here; nothing is invented. The two boolean params were
// only ever observed as `=true`, so they are typed `true` and false is never
// sent.

export interface VehiclesPageQuery {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  category?: string;
  hasInspection?: true;
  inspectionIncomplete?: true;
}

// GET /admin/ride-hailing/vehicles — list page with the observed envelope
// { items, total, page, limit, totalPages }.
export async function fetchVehiclesPage(
  query: VehiclesPageQuery,
  signal?: AbortSignal,
): Promise<VehicleListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.category) params.set("category", query.category);
  if (query.hasInspection) params.set("hasInspection", "true");
  if (query.inspectionIncomplete) params.set("inspectionIncomplete", "true");
  return apiFetch<VehicleListResponse>(
    `/admin/ride-hailing/vehicles?${params.toString()}`,
    { signal },
  );
}

// GET /admin/ride-hailing/vehicles/{driverProfileId} — bare object (no
// envelope). The same path keyed by driverUserId returns an identical body;
// the list only ever exposes profileId, so that is the id this section uses.
export async function fetchVehicleDetail(
  profileId: string,
  signal?: AbortSignal,
): Promise<VehicleDetailResponse> {
  return apiFetch<VehicleDetailResponse>(
    `/admin/ride-hailing/vehicles/${encodeURIComponent(profileId)}`,
    { signal },
  );
}

const AVATAR_TONES: Person["tone"][] = ["brand", "success", "warning", "info"];

// Deterministic avatar from the name (same input -> same output on server
// and client, so hydration never mismatches).
function makePerson(name: string | null | undefined): Person {
  const safeName =
    typeof name === "string" && name.trim() ? name.trim() : EM_DASH;
  const words = safeName
    .split(/\s+/)
    .filter((word) => /^[A-Za-z0-9]/.test(word));
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  let hash = 0;
  for (let index = 0; index < safeName.length; index += 1) {
    hash = (hash + safeName.charCodeAt(index)) % AVATAR_TONES.length;
  }
  return {
    name: safeName,
    initials: initials || EM_DASH,
    tone: AVATAR_TONES[hash],
  };
}

// nearestDocumentName and nearestDocumentExpiry are a pair (the nearest
// expiring document); rendered together only when the name is present.
function formatNearestDocument(
  name: string | null | undefined,
  expiry: string | null | undefined,
): string {
  const label = typeof name === "string" ? name.trim() : "";
  if (!label) return EM_DASH;
  const expiryLabel = formatDateLabel(expiry);
  return expiryLabel === EM_DASH ? humanize(label) : `${humanize(label)} · ${expiryLabel}`;
}

// humanize() lower-cases first, so it would render the observed category
// "suv" as "Suv" — but the filter dropdown and the rest of the app use the
// acronym "SUV". Only the acronym needs the override.
const CATEGORY_LABELS: Record<string, string> = { suv: "SUV" };

function formatCategory(raw: string | null | undefined): string {
  if (!raw) return EM_DASH;
  const trimmed = raw.trim();
  if (!trimmed) return EM_DASH;
  return CATEGORY_LABELS[trimmed.toLowerCase()] ?? humanize(trimmed);
}

// Maps one backend list record onto the UI Vehicle shape. Every field is read
// defensively: a missing/null value renders as "—" downstream and never
// throws. There is no year/colour/VIN/roadworthiness/last-inspection field on
// this endpoint, so those rows are not part of the
// shape at all and render "—" from the view.
export function mapVehicleListItem(item: VehicleListItem): Vehicle {
  const record = (item ?? {}) as Partial<VehicleListItem>;
  const inspection = record.inspection ?? null;
  return {
    id: record.profileId ?? "",
    makeModel: record.makeModel?.trim() || EM_DASH,
    regNumber: record.registrationNumber?.trim() || EM_DASH,
    driver: makePerson(record.driver?.name),
    category: formatCategory(record.category),
    capacity: typeof record.capacity === "number" ? record.capacity : null,
    insuranceExpiry: formatDateLabel(record.insuranceExpiry),
    nearestDocument: formatNearestDocument(
      record.nearestDocumentName,
      record.nearestDocumentExpiry,
    ),
    inspectionComplete:
      typeof inspection?.complete === "boolean" ? inspection.complete : null,
    hasDocumentIssues: record.hasDocumentIssues === true,
    account: record.accountStatus ?? "",
  };
}
