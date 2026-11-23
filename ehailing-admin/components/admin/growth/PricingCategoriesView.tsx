"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { RideCategoryCard } from "@/components/admin/growth/RideCategoryCard";
import { EditCategoryDrawer } from "@/components/admin/growth/EditCategoryDrawer";
import { PricingConfigurationPanel } from "@/components/admin/growth/PricingConfigurationPanel";
import { DefaultsCard } from "@/components/admin/growth/DefaultsCard";
import { CityPricingView } from "@/components/admin/growth/CityPricingView";
import { EditCityRatesDrawer } from "@/components/admin/growth/EditCityRatesDrawer";
import { SurgeRulesView } from "@/components/admin/growth/SurgeRulesView";
import { EditSurgeRuleDrawer } from "@/components/admin/growth/EditSurgeRuleDrawer";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { useToast } from "@/components/ui/Toast";
import {
  RecordsError,
  RecordsSkeleton,
} from "@/components/admin/records/RecordsListState";
import {
  createSurgeRule,
  fetchCityPricingRules,
  fetchPricingCategories,
  fetchPricingDefaults,
  fetchSurgeRules,
  mapCityRules,
  mapDefaults,
  mapPricingCategories,
  mapSurgeRules,
  toggleSurgeRule,
  updateCategoryPricing,
  updateCityPricingRule,
  updatePricingDefaults,
  updateSurgeRule,
} from "@/lib/pricing";
import type {
  CategoryPatchBody,
  CityPatchBody,
  CityRuleView,
  DefaultsPatchBody,
  PricingCategoryView,
  PricingDefaultsView,
  SurgeRuleBody,
  SurgeRuleView,
} from "@/types/pricing-api";

const TAB_IDS = [
  "ride-categories",
  "pricing-configuration",
  "city-pricing",
  "surge-rules",
] as const;

type TabId = (typeof TAB_IDS)[number];

const TABS: TabItem[] = [
  { id: "ride-categories", label: "Ride Categories" },
  { id: "pricing-configuration", label: "Pricing Configuration" },
  { id: "city-pricing", label: "City Pricing" },
  { id: "surge-rules", label: "Surge Rules" },
];

function isTabId(value: string | null): value is TabId {
  return value !== null && (TAB_IDS as readonly string[]).includes(value);
}

// One shared confirm dialog for every mutation in this section. Only the
// documented endpoints reach this union; the two
// DELETEs (city rule, surge rule) are intentionally absent — no UI path can
// issue them.
type PendingMutation =
  | {
      kind: "category";
      rideType: string;
      label: string;
      body: CategoryPatchBody;
    }
  | { kind: "defaults"; body: DefaultsPatchBody }
  | {
      kind: "city";
      rideType: string;
      label: string;
      city: string;
      body: CityPatchBody;
    }
  | { kind: "surge-create"; name: string; body: SurgeRuleBody }
  | { kind: "surge-update"; id: string; name: string; body: SurgeRuleBody }
  | { kind: "surge-toggle"; id: string; name: string; activating: boolean };

// None of these mutations notify people or devices (pricing config only);
// each description states plainly how the change reaches rides.
function confirmCopy(pending: PendingMutation): {
  title: string;
  description: string;
} {
  switch (pending.kind) {
    case "category":
      return {
        title: `Confirm ${pending.label} pricing update`,
        description:
          "This creates a new pricing version and deactivates the previous rule. Updated fares apply to new rides only.",
      };
    case "defaults":
      return {
        title: "Confirm fallback defaults update",
        description:
          "This upserts the fallback defaults used when no city or global rule exists for a ride type. Updated fares apply to new rides only.",
      };
    case "city":
      return {
        title: `Confirm ${pending.city} ${pending.label} rates update`,
        description: `This creates a new version of the ${pending.city} rule for ${pending.label}. Updated fares apply to new rides in ${pending.city} only.`,
      };
    case "surge-create":
      return {
        title: `Create surge rule “${pending.name}”`,
        description:
          "This creates the surge rule. While active it changes fares for new rides that match its condition.",
      };
    case "surge-update":
      return {
        title: `Update surge rule “${pending.name}”`,
        description:
          "This replaces the whole rule: cleared optional fields are removed. When active it changes fares for new rides that match its condition.",
      };
    case "surge-toggle":
      return {
        title: `${pending.activating ? "Activate" : "Deactivate"} surge rule “${pending.name}”`,
        description: pending.activating
          ? "This activates the rule. Fares may change for new rides that match its condition."
          : "This deactivates the rule. Fares stop adjusting for rides that would have matched it.",
      };
  }
}

