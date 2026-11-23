import { toCsv } from "@/lib/csv";
import type { PlatformSettingsDraft } from "@/types/platform-settings";

// Deterministic mock: the design's values are the defaults.
export function getDefaultPlatformSettings(): PlatformSettingsDraft {
  return {
    general: {
      logoName: null,
      platformName: "SUR-DRIVEHT",
      supportEmail: "support@surdriveht.ng",
      supportPhone: "+234 700 SUR DRIVE",
      currency: "NGN — Nigerian Naira",
      timezone: "Africa/Lagos (WAT, UTC+1)",
    },
    cities: [
      {
        id: "city-lagos",
        name: "Lagos",
        serviceZones: 24,
        restrictedZones: 2,
        status: "Active",
        boundaryName: "Lagos core service area",
        boundaryPoints: [
          { x: 205, y: 85 },
          { x: 580, y: 55 },
          { x: 710, y: 245 },
          { x: 490, y: 330 },
          { x: 125, y: 275 },
        ],
      },
      {
        id: "city-abuja",
        name: "Abuja",
        serviceZones: 12,
        restrictedZones: 3,
        status: "Active",
        boundaryName: "Abuja core service area",
        boundaryPoints: [
          { x: 230, y: 110 },
          { x: 565, y: 75 },
          { x: 690, y: 235 },
          { x: 380, y: 315 },
        ],
      },
      {
        id: "city-port-harcourt",
        name: "Port Harcourt",
        serviceZones: 8,
        restrictedZones: 4,
        status: "Pilot",
        boundaryName: "Port Harcourt core service area",
        boundaryPoints: [
          { x: 260, y: 95 },
          { x: 600, y: 130 },
          { x: 655, y: 285 },
          { x: 330, y: 300 },
        ],
      },
    ],
    payments: {
      card: true,
      bankTransfer: true,
      wallet: true,
      cash: false,
      provider: "Paystack — Live",
      refundWindow: 25000,
    },
    ride: {
      maxCapacity: 7,
      freeCancelMinutes: 2,
      waitMinutes: 5,
      searchRadiusKm: 8,
    },
    safety: {
      sosEscalation: true,
      emergencyLine: "+234 700 911 0000",
      policeLine: "112",
      routing: "Safety Response — Lagos",
      tripSharing: true,
    },
    integrations: [
      {
        id: "int-maps",
        name: "Google Maps",
        purpose: "Maps & routing",
        initials: "Go",
        status: "Connected",
        enabled: true,
        environment: "Live",
        maskedKey: "••••••••m4k2",
        keyReplaced: false,
      },
      {
        id: "int-termii",
        name: "Termii",
        purpose: "OTP & SMS",
        initials: "Te",
        status: "Connected",
        enabled: true,
        environment: "Live",
        maskedKey: "••••••••t8qd",
        keyReplaced: false,
      },
      {
        id: "int-paystack",
        name: "Paystack",
        purpose: "Payment gateway",
        initials: "Pa",
        status: "Connected",
        enabled: true,
        environment: "Live",
        maskedKey: "••••••••p1xs",
        keyReplaced: false,
      },
      {
        id: "int-sendgrid",
        name: "SendGrid",
        purpose: "Transactional email",
        initials: "Se",
        status: "Connected",
        enabled: true,
        environment: "Live",
        maskedKey: "••••••••s7gd",
        keyReplaced: false,
      },
    ],
  };
}

// Flattened section/field/value export. Secrets stay masked: only the stored
// masked suffix is exported, and a staged replacement exports as a flag.
export function buildPlatformSettingsCsv(draft: PlatformSettingsDraft): string {
  const rows: (string | number)[][] = [
    ["General", "Platform logo", draft.general.logoName ?? "Default initial tile"],
    ["General", "Platform name", draft.general.platformName],
    ["General", "Support email", draft.general.supportEmail],
    ["General", "Support phone", draft.general.supportPhone],
    ["General", "Currency", draft.general.currency],
    ["General", "Timezone", draft.general.timezone],
  ];
  for (const city of draft.cities) {
    rows.push([
      "Cities & Service Areas",
      city.name,
      `${city.serviceZones} service zones • ${city.restrictedZones} restricted zones • ${city.status}`,
    ]);
  }
  rows.push(
    ["Payments", "Card payments", draft.payments.card ? "On" : "Off"],
    ["Payments", "Bank transfer", draft.payments.bankTransfer ? "On" : "Off"],
    ["Payments", "SUR Wallet", draft.payments.wallet ? "On" : "Off"],
    ["Payments", "Cash payments", draft.payments.cash ? "On" : "Off"],
    ["Payments", "Payment provider", draft.payments.provider],
    ["Payments", "Automatic refund window", `₦${draft.payments.refundWindow}`],
    ["Ride Settings", "Maximum vehicle capacity", `${draft.ride.maxCapacity} passengers`],
    ["Ride Settings", "Free cancellation window", `${draft.ride.freeCancelMinutes} minutes`],
    ["Ride Settings", "Driver waiting period", `${draft.ride.waitMinutes} minutes`],
    ["Ride Settings", "Maximum search radius", `${draft.ride.searchRadiusKm} kilometres`],
    ["Safety", "Automatic SOS escalation", draft.safety.sosEscalation ? "On" : "Off"],
    ["Safety", "Emergency response line", draft.safety.emergencyLine],
    ["Safety", "Nigeria Police emergency", draft.safety.policeLine],
    ["Safety", "Critical incident routing", draft.safety.routing],
    ["Safety", "Live trip sharing", draft.safety.tripSharing ? "On" : "Off"],
  );
  for (const integration of draft.integrations) {
    rows.push([
      "Integrations",
      integration.name,
      `${integration.enabled ? "Enabled" : "Disabled"} • ${integration.environment} • ${integration.keyReplaced ? "Key replaced (pending save)" : integration.maskedKey} • ${integration.status}`,
    ]);
  }
  return toCsv(["Section", "Field", "Value"], rows);
}
