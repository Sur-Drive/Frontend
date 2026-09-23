import type {
  SupportTicketPriority,
  SupportTicketStatus,
} from "../../../types/passengerSupport";

interface TicketStatusBadgeProps {
  type:
    | "status"
    | "priority";

  value:
    | SupportTicketStatus
    | SupportTicketPriority;
}

export default function TicketStatusBadge({
  type,
  value,
}: TicketStatusBadgeProps) {
  const styles =
    type === "status"
      ? value === "open"
        ? "bg-[#F1E8FA] text-[#7442AD]"
        : "bg-[#E8F7EE] text-[#2E9B62]"
      : value === "high"
        ? "bg-[#FFE8E8] text-[#E25353]"
        : value === "medium"
          ? "bg-[#FFF4D8] text-[#C99517]"
          : "bg-[#F2F1F3] text-[#817A85]";

  return (
    <span
      className={`
        inline-flex
        h-[25px]
        items-center
        justify-center
        rounded-full
        px-2.5
        text-[11px]
        font-medium
        capitalize
        ${styles}
      `}
    >
      {value}
    </span>
  );
}