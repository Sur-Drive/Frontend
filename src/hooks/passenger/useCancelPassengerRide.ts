import {
  useState,
} from "react";

import {
  toast,
} from "sonner";

import {
  useNavigate,
} from "react-router-dom";

import {
  passengerRideApi,
} from "../../api/passenger/rides";

import {
  clearActiveRide,
} from "../../utils/passengerActiveRide";

import {
  usePassengerRide,
} from "../../context/PassengerRideContext";

export function useCancelPassengerRide() {
  const navigate = useNavigate();

  const {
    setRideStatus,
  } = usePassengerRide();

  const [
    cancelling,
    setCancelling,
  ] = useState(false);

  const cancelRide = async (
    rideId: string,
    reason: string,
    comment?: string,
  ) => {
    if (cancelling) {
      return;
    }

    try {
      setCancelling(true);

      /*
       * Backend currently documents only:
       *
       * { reason: string }
       *
       * So merge the optional comment into
       * the reason rather than inventing a
       * "comment" request property.
       */
      const cancellationReason =
        comment?.trim()
          ? `${reason}: ${comment.trim()}`
          : reason;

      await passengerRideApi.cancelRide(
        rideId,
        cancellationReason,
      );

      clearActiveRide();

      setRideStatus("idle");

      toast.success(
        "Ride cancelled.",
      );

      navigate(
        "/passenger/home",
        {
          replace: true,
        },
      );
    } catch (error) {
      console.error(
        "CANCEL RIDE ERROR:",
        error,
      );

      toast.error(
        "Unable to cancel ride. Please try again.",
      );
    } finally {
      setCancelling(false);
    }
  };

  return {
    cancelRide,
    cancelling,
  };
}