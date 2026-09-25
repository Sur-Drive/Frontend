import type {
  PassengerTripStatus,
} from "../../../types/passengerTrip";

type Props = {
  status: PassengerTripStatus;
};

export default function TripStatusBadge({
  status,
}: Props) {
  const completed =
    status === "completed";

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-3
        py-1.5
        text-[13px]
        font-semibold

        ${
          completed
            ? "bg-[#3FC76A] text-white"
            : "bg-[#FF624B] text-white"
        }
      `}
    >
      {completed
        ? "Completed"
        : "Cancelled"}
    </span>
  );
}