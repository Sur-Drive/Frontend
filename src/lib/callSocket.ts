import { io, type Socket } from "socket.io-client";
import { passengerSession } from "../api/passenger/passengerSession";

const BASE_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  ""
)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/(rides|chat|call)$/, "");

let callSocket: Socket | null = null;

export type CallType = "voice" | "video";

export interface CallAck {
  success: boolean;
  callId?: string;
  type?: CallType;
  status?: string;
  calleeOnline?: boolean;
  iceServers?: RTCIceServer[];
  code?: string;
  error?: string;
  message?: string;
}

export interface IncomingCallPayload {
  callId: string;
  rideId: string;
  type: CallType;
  caller?: {
    id?: string;
    name?: string;
    profilePicture?: string | null;
  };
  iceServers?: RTCIceServer[];
}

export interface SignalPayload {
  callId: string;
  sdpType: "offer" | "answer";
  sdp: string;
}

export interface IceCandidatePayload {
  callId: string;
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export function getCallSocket(): Socket {
  if (!BASE_URL) {
    throw new Error(
      "VITE_SOCKET_URL or VITE_API_URL is missing.",
    );
  }

  if (!callSocket) {
    callSocket = io(`${BASE_URL}/call`, {
      path: "/socket.io",
      autoConnect: false,
      transports: ["websocket"],

      auth: (callback) => {
        callback({
          token: passengerSession.getAccessToken(),
        });
      },

      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
  }

  return callSocket;
}

export function connectCallSocket(): Socket {
  const socket = getCallSocket();

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectCallSocket(): void {
  callSocket?.removeAllListeners();
  callSocket?.disconnect();
  callSocket = null;
}

export function emitCallAck<T = CallAck>(
  socket: Socket,
  event: string,
  payload: Record<string, unknown>,
  timeout = 10000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (!socket.connected) {
      reject(new Error("Call socket is not connected."));
      return;
    }

    socket.timeout(timeout).emit(
      event,
      payload,
      (error: Error | null, response: T) => {
        if (error) {
          reject(
            new Error(
              `Call request timed out: ${event}`,
            ),
          );
          return;
        }

        resolve(response);
      },
    );
  });
}