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

let chatSocket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!BASE_URL) {
    throw new Error(
      "VITE_SOCKET_URL or VITE_API_URL is missing.",
    );
  }

  if (!chatSocket) {
    chatSocket = io(`${BASE_URL}/chat`, {
      path: "/socket.io",
      autoConnect: false,

      // Start with WebSocket to avoid the polling error.
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

  return chatSocket;
}

export function connectChatSocket(): Socket {
  const socket = getChatSocket();

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectChatSocket(): void {
  chatSocket?.removeAllListeners();
  chatSocket?.disconnect();
  chatSocket = null;
}