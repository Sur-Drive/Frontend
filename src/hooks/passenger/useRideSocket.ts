import {
  useEffect,
  useRef,
  useState,
} from "react";

import { getRideSocket } from "../../lib/rideSocket";

import {
  passengerRideApi,
  type PassengerRideResponse,
} from "../../api/passenger/rides";

interface RideEventPayload {
  rideId?: string;
  id?: string;
  status?: string;
}

interface UseRideSocketOptions {
  rideId: string | null;
  token: string | null;
  onRideUpdate: (ride: PassengerRideResponse) => void;
  enabled?: boolean;
}

const RIDE_EVENTS = [
  "ride.driver_assigned",
  "ride.driver_en_route",
  "ride.driver_arrived",
  "ride.started",
  "ride.completed",
  "ride.cancelled",
  "ride.no_drivers_found",
  "ride.paid",
  "ride.payment_pending",
  "ride.payment_action_required",
  "ride.payment_failed",
  "ride.paid",
] as const;

export function useRideSocket({
  rideId,
  token,
  onRideUpdate,
  enabled = true,
}: UseRideSocketOptions) {
  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  const onRideUpdateRef = useRef(onRideUpdate);

  useEffect(() => {
    onRideUpdateRef.current = onRideUpdate;
  }, [onRideUpdate]);

  useEffect(() => {
    if (!enabled || !rideId || !token) {
      setConnected(false);
      return;
    }

    const socket = getRideSocket(token);

    let active = true;
    let refreshing = false;
    let refreshAgain = false;

    const refreshRide = async () => {
      if (!active) return;

      if (refreshing) {
        refreshAgain = true;
        return;
      }

      refreshing = true;

      try {
        do {
          refreshAgain = false;

          const response = await passengerRideApi.getRide(rideId);

          if (!active) return;

          onRideUpdateRef.current(response);
        } while (refreshAgain && active);
      } catch (error) {
        console.error("Ride socket refresh failed:", error);
      } finally {
        refreshing = false;
      }
    };

    const subscribe = () => {
      socket.emit("ride.subscribe", { rideId });
    };

    const onConnect = () => {
      if (!active) return;

      setConnected(true);
      setSocketError(null);

      subscribe();

      // Recover any ride updates missed while disconnected.
      void refreshRide();
    };

    const onDisconnect = () => {
      if (!active) return;

      setConnected(false);
    };

    const onConnectError = (error: Error) => {
      if (!active) return;

      setConnected(false);
      setSocketError(error.message);

      console.error("Ride socket connection failed:", error);
    };

    const onRideEvent = (payload: RideEventPayload) => {
      if (!active) return;

      const eventRideId = payload?.rideId ?? payload?.id;

      if (eventRideId !== rideId) return;

      void refreshRide();
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    RIDE_EVENTS.forEach((event) => {
      socket.on(event, onRideEvent);
    });

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    // Initial state recovery does not depend on socket connectivity.
    void refreshRide();

    return () => {
      active = false;

      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);

      RIDE_EVENTS.forEach((event) => {
        socket.off(event, onRideEvent);
      });
    };
  }, [rideId, token, enabled]);


  return {
    connected,
    socketError,
  };
}