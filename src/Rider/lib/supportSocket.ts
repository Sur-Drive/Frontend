import { io, type Socket } from "socket.io-client";

const SOCKET_URL = "https://backend-production-01de.up.railway.app/support";

let socket: Socket | null = null;
let users = 0;

/**
 * One shared Socket.IO connection to the /support namespace.
 * Auth is the driver's login token ("token" in localStorage), re-read on every
 * (re)connect so a refreshed token is used. Pair every acquire with a release.
 */
export function acquireSupportSocket(): Socket {
  users += 1;
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: (cb) => cb({ token: localStorage.getItem("token") }),
      transports: ["websocket"],
      reconnection: true,
    });
    socket.on("support_ready", (p) => console.log("[support-socket] ready", p));
    socket.on("connect_error", (e) =>
      console.warn("[support-socket] connect_error", e.message),
    );
    socket.on("disconnect", (r) =>
      console.warn("[support-socket] disconnected:", r),
    );
    // Errors also arrive in the send ack; this duplicate is only logged.
    socket.on("exception", (e) => console.warn("[support-socket] exception", e));
  }
  return socket;
}

export function releaseSupportSocket() {
  users = Math.max(0, users - 1);
  if (users === 0 && socket) {
    socket.disconnect();
    socket = null;
  }
}
