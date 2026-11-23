"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, ChevronRight, Download, Globe, MapPin, Plus } from "lucide-react";
import { Settings, ShieldCheck, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { downloadCsv } from "@/lib/csv";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { savePlatformSettings } from "@/lib/settings";
import { buildPlatformSettingsCsv } from "@/lib/mock/platform-settings";
import { useToast } from "@/components/ui/Toast";
import { SETTING_SECTIONS, countChangedFields } from "@/types/platform-settings";
import { validateSettings } from "@/types/platform-settings";
import type { OperatingCity, PlatformSettingsDraft } from "@/types/platform-settings";
import type { SettingSectionId, SettingsErrors } from "@/types/platform-settings";
import { GeneralPanel } from "@/components/admin/settings/GeneralPanel";
import type { GeneralPatch } from "@/components/admin/settings/GeneralPanel";
import { CitiesPanel } from "@/components/admin/settings/CitiesPanel";
import { PaymentsPanel } from "@/components/admin/settings/PaymentsPanel";
import { RidePanel } from "@/components/admin/settings/RidePanel";
import { SafetyPanel } from "@/components/admin/settings/SafetyPanel";
import { IntegrationsPanel } from "@/components/admin/settings/IntegrationsPanel";
import { CityDrawer } from "@/components/admin/settings/CityDrawer";
import type { CitySave } from "@/components/admin/settings/CityDrawer";
import { BoundaryDrawer } from "@/components/admin/settings/BoundaryDrawer";
import type { BoundarySave } from "@/components/admin/settings/BoundaryDrawer";
import { IntegrationDrawer } from "@/components/admin/settings/IntegrationDrawer";
import type { IntegrationSave } from "@/components/admin/settings/IntegrationDrawer";

const CONFIRM_DESCRIPTION =
  "Please confirm you want to continue.";

const NAV_ICONS: Record<SettingSectionId, LucideIcon> = {
  general: Settings,
  cities: MapPin,
  payments: Wallet,
  ride: Car,
  safety: ShieldCheck,
  integrations: Globe,
};

function isSectionId(value: string): value is SettingSectionId {
  return SETTING_SECTIONS.some((section) => section.id === value);
}

interface PlatformSettingsViewProps {
  initialSettings: PlatformSettingsDraft;
  initialSection?: string;
  categoryNames: string[];
  maxCategoryCapacity: number;
}

type CityState = { city: OperatingCity | null } | null;

export function PlatformSettingsView(props: PlatformSettingsViewProps) {
  const router = useRouter();
  const toast = useToast();
  const confirmedExport = useConfirmedExport();
  const maxCapacity = props.maxCategoryCapacity;

  const [activeSection, setActiveSection] = useState<SettingSectionId>(() =>
    props.initialSection && isSectionId(props.initialSection)
      ? props.initialSection
      : "general",
  );
  const [saved, setSaved] = useState<PlatformSettingsDraft>(props.initialSettings);
  const [draft, setDraft] = useState<PlatformSettingsDraft>(props.initialSettings);
  const [errors, setErrors] = useState<SettingsErrors | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [cityState, setCityState] = useState<CityState>(null);
  const [boundaryCityId, setBoundaryCityId] = useState<string | null>(null);
  const [cityNameError, setCityNameError] = useState<string | undefined>(undefined);
  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [freeCancel, setFreeCancel] = useState(() =>
    String(props.initialSettings.ride.freeCancelMinutes),
  );
  const [waitMinutes, setWaitMinutes] = useState(() =>
    String(props.initialSettings.ride.waitMinutes),
  );
  const [searchRadius, setSearchRadius] = useState(() =>
    String(props.initialSettings.ride.searchRadiusKm),
  );

  const anyDirty = useMemo(
    () =>
      countChangedFields(saved, draft) > 0 ||
      freeCancel !== String(saved.ride.freeCancelMinutes) ||
      waitMinutes !== String(saved.ride.waitMinutes) ||
      searchRadius !== String(saved.ride.searchRadiusKm),
    [saved, draft, freeCancel, waitMinutes, searchRadius],
  );

  const dirtySections = useMemo(() => {
    const probe = (patch: Partial<PlatformSettingsDraft>): boolean =>
      countChangedFields(saved, { ...saved, ...patch }) > 0;
    return {
      general: probe({ general: draft.general }),
      cities: probe({ cities: draft.cities }),
      payments: probe({ payments: draft.payments }),
      ride:
        probe({ ride: draft.ride }) ||
        freeCancel !== String(saved.ride.freeCancelMinutes) ||
        waitMinutes !== String(saved.ride.waitMinutes) ||
        searchRadius !== String(saved.ride.searchRadiusKm),
      safety: probe({ safety: draft.safety }),
      integrations: probe({ integrations: draft.integrations }),
    } as Record<SettingSectionId, boolean>;
  }, [saved, draft, freeCancel, waitMinutes, searchRadius]);

  const errorSections = useMemo(() => {
    const result: Record<SettingSectionId, boolean> = {
      general: false, cities: false, payments: false,
      ride: false, safety: false, integrations: false,
    };
    if (!errors) return result;
    for (const section of SETTING_SECTIONS) {
      result[section.id] = Object.keys(errors[section.id]).length > 0;
    }
    return result;
  }, [errors]);

  useEffect(() => {
    if (!anyDirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [anyDirty]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  function changeSection(id: string) {
    if (!isSectionId(id)) return;
    setActiveSection(id);
    router.replace(`?section=${id}`, { scroll: false });
  }

  function patchGeneral(patch: GeneralPatch) {
    setDraft((current) => ({
      ...current,
      general: { ...current.general, ...patch },
    }));
    setErrors(null);
  }

  function handleLogoSelected(fileName: string, previewUrl: string) {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(previewUrl);
    setLogoError(null);
    setDraft((current) => ({
      ...current,
      general: { ...current.general, logoName: fileName },
    }));
    setErrors(null);
  }

  function handleExport() {
    const snapshot = draft;
    confirmedExport.requestExport("Confirm export", () => {
      downloadCsv("platform-settings.csv", buildPlatformSettingsCsv(snapshot));
    });
  }
  function openSaveConfirm() {
    const merged: PlatformSettingsDraft = {
      ...draft,
      ride: {
        ...draft.ride,
        freeCancelMinutes: Number(freeCancel) || 0,
        waitMinutes: Number(waitMinutes) || 0,
        searchRadiusKm: Number(searchRadius) || 0,
      },
    };
    const next = validateSettings(merged, maxCapacity);
    const firstBad = SETTING_SECTIONS.find(
      (section) => Object.keys(next[section.id]).length > 0,
    );
    if (firstBad) {
      setErrors(next);
      changeSection(firstBad.id);
      toast.error({
        title: "Fix the highlighted fields",
        description: "Review the errors before saving platform settings.",
      });
      return;
    }
    setErrors(null);
    setDraft(merged);
    setSaveError(null);
    setConfirmOpen(true);
  }

  async function handleConfirmSave(note: string) {
    setSaving(true);
    setSaveError(null);
    try {
      const changed = countChangedFields(saved, draft);
      const input = { settings: draft, changedFields: changed, note };
      await savePlatformSettings(input);
      setSaved(draft);
      setConfirmOpen(false);
      toast.success({ title: "Platform settings saved" });
    } catch {
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSaveCity(save: CitySave) {
    if (save.name === "") {
      setCityNameError("City name is required.");
      return;
    }
    const editingId = cityState?.city?.id;
    const duplicate = draft.cities.some(
      (city) =>
        city.name.trim().toLowerCase() === save.name.toLowerCase() &&
        city.id !== editingId,
    );
    if (duplicate) {
      setCityNameError("City names must be unique.");
      return;
    }
    setCityNameError(undefined);
    if (cityState?.city) {
      const id = cityState.city.id;
      setDraft((current) => ({
        ...current,
        cities: current.cities.map((city) =>
          city.id === id
            ? { ...city, name: save.name, status: save.status,
                serviceZones: save.serviceZones, restrictedZones: save.restrictedZones }
            : city,
        ),
      }));
      toast.success({ title: "City updated", description: "Save changes to apply." });
    } else {
      const slug = save.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      setDraft((current) => ({
        ...current,
        cities: [
          ...current.cities,
          { id: `city-${slug}`, name: save.name, status: save.status,
            serviceZones: save.serviceZones, restrictedZones: save.restrictedZones,
            boundaryName: `${save.name} core service area`, boundaryPoints: [] },
        ],
      }));
      toast.success({ title: "City added", description: "Save changes to apply." });
    }
    setCityState(null);
    setErrors(null);
  }

  // The Manage Boundaries drawer persists immediately (its own toast + audit
  // entry), so draft and saved both receive the boundary patch; dirty tracking
  // stays clean because countChangedFields ignores boundary fields.
  function handleSaveBoundary(save: BoundarySave) {
    if (!boundaryCityId) return;
    const id = boundaryCityId;
    const city = draft.cities.find((candidate) => candidate.id === id);
    if (!city) return;
    const apply = (cities: OperatingCity[]) =>
      cities.map((candidate) =>
        candidate.id === id
          ? { ...candidate, boundaryName: save.boundaryName, boundaryPoints: save.boundaryPoints }
          : candidate,
      );
    setDraft((current) => ({ ...current, cities: apply(current.cities) }));
    setSaved((current) => ({ ...current, cities: apply(current.cities) }));
    setBoundaryCityId(null);
    toast.success({
      title: "Boundaries saved",
      description: `${save.boundaryName} has been saved.`,
    });
  }

  function handleSaveIntegration(save: IntegrationSave) {
    if (!integrationId) return;
    const id = integrationId;
    setDraft((current) => ({
      ...current,
      integrations: current.integrations.map((integration) =>
        integration.id === id
          ? { ...integration, enabled: save.enabled,
              environment: save.environment, keyReplaced: save.keyReplaced }
          : integration,
      ),
    }));
    setIntegrationId(null);
    setErrors(null);
    toast.success({ title: "Integration updated", description: "Save changes to apply." });
  }
  const meta = SETTING_SECTIONS.find((s) => s.id === activeSection)
    ?? SETTING_SECTIONS[0];
  const editingIntegration = draft.integrations.find((i) => i.id === integrationId)
    ?? null;
  const boundaryCity = draft.cities.find((city) => city.id === boundaryCityId) ?? null;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Platform Settings"
        description="Configure platform-wide operations, safety and integrations."
        actions={
          <>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="size-4" aria-hidden="true" />
              Export
            </Button>
            <Button onClick={openSaveConfirm}>
              <Plus className="size-4" aria-hidden="true" />
              Save changes
            </Button>
          </>
        }
      />
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
        <nav aria-label="Settings sections" className="min-w-0 lg:col-span-1">
          <Card className="min-w-0 p-3">
            <ul className="flex gap-2 overflow-x-auto no-scrollbar lg:flex-col lg:overflow-visible">
              {SETTING_SECTIONS.map((section) => {
                const Icon = NAV_ICONS[section.id];
                const active = section.id === activeSection;
                return (
                  <li key={section.id} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      onClick={() => changeSection(section.id)}
                      aria-current={active ? "page" : undefined}
                      className={
                        "flex w-64 items-center gap-3 rounded-xl px-3 py-3 text-left " +
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:w-full " +
                        (active ? "bg-brand-soft" : "hover:bg-surface-muted")
                      }
                    >
                      <span
                        aria-hidden="true"
                        className={
                          "relative flex size-11 shrink-0 items-center justify-center rounded-xl " +
                          (active ? "bg-surface" : "bg-surface-muted")
                        }
                      >
                        <Icon className="size-5 text-brand" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                          {section.title}
                          {dirtySections[section.id] ? (
                            <span aria-label="Unsaved changes" className="size-1.5 rounded-full bg-brand" />
                          ) : null}
                          {errorSections[section.id] ? (
                            <span aria-label="Has errors" className="size-1.5 rounded-full bg-danger" />
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-muted">
                          {section.description}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </nav>
        <section aria-label={meta.title} className="min-w-0 lg:col-span-2">
          <Card className="min-w-0">
            <h2 className="text-lg font-normal text-ink">{meta.title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{meta.description}</p>
            <div className="my-2 h-px w-full bg-border" aria-hidden="true" />
            {activeSection === "general" ? (
              <GeneralPanel
                platformName={draft.general.platformName}
                supportEmail={draft.general.supportEmail}
                supportPhone={draft.general.supportPhone}
                currency={draft.general.currency}
                timezone={draft.general.timezone}
                savedCurrency={saved.general.currency}
                logoName={draft.general.logoName}
                logoPreview={logoPreview}
                logoError={logoError}
                errors={errors?.general ?? {}}
                onLogoSelected={handleLogoSelected}
                onLogoError={setLogoError}
                onChange={patchGeneral}
              />
            ) : null}
            {activeSection === "cities" ? (
              <CitiesPanel
                cities={draft.cities}
                errors={errors?.cities ?? {}}
                onManage={(city) => setBoundaryCityId(city.id)}
                onAdd={() => {
                  setCityNameError(undefined);
                  setCityState({ city: null });
                }}
              />
            ) : null}
            {activeSection === "payments" ? (
              <PaymentsPanel
                card={draft.payments.card}
                bankTransfer={draft.payments.bankTransfer}
                wallet={draft.payments.wallet}
                cash={draft.payments.cash}
                provider={draft.payments.provider}
                savedProvider={saved.payments.provider}
                refundWindow={draft.payments.refundWindow}
                errors={errors?.payments ?? {}}
                onToggle={(key, value) => {
                  setDraft((c) => ({ ...c, payments: { ...c.payments, [key]: value } }));
                  setErrors(null);
                }}
                onProvider={(value) => {
                  setDraft((c) => ({ ...c, payments: { ...c.payments, provider: value } }));
                  setErrors(null);
                }}
                onRefundWindow={(value) => {
                  setDraft((c) => ({ ...c, payments: { ...c.payments, refundWindow: value } }));
                  setErrors(null);
                }}
              />
            ) : null}
            {activeSection === "ride" ? (
              <RidePanel
                categoryNames={props.categoryNames}
                maxCapacity={draft.ride.maxCapacity}
                freeCancelMinutes={freeCancel}
                waitMinutes={waitMinutes}
                searchRadiusKm={searchRadius}
                errors={errors?.ride ?? {}}
                onCapacity={(value) => {
                  setDraft((c) => ({ ...c, ride: { ...c.ride, maxCapacity: value } }));
                  setErrors(null);
                }}
                onMinutes={(key, value) => {
                  if (key === "freeCancelMinutes") setFreeCancel(value);
                  else if (key === "waitMinutes") setWaitMinutes(value);
                  else setSearchRadius(value);
                  setErrors(null);
                }}
              />
            ) : null}
            {activeSection === "safety" ? (
              <SafetyPanel
                sosEscalation={draft.safety.sosEscalation}
                emergencyLine={draft.safety.emergencyLine}
                policeLine={draft.safety.policeLine}
                routing={draft.safety.routing}
                tripSharing={draft.safety.tripSharing}
                errors={errors?.safety ?? {}}
                onToggle={(key, value) => {
                  setDraft((c) => ({ ...c, safety: { ...c.safety, [key]: value } }));
                  setErrors(null);
                }}
                onText={(key, value) => {
                  setDraft((c) => ({ ...c, safety: { ...c.safety, [key]: value } }));
                  setErrors(null);
                }}
                onRouting={(value) => {
                  setDraft((c) => ({ ...c, safety: { ...c.safety, routing: value } }));
                  setErrors(null);
                }}
              />
            ) : null}
            {activeSection === "integrations" ? (
              <IntegrationsPanel
                integrations={draft.integrations}
                onConfigure={(integration) => setIntegrationId(integration.id)}
              />
            ) : null}
          </Card>
        </section>
      </div>
      <CityDrawer
        state={cityState}
        nameError={cityNameError}
        onClose={() => setCityState(null)}
        onSave={handleSaveCity}
      />
      {boundaryCity ? (
        <BoundaryDrawer
          key={boundaryCity.id}
          city={boundaryCity}
          onClose={() => setBoundaryCityId(null)}
          onSave={handleSaveBoundary}
        />
      ) : null}
      <IntegrationDrawer
        integration={editingIntegration}
        onClose={() => setIntegrationId(null)}
        onSave={handleSaveIntegration}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm save platform settings"
        description={CONFIRM_DESCRIPTION}
        noteLabel="Internal note"
        confirmTone="brand"
        loading={saving}
        error={saveError}
        onConfirm={handleConfirmSave}
        onCancel={() => {
          if (saving) return;
          setConfirmOpen(false);
          setSaveError(null);
        }}
      />
      {confirmedExport.dialog}
    </div>
  );
}