function failureMessage(cause: unknown): string {
  return cause instanceof Error && cause.message
    ? cause.message
    : "Request failed. Please try again.";
}

function successToast(pending: PendingMutation): {
  title: string;
  description: string;
} {
  switch (pending.kind) {
    case "category":
      return {
        title: "Pricing version saved",
        description: `${pending.label} now uses the new rates for new rides.`,
      };
    case "defaults":
      return {
        title: "Fallback defaults saved",
        description: "New rides without a city or global rule use these rates.",
      };
    case "city":
      return {
        title: "City rates updated",
        description: `${pending.city} ${pending.label} rates apply to new rides in that city.`,
      };
    case "surge-create":
      return {
        title: "Surge rule created",
        description: pending.body.isActive
          ? `“${pending.name}” is active.`
          : `“${pending.name}” is staged (inactive) until you activate it.`,
      };
    case "surge-update":
      return {
        title: "Surge rule updated",
        description: `“${pending.name}” was replaced.`,
      };
    case "surge-toggle":
      return {
        title: `Surge rule ${pending.activating ? "activated" : "deactivated"}`,
        description: `“${pending.name}” is now ${pending.activating ? "active" : "inactive"}.`,
      };
  }
}

interface PricingCategoriesViewProps {
  initialTab?: string;
}

