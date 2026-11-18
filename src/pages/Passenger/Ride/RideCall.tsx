import CallScreen from "../../../components/passenger/calls/CallScreen";
import IncomingCall from "../../../components/passenger/calls/IncomingCall";
import { useRideCall } from "../../../hooks/passenger/useRideCall";


export default function RideCall() {
  const { phase } = useRideCall();

  if (phase === "idle") {
    return null;
  }

  if (phase === "incoming") {
    return <IncomingCall />;
  }

  return <CallScreen />;
}