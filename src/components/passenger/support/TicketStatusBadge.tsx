import type {
  SupportTicketPriority,
  SupportTicketStatus,
} from "../../../api/passenger/support";

type TicketStatusBadgeProps =
  | {
      type: "status";
      value:
        SupportTicketStatus;
    }
  | {
      type: "priority";
      value:
        SupportTicketPriority;
    };

function getStatusStyles(
  status:
    SupportTicketStatus,
) {
  switch (status) {
    case "open":
      return {
        label: "Open",
        className:
          "bg-[#F1E9FA] text-[#7442AD]",
      };

    case "resolved":
      return {
        label:
          "Resolved",
        className:
          "bg-[#EAF7EF] text-[#2F8F57]",
      };

    case "closed":
      return {
        label:
          "Closed",
        className:
          "bg-[#F0EFF1] text-[#716B75]",
      };
  }
}

function getPriorityStyles(
  priority:
    SupportTicketPriority,
) {
  switch (priority) {
    case "low":
      return {
        label: "Low",
        className:
          "bg-[#EEF7F1] text-[#43845A]",
      };

    case "medium":
      return {
        label:
          "Medium",
        className:
          "bg-[#FFF5E6] text-[#C47A16]",
      };

    case "high":
      return {
        label: "High",
        className:
          "bg-[#FDECEC] text-[#D14C4C]",
      };
  }
}

export default function TicketStatusBadge(
  props:
    TicketStatusBadgeProps,
) {
  const config =
    props.type ===
    "status"
      ? getStatusStyles(
          props.value,
        )
      : getPriorityStyles(
          props.value,
        );

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-2.5
        py-1
        text-[11px]
        font-semibold
        capitalize
        ${config.className}
      `}
    >
      {config.label}
    </span>
  );
}

