import { useMutation, useQuery } from "@tanstack/react-query";
import {
  acceptRideMatch,
  cancelRide,
  completeRide,
  declineRideMatch,
  getEta,
  markArrived,
  markEnRoute,
  markInProgress,
  startRide,
  verifyPickupCode,
  type EtaParams,
} from "../api/driverRides";

export const useAcceptMatch = () => useMutation({ mutationFn: acceptRideMatch });
export const useDeclineMatch = () =>
  useMutation({
    mutationFn: (v: { rideId: string; reason?: string }) =>
      declineRideMatch(v.rideId, v.reason),
  });
export const useEnRoute = () => useMutation({ mutationFn: markEnRoute });
export const useArrived = () => useMutation({ mutationFn: markArrived });
export const useVerifyPickupCode = () =>
  useMutation({
    mutationFn: (v: { rideId: string; code: string }) =>
      verifyPickupCode(v.rideId, v.code),
  });
export const useStartRide = () => useMutation({ mutationFn: startRide });
export const useInProgress = () => useMutation({ mutationFn: markInProgress });
export const useCompleteRide = () => useMutation({ mutationFn: completeRide });
export const useCancelRide = () =>
  useMutation({
    mutationFn: (v: { rideId: string; reason?: string }) =>
      cancelRide(v.rideId, v.reason),
  });

export const useEta = (p: EtaParams | null) =>
  useQuery({
    queryKey: ["eta", p],
    queryFn: () => getEta(p as EtaParams),
    enabled: !!p,
    retry: false,
  });
