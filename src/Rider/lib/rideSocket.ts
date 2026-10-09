import { io, type Socket } from "socket.io-client";

const SOCKET_URL = "https://backend-production-01de.up.railway.app/rides";

let socket: Socket | null = null;
let users = 0;

/**
 * One shared Socket.IO connection to the /rides namespace.
 * Auth is the driver's login token ("token" in localStorage).
 * Call releaseRideSocket() when a screen is done with it.
 */
export function acquireRideSocket(): Socket {
  users += 1;
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: (cb) => cb({ token: localStorage.getItem("token") }), // fresh token on every reconnect
      transports: ["websocket"],
      reconnection: true,
    });
    socket.on("connected", (p) => console.log("[socket] authenticated", p));
    socket.on("connect_error", (e) => console.warn("[socket] connect_error", e.message));
    socket.on("disconnect", (r) => console.warn("[socket] disconnected:", r));
  }
  return socket;
}

export function releaseRideSocket() {
  users = Math.max(0, users - 1);
  if (users === 0 && socket) {
    socket.disconnect();
    socket = null;
  }
}
