import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL;

let socket: Socket | null = null;

export function getRideSocket(token: string): Socket {
  if (!token.trim()) {
    throw new Error("A valid authentication token is required.");
  }

  if (!socket) {
    const baseUrl = SOCKET_URL.replace(/\/+$/, "");

    const namespaceUrl = baseUrl.endsWith("/rides")
      ? baseUrl
      : `${baseUrl}/rides`;

    socket = io(namespaceUrl, {
      autoConnect: false,
      transports: ["websocket"],
      auth: {
        token,
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  } else {
    socket.auth = { token };
  }

  return socket;
}

export function disconnectRideSocket() {
  socket?.disconnect();
  socket = null;
}