export function PricingCategoriesView({ initialTab }: PricingCategoriesViewProps) {
  const router = useRouter();
  const toast = useToast();
  const confirmedExport = useConfirmedExport();

  const [activeTab, setActiveTab] = useState<TabId>(() =>
    isTabId(initialTab ?? null) ? (initialTab as TabId) : "ride-categories",
  );

  // Four independent resources: unloaded stays null (skeleton / "—"), a
  // loaded empty list is [] and renders the real empty state, and a loaded
  // null defaults row renders "Never configured" — never a fabricated 0.
  const [categories, setCategories] = useState<PricingCategoryView[] | null>(null);
  const [availableRideTypes, setAvailableRideTypes] = useState<string[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [defaults, setDefaults] = useState<PricingDefaultsView | null>(null);
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);
  const [defaultsError, setDefaultsError] = useState<string | null>(null);
  const [defaultsLoading, setDefaultsLoading] = useState(true);

  const [cityRules, setCityRules] = useState<CityRuleView[] | null>(null);
  const [cityError, setCityError] = useState<string | null>(null);
  const [cityLoading, setCityLoading] = useState(true);

  const [surgeRules, setSurgeRules] = useState<SurgeRuleView[] | null>(null);
  const [surgeError, setSurgeError] = useState<string | null>(null);
  const [surgeLoading, setSurgeLoading] = useState(true);

  const [reloadToken, setReloadToken] = useState(0);

  // All state transitions below happen in async callbacks — never
  // synchronously in the effect body.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const settled = (cause: unknown): boolean =>
      cancelled ||
      (cause instanceof Error && cause.name === "AbortError");

    fetchPricingCategories(controller.signal)
      .then((raw) => {
        if (cancelled) return;
        const mapped = mapPricingCategories(raw);
        setCategories(mapped.items);
        setAvailableRideTypes(mapped.availableRideTypes);
        setCategoriesError(null);
        setCategoriesLoading(false);
      })
      .catch((cause: unknown) => {
        if (settled(cause)) return;
        setCategoriesError(failureMessage(cause));
        setCategoriesLoading(false);
      });

    fetchPricingDefaults(controller.signal)
      .then((raw) => {
        if (cancelled) return;
        setDefaults(mapDefaults(raw));
        setDefaultsLoaded(true);
        setDefaultsError(null);
        setDefaultsLoading(false);
      })
      .catch((cause: unknown) => {
        if (settled(cause)) return;
        setDefaultsError(failureMessage(cause));
        setDefaultsLoading(false);
      });

    fetchCityPricingRules(controller.signal)
      .then((raw) => {
        if (cancelled) return;
        setCityRules(mapCityRules(raw));
        setCityError(null);
        setCityLoading(false);
      })
      .catch((cause: unknown) => {
        if (settled(cause)) return;
        setCityError(failureMessage(cause));
        setCityLoading(false);
      });

    fetchSurgeRules(controller.signal)
      .then((raw) => {
        if (cancelled) return;
        setSurgeRules(mapSurgeRules(raw));
        setSurgeError(null);
        setSurgeLoading(false);
      })
      .catch((cause: unknown) => {
        if (settled(cause)) return;
        setSurgeError(failureMessage(cause));
        setSurgeLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadToken]);

  // One Retry for all four resources (they share the backend). Loading flips
  // here, in the event handler — never inside the effect.
  function retryAll() {
    setCategoriesLoading(true);
    setDefaultsLoading(true);
    setCityLoading(true);
    setSurgeLoading(true);
    setCategoriesError(null);
    setDefaultsError(null);
    setCityError(null);
    setSurgeError(null);
    setReloadToken((token) => token + 1);
  }

  const [pending, setPending] = useState<PendingMutation | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Drawers stay open until the backend confirms (their drafts survive a
  // failed confirm); each is mounted conditionally with a key so its draft
  // re-initialises on every open.
  const [editingCategory, setEditingCategory] =
    useState<PricingCategoryView | null>(null);
  const [editingCityRule, setEditingCityRule] = useState<CityRuleView | null>(
    null,
  );
  const [surgeDrawer, setSurgeDrawer] = useState<
    { mode: "create" } | { mode: "edit"; rule: SurgeRuleView } | null
  >(null);

  function openConfirm(next: PendingMutation) {
    setMutationError(null);
    setPending(next);
  }

  // Confirm -> loading -> mutation -> refetch from the backend -> close.
  // No local list change happens before the backend confirms; the refetch
  // replaces every resource so the UI always shows server truth.
  async function handleConfirm() {
    if (!pending || mutating) return;
    setMutating(true);
    setMutationError(null);
    try {
      switch (pending.kind) {
        case "category":
          await updateCategoryPricing(pending.rideType, pending.body);
          break;
        case "defaults":
          await updatePricingDefaults(pending.body);
          break;
        case "city":
          await updateCityPricingRule(pending.rideType, pending.city, pending.body);
          break;
        case "surge-create":
          await createSurgeRule(pending.body);
          break;
        case "surge-update":
          await updateSurgeRule(pending.id, pending.body);
          break;
        case "surge-toggle":
          await toggleSurgeRule(pending.id);
          break;
      }
      setCategoriesError(null);
      setDefaultsError(null);
      setCityError(null);
      setSurgeError(null);
      setReloadToken((token) => token + 1);
      toast.success(successToast(pending));
      setPending(null);
      setEditingCategory(null);
      setEditingCityRule(null);
      setSurgeDrawer(null);
    } catch (cause) {
      // Keep the dialog (and any open drawer) alive with the backend message.
      setMutationError(failureMessage(cause));
    } finally {
      setMutating(false);
    }
  }

  function handleConfirmCancel() {
    if (mutating) return;
    setPending(null);
    setMutationError(null);
  }

  function changeTab(id: string) {
    if (!isTabId(id)) return;
    setActiveTab(id);
    // Reflect the tab in the URL so it survives a refresh.
    router.replace(`?tab=${id}`, { scroll: false });
  }

  function handleExport() {
    if (!categories) return;
    const csv = toCsv(
      [
        "Ride type",
        "Status",
        "Version",
        "Base fare",
        "Per km",
        "Per minute",
        "Booking fee",
        "Minimum fare",
        "Commission %",
      ],
      categories.map((category) => [
        category.label,
        category.active ? "Active" : "Inactive",
        category.version ?? "",
        category.baseFare ?? "",
        category.perKm ?? "",
        category.perMinute ?? "",
        category.bookingFee ?? "",
        category.minimumFare ?? "",
        category.commissionPercent ?? "",
      ]),
    );
    downloadCsv("ride-pricing.csv", csv);
  }

  const categoriesPanel =
    categoriesLoading && categories === null ? (
      <RecordsSkeleton rows={6} />
    ) : categoriesError ? (
      <RecordsError message={categoriesError} onRetry={retryAll} />
    ) : categories && categories.length > 0 ? (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <RideCategoryCard
            key={category.rideType}
            category={category}
            onEdit={setEditingCategory}
          />
        ))}
      </div>
    ) : (
      <p className="rounded-2xl border border-border bg-surface-muted px-4 py-8 text-center text-sm text-ink-muted">
        No pricing rules yet.
      </p>
    );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Pricing & Categories"
        description="Configure ride products, city pricing and platform fees."
        actions={
          <Button
            variant="secondary"
            disabled={categories === null}
            onClick={() =>
              confirmedExport.requestExport("Confirm export", handleExport)
            }
          >
            <Download className="size-4" aria-hidden="true" />
            Export
          </Button>
        }
      />

      <Card className="min-w-0">
        <Tabs tabs={TABS} value={activeTab} onChange={changeTab} />

        <div className="pt-5">
          {activeTab === "ride-categories" ? (
            <div
              id="panel-ride-categories"
              role="tabpanel"
              aria-labelledby="tab-ride-categories"
            >
              {categoriesPanel}
            </div>
          ) : null}

          {activeTab === "pricing-configuration" ? (
            // The panel renders its own tabpanel (id panel-pricing-
            // configuration); this wrapper only stacks it with the defaults
            // card below.
            <div className="flex flex-col gap-4">
              {categoriesLoading && categories === null ? (
                <RecordsSkeleton rows={6} />
              ) : categoriesError ? (
                <RecordsError message={categoriesError} onRetry={retryAll} />
              ) : categories && categories.length > 0 ? (
                <>
                  <PricingConfigurationPanel
                    categories={categories}
                    onRequestSave={(rideType, body) =>
                      openConfirm({
                        kind: "category",
                        rideType,
                        label:
                          categories.find((c) => c.rideType === rideType)
                            ?.label ?? rideType,
                        body,
                      })
                    }
                  />
                  {defaultsLoading && !defaultsLoaded ? (
                    <RecordsSkeleton rows={2} />
                  ) : defaultsError ? (
                    <RecordsError message={defaultsError} onRetry={retryAll} />
                  ) : (
                    <DefaultsCard
                      defaults={defaults}
                      onRequestSave={(body) =>
                        openConfirm({ kind: "defaults", body })
                      }
                    />
                  )}
                </>
              ) : (
                <p className="rounded-2xl border border-border bg-surface-muted px-4 py-8 text-center text-sm text-ink-muted">
                  No pricing rules yet.
                </p>
              )}
            </div>
          ) : null}

          {activeTab === "city-pricing" ? (
            <CityPricingView
              rules={cityRules}
              rideTypes={availableRideTypes}
              loading={cityLoading}
              error={cityError}
              onRetry={retryAll}
              onEditRule={setEditingCityRule}
            />
          ) : null}

          {activeTab === "surge-rules" ? (
            <SurgeRulesView
              rules={surgeRules}
              loading={surgeLoading}
              error={surgeError}
              onRetry={retryAll}
              onAddRule={() => setSurgeDrawer({ mode: "create" })}
              onEditRule={(rule) => setSurgeDrawer({ mode: "edit", rule })}
              onToggleRule={(rule) =>
                openConfirm({
                  kind: "surge-toggle",
                  id: rule.id,
                  name: rule.name,
                  activating: !rule.isActive,
                })
              }
            />
          ) : null}
        </div>
      </Card>

      {/* Stacked drawers: while the confirm dialog is open they hand Escape
          and focus trapping to it (same pattern as EntityDrawer). */}
      {editingCategory ? (
        <EditCategoryDrawer
          key={editingCategory.rideType}
          category={editingCategory}
          closeOnEscape={pending === null}
          trapFocus={pending === null}
          onClose={() => setEditingCategory(null)}
          onSave={(body) =>
            openConfirm({
              kind: "category",
              rideType: editingCategory.rideType,
              label: editingCategory.label,
              body,
            })
          }
        />
      ) : null}

      {editingCityRule ? (
        <EditCityRatesDrawer
          key={`${editingCityRule.rideType}/${editingCityRule.city}`}
          rule={editingCityRule}
          closeOnEscape={pending === null}
          trapFocus={pending === null}
          onClose={() => setEditingCityRule(null)}
          onSave={(body) =>
            openConfirm({
              kind: "city",
              rideType: editingCityRule.rideType,
              label: editingCityRule.rideTypeLabel,
              city: editingCityRule.city,
              body,
            })
          }
        />
      ) : null}

      {surgeDrawer ? (
        <EditSurgeRuleDrawer
          key={surgeDrawer.mode === "edit" ? surgeDrawer.rule.id : "create"}
          rule={surgeDrawer.mode === "edit" ? surgeDrawer.rule : null}
          closeOnEscape={pending === null}
          trapFocus={pending === null}
          onClose={() => setSurgeDrawer(null)}
          onSave={(body) =>
            openConfirm(
              surgeDrawer.mode === "edit"
                ? {
                    kind: "surge-update",
                    id: surgeDrawer.rule.id,
                    name: body.name,
                    body,
                  }
                : { kind: "surge-create", name: body.name, body },
            )
          }
        />
      ) : null}

      <ConfirmDialog
        open={pending !== null}
        title={pending ? confirmCopy(pending).title : ""}
        description={pending ? confirmCopy(pending).description : ""}
        noteLabel="Internal note"
        // The backend stores no note field: the control keeps its slot
        // disabled with a "Not saved yet" helper.
        noteDisabled
        confirmTone="brand"
        loading={mutating}
        error={mutationError}
        onConfirm={handleConfirm}
        onCancel={handleConfirmCancel}
      />
      {confirmedExport.dialog}
    </div>
  );
}
