import { SideSheet } from "@/components/ui/SideSheet";
import { Button } from "@/components/ui/Button";
import type { NotificationCampaign } from "@/types/notifications";

export interface NotificationDetailsCard {
  label: string;
  value: string;
}

// Pre-built payload for a campaign row's detail drawer.
export interface NotificationDetailsData {
  title: string;
  // Reference + schedule line under the title, e.g. "NTF-2081 • 14 Jun, 9:00 AM".
  meta: string;
  cards: NotificationDetailsCard[];
  message: string;
}

// Six-card info grid + message content for a campaign row.
function detailsCards(input: {
  channel: string;
  recipients: string;
  status: string;
  created: string;
  sentOrScheduled: string;
  delivered: string;
}): NotificationDetailsCard[] {
  return [
    { label: "Channel", value: input.channel },
    { label: "Recipients", value: input.recipients },
    { label: "Delivery status", value: input.status },
    { label: "Created", value: input.created },
    { label: "Sent / scheduled", value: input.sentOrScheduled },
    { label: "Delivered", value: input.delivered },
  ];
}

export function buildCampaignDetails(
  campaign: NotificationCampaign,
): NotificationDetailsData {
  return {
    title: campaign.title,
    meta: `${campaign.ref} • ${campaign.schedule}`,
    cards: detailsCards({
      channel: campaign.channel,
      recipients: campaign.audience,
      status: campaign.status,
      created: campaign.created,
      sentOrScheduled: campaign.schedule,
      delivered: campaign.delivered,
    }),
    message: campaign.message,
  };
}

interface NotificationDetailsDrawerProps {
  // Null closes the drawer; the previous payload stays for the exit animation.
  details: NotificationDetailsData | null;
  onClose: () => void;
}

export function NotificationDetailsDrawer({
  details,
  onClose,
}: NotificationDetailsDrawerProps) {
  if (!details) return null;

  return (
    <SideSheet
      open
      onClose={onClose}
      eyebrow="NOTIFICATION DETAILS"
      title={details.title}
      subtitle={details.meta}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            className="h-11! flex-1 px-5! sm:flex-none"
          >
            Close
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {details.cards.map((card) => (
          <div key={card.label} className="rounded-xl bg-surface-muted p-4">
            <p className="text-xs text-ink-muted">{card.label}</p>
            <p className="mt-1 text-sm font-medium text-ink">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-6">
        <h3 className="text-base font-normal text-ink">Message content</h3>
        <div className="mt-3 border-t border-border pt-3">
          <p className="rounded-xl bg-surface-muted p-4 text-sm leading-relaxed text-ink-muted">
            {details.message}
          </p>
        </div>
      </section>
    </SideSheet>
  );
}