import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  connectCallSocket,
  emitCallAck,
  type CallAck,
  type CallType,
  type IncomingCallPayload,
  type SignalPayload,
  type IceCandidatePayload,
} from "../../lib/callSocket";

/* =========================================================
   TYPES
========================================================= */

export type CallPhase =
  | "idle"
  | "incoming"
  | "outgoing"
  | "connecting"
  | "active"
  | "ending";

export interface ActiveCall {
  callId: string;
  rideId: string;
  type: CallType;
  direction: "incoming" | "outgoing";
  counterpartName: string;
  counterpartPhoto: string | null;
  iceServers: RTCIceServer[];
}

export interface StartCallOptions {
  rideId: string;
  type: CallType;
  counterpartName?: string;
  counterpartPhoto?: string | null;
}

export interface RideCallContextValue {
  connected: boolean;
  socketError: string | null;
  error: string | null;

  phase: CallPhase;
  call: ActiveCall | null;

  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  muted: boolean;
  cameraEnabled: boolean;

  startedAt: string | null;

  startCall: (options: StartCallOptions) => Promise<void>;
  answerCall: (audioOnly?: boolean) => Promise<void>;

  declineCall: () => void;
  endCall: () => void;

  toggleMute: () => void;
  toggleCamera: () => void;

  clearError: () => void;
}

/* =========================================================
   CONTEXT
========================================================= */

const RideCallContext =
  createContext<RideCallContextValue | null>(null);

/* =========================================================
   HELPERS
========================================================= */

function getError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong with the call.";
}

function assertAck(
  response: CallAck,
  fallback: string,
): void {
  if (!response?.success) {
    throw new Error(
      response?.message ||
        response?.error ||
        response?.code ||
        fallback,
    );
  }
}

/* =========================================================
   PROVIDER
========================================================= */

export function RideCallProvider({
  children,
}: {
  children: ReactNode;
}) {
  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */

  const [connected, setConnected] = useState(false);

  const [socketError, setSocketError] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [phase, setPhase] =
    useState<CallPhase>("idle");

  const [call, setCall] =
    useState<ActiveCall | null>(null);

  const [localStream, setLocalStream] =
    useState<MediaStream | null>(null);

  const [remoteStream, setRemoteStream] =
    useState<MediaStream | null>(null);

  const [muted, setMuted] = useState(false);

  const [cameraEnabled, setCameraEnabled] =
    useState(false);

  const [startedAt, setStartedAt] =
    useState<string | null>(null);

  /* -------------------------------------------------------
     REFS
  ------------------------------------------------------- */

  const callRef = useRef<ActiveCall | null>(null);

  const phaseRef = useRef<CallPhase>("idle");

  const peerRef =
    useRef<RTCPeerConnection | null>(null);

  const localRef =
    useRef<MediaStream | null>(null);

  const remoteRef =
    useRef<MediaStream | null>(null);

  const pendingIceRef =
    useRef<RTCIceCandidateInit[]>([]);

  const outgoingIceRef =
    useRef<RTCIceCandidateInit[]>([]);

  const peerJoinedPendingRef = useRef(false);

  const negotiatingRef = useRef(false);

  const generationRef = useRef(0);

  /* -------------------------------------------------------
     STATE UPDATERS
  ------------------------------------------------------- */

  const updatePhase = useCallback(
    (next: CallPhase) => {
      phaseRef.current = next;
      setPhase(next);
    },
    [],
  );

  const updateCall = useCallback(
    (next: ActiveCall | null) => {
      callRef.current = next;
      setCall(next);
    },
    [],
  );

  /* -------------------------------------------------------
     CLEANUP
  ------------------------------------------------------- */

  const cleanup = useCallback(() => {
    generationRef.current += 1;

    const peer = peerRef.current;

    if (peer) {
      peer.ontrack = null;
      peer.onicecandidate = null;
      peer.onconnectionstatechange = null;
      peer.oniceconnectionstatechange = null;

      peer.close();
    }

    peerRef.current = null;

    localRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    localRef.current = null;
    remoteRef.current = null;

    pendingIceRef.current = [];
    outgoingIceRef.current = [];

    peerJoinedPendingRef.current = false;
    negotiatingRef.current = false;

    setLocalStream(null);
    setRemoteStream(null);

    setMuted(false);
    setCameraEnabled(false);

    setStartedAt(null);

    updateCall(null);
    updatePhase("idle");
  }, [updateCall, updatePhase]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /* -------------------------------------------------------
     MEDIA PERMISSIONS
  ------------------------------------------------------- */

  const acquireMedia = useCallback(
    async (type: CallType) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera and microphone access requires HTTPS or localhost.",
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,

          video:
            type === "video"
              ? {
                  facingMode: "user",
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                  frameRate: { ideal: 24 },
                }
              : false,
        });

      localRef.current = stream;
      setLocalStream(stream);

      setMuted(false);

      setCameraEnabled(
        stream
          .getVideoTracks()
          .some((track) => track.enabled),
      );

      return stream;
    },
    [],
  );

  /* -------------------------------------------------------
     REMOTE ICE BUFFER
  ------------------------------------------------------- */

  const flushRemoteIce = useCallback(async () => {
    const peer = peerRef.current;

    if (!peer?.remoteDescription) {
      return;
    }

    const candidates =
      pendingIceRef.current.splice(0);

    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(candidate);
      } catch (error) {
        console.warn(
          "[RideCall] Remote ICE candidate failed:",
          error,
        );
      }
    }
  }, []);

  /* -------------------------------------------------------
     OUTGOING ICE BUFFER
  ------------------------------------------------------- */

  const flushOutgoingIce = useCallback(() => {
    const current = callRef.current;

    const socket = connectCallSocket();

    if (!current || !socket.connected) {
      return;
    }

    const candidates =
      outgoingIceRef.current.splice(0);

    for (const candidate of candidates) {
      socket.emit("call_ice_candidate", {
        callId: current.callId,

        candidate: candidate.candidate,

        sdpMid: candidate.sdpMid ?? null,

        sdpMLineIndex:
          candidate.sdpMLineIndex ?? null,
      });
    }
  }, []);

  /* -------------------------------------------------------
     CREATE WEBRTC PEER CONNECTION
  ------------------------------------------------------- */

  const createPeer = useCallback(
    (
      iceServers: RTCIceServer[],
      stream: MediaStream,
    ) => {
      const previousPeer = peerRef.current;

      if (previousPeer) {
        previousPeer.close();
      }

      outgoingIceRef.current = [];

      const peer = new RTCPeerConnection({
        iceServers,
      });

      peerRef.current = peer;

      const remote = new MediaStream();

      remoteRef.current = remote;
      setRemoteStream(remote);

      /* Add local media tracks */

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      /* Receive remote media */

      peer.ontrack = (event) => {
        const incoming =
          event.streams[0] ??
          new MediaStream([event.track]);

        const currentRemote = remoteRef.current;

        if (!currentRemote) {
          return;
        }

        incoming.getTracks().forEach((track) => {
          const alreadyExists = currentRemote
            .getTracks()
            .some(
              (existing) =>
                existing.id === track.id,
            );

          if (!alreadyExists) {
            currentRemote.addTrack(track);
          }
        });

        setRemoteStream(
          new MediaStream(
            currentRemote.getTracks(),
          ),
        );
      };

      /* Send ICE candidates */

      peer.onicecandidate = ({ candidate }) => {
        if (!candidate) {
          return;
        }

        const item = candidate.toJSON();

        const current = callRef.current;

        const socket = connectCallSocket();

        if (current?.callId && socket.connected) {
          socket.emit("call_ice_candidate", {
            callId: current.callId,

            candidate: item.candidate,

            sdpMid: item.sdpMid ?? null,

            sdpMLineIndex:
              item.sdpMLineIndex ?? null,
          });
        } else {
          outgoingIceRef.current.push(item);
        }
      };

      /* ICE connection monitoring */

      peer.oniceconnectionstatechange = () => {
        if (
          peer.iceConnectionState === "failed"
        ) {
          setError(
            "The media connection failed. Check your network or TURN server configuration.",
          );
        }
      };

      /* Peer connection monitoring */

      peer.onconnectionstatechange = () => {
        if (
          peer.connectionState === "failed"
        ) {
          setError(
            "The call connection failed.",
          );
        }
      };

      return peer;
    },
    [],
  );

  /* -------------------------------------------------------
     SEND WEBRTC OFFER
  ------------------------------------------------------- */

  const sendOffer = useCallback(async () => {
    const current = callRef.current;

    const peer = peerRef.current;

    if (
      !current ||
      !peer ||
      current.direction !== "outgoing" ||
      negotiatingRef.current
    ) {
      return;
    }

    negotiatingRef.current = true;

    try {
      const socket = connectCallSocket();

      const offer = await peer.createOffer();

      await peer.setLocalDescription(offer);

      const response =
        await emitCallAck<CallAck>(
          socket,
          "call_offer",
          {
            callId: current.callId,
            sdpType: "offer",
            sdp: offer.sdp,
          },
        );

      assertAck(
        response,
        "Unable to send call offer.",
      );

      flushOutgoingIce();
    } catch (error) {
      setError(getError(error));
    } finally {
      negotiatingRef.current = false;
    }
  }, [flushOutgoingIce]);

  /* -------------------------------------------------------
     START OUTGOING CALL
  ------------------------------------------------------- */

  const startCall = useCallback(
    async ({
      rideId,
      type,
      counterpartName = "Your driver",
      counterpartPhoto = null,
    }: StartCallOptions) => {
      if (phaseRef.current !== "idle") {
        return;
      }

      setError(null);

      const socket = connectCallSocket();

      if (!socket.connected) {
        setError(
          "Calling is connecting. Please try again in a moment.",
        );

        return;
      }

      const generation =
        generationRef.current;

      updatePhase("outgoing");

      try {
        const stream =
          await acquireMedia(type);

        if (
          generation !==
          generationRef.current
        ) {
          stream
            .getTracks()
            .forEach((track) => track.stop());

          return;
        }

        const response =
          await emitCallAck<CallAck>(
            socket,
            "call_initiate",
            {
              rideId,
              type,
            },
          );

        assertAck(
          response,
          "Unable to start the call.",
        );

        if (!response.callId) {
          throw new Error(
            "The server did not return a call ID.",
          );
        }

        const next: ActiveCall = {
          callId: response.callId,
          rideId,
          type,
          direction: "outgoing",
          counterpartName,
          counterpartPhoto,
          iceServers:
            response.iceServers ?? [],
        };

        if (
          generation !==
          generationRef.current
        ) {
          socket.emit("call_cancel", {
            callId: response.callId,
          });

          return;
        }

        updateCall(next);

        createPeer(
          next.iceServers,
          stream,
        );

        flushOutgoingIce();

        if (
          peerJoinedPendingRef.current
        ) {
          peerJoinedPendingRef.current =
            false;

          updatePhase("connecting");

          void sendOffer();
        }
      } catch (error) {
        const message = getError(error);

        cleanup();

        setError(message);
      }
    },
    [
      acquireMedia,
      cleanup,
      createPeer,
      flushOutgoingIce,
      sendOffer,
      updateCall,
      updatePhase,
    ],
  );

  /* -------------------------------------------------------
     ANSWER INCOMING CALL
  ------------------------------------------------------- */

  const answerCall = useCallback(
    async (audioOnly = false) => {
      const current = callRef.current;

      if (
        !current ||
        current.direction !== "incoming" ||
        phaseRef.current !== "incoming"
      ) {
        return;
      }

      setError(null);

      updatePhase("connecting");

      const generation =
        generationRef.current;

      try {
        const mediaType: CallType =
          audioOnly
            ? "voice"
            : current.type;

        const stream =
          await acquireMedia(mediaType);

        if (
          generation !==
          generationRef.current
        ) {
          stream
            .getTracks()
            .forEach((track) => track.stop());

          return;
        }

        createPeer(
          current.iceServers,
          stream,
        );

        const response =
          await emitCallAck<CallAck>(
            connectCallSocket(),
            "call_join",
            {
              callId: current.callId,
            },
          );

        assertAck(
          response,
          "Unable to answer the call.",
        );

        flushOutgoingIce();
      } catch (error) {
        const message = getError(error);

        connectCallSocket().emit(
          "call_decline",
          {
            callId: current.callId,
          },
        );

        cleanup();

        setError(message);
      }
    },
    [
      acquireMedia,
      cleanup,
      createPeer,
      flushOutgoingIce,
      updatePhase,
    ],
  );

  /* -------------------------------------------------------
     DECLINE INCOMING CALL
  ------------------------------------------------------- */

  const declineCall = useCallback(() => {
    const current = callRef.current;

    if (!current) {
      return;
    }

    const socket = connectCallSocket();

    socket.emit("call_decline", {
      callId: current.callId,
    });

    cleanup();
  }, [cleanup]);

  /* -------------------------------------------------------
     END OR CANCEL CALL
  ------------------------------------------------------- */

  const endCall = useCallback(() => {
    const current = callRef.current;

    if (!current) {
      cleanup();
      return;
    }

    // Capture phase BEFORE changing it to "ending".
    const previousPhase =
      phaseRef.current;

    const socket = connectCallSocket();

    if (!socket.connected) {
      cleanup();
      return;
    }

    updatePhase("ending");

    const shouldCancel =
      current.direction === "outgoing" &&
      previousPhase !== "active";

    socket.emit(
      shouldCancel
        ? "call_cancel"
        : "call_end",
      {
        callId: current.callId,
      },
    );

    window.setTimeout(() => {
      if (
        callRef.current?.callId ===
        current.callId
      ) {
        cleanup();
      }
    }, 5000);
  }, [cleanup, updatePhase]);

  /* -------------------------------------------------------
     MUTE / UNMUTE
  ------------------------------------------------------- */

  const toggleMute = useCallback(() => {
    const track =
      localRef.current
        ?.getAudioTracks()[0];

    if (!track) {
      return;
    }

    track.enabled = !track.enabled;

    setMuted(!track.enabled);
  }, []);

  /* -------------------------------------------------------
     CAMERA ON / OFF
  ------------------------------------------------------- */

  const toggleCamera = useCallback(() => {
    const track =
      localRef.current
        ?.getVideoTracks()[0];

    if (!track) {
      return;
    }

    track.enabled = !track.enabled;

    setCameraEnabled(track.enabled);
  }, []);

  /* -------------------------------------------------------
     SOCKET EVENT LISTENERS
  ------------------------------------------------------- */

  useEffect(() => {
    const socket = connectCallSocket();

    /* Connection established */

    const onConnect = () => {
      setConnected(true);
      setSocketError(null);
    };

    /* Connection lost */

    const onDisconnect = () => {
      setConnected(false);

      if (
        phaseRef.current !== "idle"
      ) {
        cleanup();

        setError(
          "Call disconnected.",
        );
      }
    };

    /* Connection error */

    const onConnectError = (
      socketConnectionError: Error,
    ) => {
      setConnected(false);

      setSocketError(
        socketConnectionError.message,
      );
    };

    /* Incoming call */

    const onIncoming = (
      payload: IncomingCallPayload,
    ) => {
      if (
        phaseRef.current !== "idle"
      ) {
        return;
      }

      setError(null);

      updateCall({
        callId: payload.callId,
        rideId: payload.rideId,
        type: payload.type,

        direction: "incoming",

        counterpartName:
          payload.caller?.name ||
          "Your driver",

        counterpartPhoto:
          payload.caller
            ?.profilePicture ?? null,

        iceServers:
          payload.iceServers ?? [],
      });

      updatePhase("incoming");
    };

    /* Other participant joined */

    const onPeerJoined = () => {
      const current =
        callRef.current;

      if (
        phaseRef.current === "idle" ||
        (
          current &&
          current.direction !== "outgoing"
        )
      ) {
        return;
      }

      if (
        !current ||
        !peerRef.current
      ) {
        peerJoinedPendingRef.current =
          true;

        return;
      }

      updatePhase("connecting");

      void sendOffer();
    };

    /* Receive offer */

    const onOffer = async (
      payload: SignalPayload,
    ) => {
      const current =
        callRef.current;

      const peer =
        peerRef.current;

      if (
        !current ||
        !peer ||
        current.callId !==
          payload.callId ||
        current.direction !==
          "incoming"
      ) {
        return;
      }

      try {
        await peer.setRemoteDescription({
          type: "offer",
          sdp: payload.sdp,
        });

        await flushRemoteIce();

        const answer =
          await peer.createAnswer();

        await peer.setLocalDescription(
          answer,
        );

        const response =
          await emitCallAck<CallAck>(
            socket,
            "call_answer",
            {
              callId: current.callId,
              sdpType: "answer",
              sdp: answer.sdp,
            },
          );

        assertAck(
          response,
          "Unable to answer the offer.",
        );

        flushOutgoingIce();
      } catch (error) {
        setError(getError(error));
      }
    };

    /* Receive answer */

    const onAnswer = async (
      payload: SignalPayload,
    ) => {
      const current =
        callRef.current;

      const peer =
        peerRef.current;

      if (
        !current ||
        !peer ||
        current.callId !==
          payload.callId ||
        current.direction !==
          "outgoing"
      ) {
        return;
      }

      try {
        await peer.setRemoteDescription({
          type: "answer",
          sdp: payload.sdp,
        });

        await flushRemoteIce();
      } catch (error) {
        setError(getError(error));
      }
    };

    /* Receive ICE candidate */

    const onIce = async (
      payload: IceCandidatePayload,
    ) => {
      const current =
        callRef.current;

      if (
        !current ||
        current.callId !==
          payload.callId
      ) {
        return;
      }

      const candidate:
        RTCIceCandidateInit = {
          candidate:
            payload.candidate,

          sdpMid:
            payload.sdpMid,

          sdpMLineIndex:
            payload.sdpMLineIndex,
        };

      const peer =
        peerRef.current;

      if (
        !peer?.remoteDescription
      ) {
        pendingIceRef.current.push(
          candidate,
        );

        return;
      }

      try {
        await peer.addIceCandidate(
          candidate,
        );
      } catch (error) {
        console.warn(
          "[RideCall] ICE candidate error:",
          error,
        );
      }
    };

    /* Call active */

    const onActive = (
      payload: {
        callId?: string;
        startedAt?: string;
      },
    ) => {
      const current =
        callRef.current;

      if (
        !current ||
        (
          payload.callId &&
          payload.callId !==
            current.callId
        )
      ) {
        return;
      }

      setStartedAt(
        payload.startedAt ||
          new Date().toISOString(),
      );

      updatePhase("active");
    };

    /* Call ended / cancelled / failed */

    const onTerminal = (
      payload?: {
        callId?: string;
        code?: string;
        message?: string;
      },
    ) => {
      const current =
        callRef.current;

      if (
        current &&
        payload?.callId &&
        payload.callId !==
          current.callId
      ) {
        return;
      }

      const message =
        payload?.message ||
        payload?.code ||
        null;

      cleanup();

      if (message) {
        setError(message);
      }
    };

    /* Register connection listeners */

    socket.on(
      "connect",
      onConnect,
    );

    socket.on(
      "disconnect",
      onDisconnect,
    );

    socket.on(
      "connect_error",
      onConnectError,
    );

    /* Register call listeners */

    socket.on(
      "call_incoming",
      onIncoming,
    );

    socket.on(
      "call_peer_joined",
      onPeerJoined,
    );

    socket.on(
      "call_offer",
      onOffer,
    );

    socket.on(
      "call_answer",
      onAnswer,
    );

    socket.on(
      "call_ice_candidate",
      onIce,
    );

    socket.on(
      "call_active",
      onActive,
    );

    const terminalEvents = [
      "call_ended",
      "call_declined",
      "call_cancelled",
      "call_missed",
      "call_failed",
      "call_handled_elsewhere",
    ];

    terminalEvents.forEach(
      (event) => {
        socket.on(
          event,
          onTerminal,
        );
      },
    );

    if (socket.connected) {
      onConnect();
    }

    /* Cleanup listeners */

    return () => {
      socket.off(
        "connect",
        onConnect,
      );

      socket.off(
        "disconnect",
        onDisconnect,
      );

      socket.off(
        "connect_error",
        onConnectError,
      );

      socket.off(
        "call_incoming",
        onIncoming,
      );

      socket.off(
        "call_peer_joined",
        onPeerJoined,
      );

      socket.off(
        "call_offer",
        onOffer,
      );

      socket.off(
        "call_answer",
        onAnswer,
      );

      socket.off(
        "call_ice_candidate",
        onIce,
      );

      socket.off(
        "call_active",
        onActive,
      );

      terminalEvents.forEach(
        (event) => {
          socket.off(
            event,
            onTerminal,
          );
        },
      );

      cleanup();
    };
  }, [
    cleanup,
    flushOutgoingIce,
    flushRemoteIce,
    sendOffer,
    updateCall,
    updatePhase,
  ]);

  /* -------------------------------------------------------
     CONTEXT VALUE
  ------------------------------------------------------- */

  const contextValue: RideCallContextValue = {
    connected,
    socketError,
    error,

    phase,
    call,

    localStream,
    remoteStream,

    muted,
    cameraEnabled,

    startedAt,

    startCall,
    answerCall,

    declineCall,
    endCall,

    toggleMute,
    toggleCamera,

    clearError,
  };

  /* -------------------------------------------------------
     RETURN PROVIDER WITHOUT JSX
  ------------------------------------------------------- */

  return createElement(
    RideCallContext.Provider,
    {
      value: contextValue,
    },
    children,
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useRideCall(): RideCallContextValue {
  const context =
    useContext(RideCallContext);

  if (!context) {
    throw new Error(
      "useRideCall must be used inside RideCallProvider.",
    );
  }

  return context;
}

// import {
//   createContext,
//   useCallback,
//   useContext,
//   useEffect,
//   useRef,
//   useState,
//   type ReactNode,
// } from "react";

// import {
//   connectCallSocket,
//   emitCallAck,
//   type CallAck,
//   type CallType,
//   type IncomingCallPayload,
//   type SignalPayload,
//   type IceCandidatePayload,
// } from "../../lib/callSocket";

// type CallPhase =
//   | "idle"
//   | "incoming"
//   | "outgoing"
//   | "connecting"
//   | "active"
//   | "ending";

// interface ActiveCall {
//   callId: string;
//   rideId: string;
//   type: CallType;
//   direction: "incoming" | "outgoing";
//   counterpartName: string;
//   counterpartPhoto: string | null;
//   iceServers: RTCIceServer[];
// }

// interface StartCallOptions {
//   rideId: string;
//   type: CallType;
//   counterpartName?: string;
//   counterpartPhoto?: string | null;
// }

// interface RideCallContextValue {
//   connected: boolean;
//   socketError: string | null;
//   error: string | null;
//   phase: CallPhase;
//   call: ActiveCall | null;
//   localStream: MediaStream | null;
//   remoteStream: MediaStream | null;
//   muted: boolean;
//   cameraEnabled: boolean;
//   startedAt: string | null;

//   startCall: (options: StartCallOptions) => Promise<void>;
//   answerCall: (audioOnly?: boolean) => Promise<void>;
//   declineCall: () => void;
//   endCall: () => void;
//   toggleMute: () => void;
//   toggleCamera: () => void;
//   clearError: () => void;
// }

// const RideCallContext =
//   createContext<RideCallContextValue | null>(null);

// function getError(error: unknown): string {
//   return error instanceof Error
//     ? error.message
//     : "Something went wrong with the call.";
// }

// function assertAck(
//   response: CallAck,
//   fallback: string,
// ): void {
//   if (!response?.success) {
//     throw new Error(
//       response?.message ||
//         response?.error ||
//         response?.code ||
//         fallback,
//     );
//   }
// }

// export function RideCallProvider({
//   children,
// }: {
//   children: ReactNode;
// }) {
//   const [connected, setConnected] = useState(false);
//   const [socketError, setSocketError] =
//     useState<string | null>(null);

//   const [error, setError] =
//     useState<string | null>(null);

//   const [phase, setPhase] =
//     useState<CallPhase>("idle");

//   const [call, setCall] =
//     useState<ActiveCall | null>(null);

//   const [localStream, setLocalStream] =
//     useState<MediaStream | null>(null);

//   const [remoteStream, setRemoteStream] =
//     useState<MediaStream | null>(null);

//   const [muted, setMuted] = useState(false);
//   const [cameraEnabled, setCameraEnabled] =
//     useState(false);

//   const [startedAt, setStartedAt] =
//     useState<string | null>(null);

//   const callRef = useRef<ActiveCall | null>(null);
//   const phaseRef = useRef<CallPhase>("idle");
//   const peerRef = useRef<RTCPeerConnection | null>(null);
//   const localRef = useRef<MediaStream | null>(null);
//   const remoteRef = useRef<MediaStream | null>(null);

//   const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
//   const outgoingIceRef = useRef<RTCIceCandidateInit[]>([]);

//   const peerJoinedPendingRef = useRef(false);
//   const answeringRef = useRef(false);
//   const negotiatingRef = useRef(false);
//   const generationRef = useRef(0);

//   const updatePhase = useCallback((next: CallPhase) => {
//     phaseRef.current = next;
//     setPhase(next);
//   }, []);

//   const updateCall = useCallback(
//     (next: ActiveCall | null) => {
//       callRef.current = next;
//       setCall(next);
//     },
//     [],
//   );

//   const cleanup = useCallback(() => {
//     generationRef.current += 1;

//     peerRef.current?.close();
//     peerRef.current = null;

//     localRef.current
//       ?.getTracks()
//       .forEach((track) => track.stop());

//     localRef.current = null;
//     remoteRef.current = null;

//     pendingIceRef.current = [];
//     outgoingIceRef.current = [];

//     peerJoinedPendingRef.current = false;
//     answeringRef.current = false;
//     negotiatingRef.current = false;

//     setLocalStream(null);
//     setRemoteStream(null);
//     setMuted(false);
//     setCameraEnabled(false);
//     setStartedAt(null);

//     updateCall(null);
//     updatePhase("idle");
//   }, [updateCall, updatePhase]);

//   const clearError = useCallback(() => {
//     setError(null);
//   }, []);

//   const acquireMedia = useCallback(
//     async (type: CallType) => {
//       if (!navigator.mediaDevices?.getUserMedia) {
//         throw new Error(
//           "Camera and microphone access requires HTTPS or localhost.",
//         );
//       }

//       const stream =
//         await navigator.mediaDevices.getUserMedia({
//           audio: true,
//           video:
//             type === "video"
//               ? {
//                   facingMode: "user",
//                   width: { ideal: 640 },
//                   height: { ideal: 480 },
//                   frameRate: { ideal: 24 },
//                 }
//               : false,
//         });

//       localRef.current = stream;
//       setLocalStream(stream);

//       setMuted(false);
//       setCameraEnabled(
//         stream.getVideoTracks().some((track) => track.enabled),
//       );

//       return stream;
//     },
//     [],
//   );

//   const flushRemoteIce = useCallback(async () => {
//     const peer = peerRef.current;

//     if (!peer?.remoteDescription) return;

//     const candidates = pendingIceRef.current.splice(0);

//     for (const candidate of candidates) {
//       try {
//         await peer.addIceCandidate(candidate);
//       } catch (error) {
//         console.warn(
//           "[RideCall] Remote ICE candidate failed:",
//           error,
//         );
//       }
//     }
//   }, []);

//   const flushOutgoingIce = useCallback(() => {
//     const current = callRef.current;
//     const socket = connectCallSocket();

//     if (!current || !socket.connected) return;

//     const candidates = outgoingIceRef.current.splice(0);

//     for (const candidate of candidates) {
//       socket.emit("call_ice_candidate", {
//         callId: current.callId,
//         candidate: candidate.candidate,
//         sdpMid: candidate.sdpMid ?? null,
//         sdpMLineIndex: candidate.sdpMLineIndex ?? null,
//       });
//     }
//   }, []);

//   const createPeer = useCallback(
//     (
//       iceServers: RTCIceServer[],
//       stream: MediaStream,
//     ) => {
//       peerRef.current?.close();

//       pendingIceRef.current = [];
//       outgoingIceRef.current = [];

//       const peer = new RTCPeerConnection({
//         iceServers,
//       });

//       peerRef.current = peer;

//       const remote = new MediaStream();

//       remoteRef.current = remote;
//       setRemoteStream(remote);

//       stream.getTracks().forEach((track) => {
//         peer.addTrack(track, stream);
//       });

//       peer.ontrack = (event) => {
//         const incoming =
//           event.streams[0] ??
//           new MediaStream([event.track]);

//         const currentRemote = remoteRef.current;

//         if (!currentRemote) return;

//         incoming.getTracks().forEach((track) => {
//           if (
//             !currentRemote
//               .getTracks()
//               .some((existing) => existing.id === track.id)
//           ) {
//             currentRemote.addTrack(track);
//           }
//         });

//         setRemoteStream(
//           new MediaStream(currentRemote.getTracks()),
//         );
//       };

//       peer.onicecandidate = ({ candidate }) => {
//         if (!candidate) return;

//         const item = candidate.toJSON();
//         const current = callRef.current;
//         const socket = connectCallSocket();

//         if (current?.callId && socket.connected) {
//           socket.emit("call_ice_candidate", {
//             callId: current.callId,
//             candidate: item.candidate,
//             sdpMid: item.sdpMid ?? null,
//             sdpMLineIndex: item.sdpMLineIndex ?? null,
//           });
//         } else {
//           outgoingIceRef.current.push(item);
//         }
//       };

//       peer.oniceconnectionstatechange = () => {
//         if (peer.iceConnectionState === "failed") {
//           setError(
//             "The media connection failed. Check network connectivity and TURN server configuration.",
//           );
//         }
//       };

//       peer.onconnectionstatechange = () => {
//         if (peer.connectionState === "failed") {
//           setError("The call connection failed.");
//         }
//       };

//       return peer;
//     },
//     [],
//   );

//   const sendOffer = useCallback(async () => {
//     const current = callRef.current;
//     const peer = peerRef.current;

//     if (
//       !current ||
//       !peer ||
//       current.direction !== "outgoing" ||
//       negotiatingRef.current
//     ) {
//       return;
//     }

//     negotiatingRef.current = true;

//     try {
//       const socket = connectCallSocket();

//       const offer = await peer.createOffer();

//       await peer.setLocalDescription(offer);

//       const response = await emitCallAck<CallAck>(
//         socket,
//         "call_offer",
//         {
//           callId: current.callId,
//           sdpType: "offer",
//           sdp: offer.sdp,
//         },
//       );

//       assertAck(response, "Unable to send call offer.");
//       flushOutgoingIce();
//     } catch (error) {
//       setError(getError(error));
//     } finally {
//       negotiatingRef.current = false;
//     }
//   }, [flushOutgoingIce]);

//   const startCall = useCallback(
//     async ({
//       rideId,
//       type,
//       counterpartName = "Your driver",
//       counterpartPhoto = null,
//     }: StartCallOptions) => {
//       if (phaseRef.current !== "idle") return;

//       setError(null);

//       const socket = connectCallSocket();

//       if (!socket.connected) {
//         setError(
//           "Calling is connecting. Please try again in a moment.",
//         );
//         return;
//       }

//       const generation = generationRef.current;

//       updatePhase("outgoing");

//       try {
//         // Ask permission before creating the server call.
//         const stream = await acquireMedia(type);

//         if (generation !== generationRef.current) {
//           stream.getTracks().forEach((track) => track.stop());
//           return;
//         }

//         const response = await emitCallAck<CallAck>(
//           socket,
//           "call_initiate",
//           { rideId, type },
//         );

//         assertAck(response, "Unable to start the call.");

//         if (!response.callId) {
//           throw new Error("The server did not return a call ID.");
//         }

//         const next: ActiveCall = {
//           callId: response.callId,
//           rideId,
//           type,
//           direction: "outgoing",
//           counterpartName,
//           counterpartPhoto,
//           iceServers: response.iceServers ?? [],
//         };

//         if (generation !== generationRef.current) {
//           socket.emit("call_cancel", {
//             callId: response.callId,
//           });
//           return;
//         }

//         updateCall(next);
//         createPeer(next.iceServers, stream);
//         flushOutgoingIce();

//         if (peerJoinedPendingRef.current) {
//           peerJoinedPendingRef.current = false;
//           updatePhase("connecting");
//           void sendOffer();
//         }
//       } catch (error) {
//         setError(getError(error));
//         cleanup();
//       }
//     },
//     [
//       acquireMedia,
//       cleanup,
//       createPeer,
//       flushOutgoingIce,
//       sendOffer,
//       updateCall,
//       updatePhase,
//     ],
//   );

//   const answerCall = useCallback(
//     async (audioOnly = false) => {
//       const current = callRef.current;

//       if (
//         !current ||
//         current.direction !== "incoming" ||
//         phaseRef.current !== "incoming"
//       ) {
//         return;
//       }

//       answeringRef.current = true;
//       setError(null);
//       updatePhase("connecting");

//       const generation = generationRef.current;

//       try {
//         const mediaType: CallType =
//           audioOnly ? "voice" : current.type;

//         const stream = await acquireMedia(mediaType);

//         if (generation !== generationRef.current) {
//           stream.getTracks().forEach((track) => track.stop());
//           return;
//         }

//         createPeer(current.iceServers, stream);

//         const response = await emitCallAck<CallAck>(
//           connectCallSocket(),
//           "call_join",
//           { callId: current.callId },
//         );

//         assertAck(response, "Unable to answer the call.");

//         flushOutgoingIce();
//       } catch (error) {
//         setError(getError(error));

//         connectCallSocket().emit("call_decline", {
//           callId: current.callId,
//         });

//         cleanup();
//       }
//     },
//     [
//       acquireMedia,
//       cleanup,
//       createPeer,
//       flushOutgoingIce,
//       updatePhase,
//     ],
//   );

//   const declineCall = useCallback(() => {
//     const current = callRef.current;

//     if (!current) return;

//     connectCallSocket().emit("call_decline", {
//       callId: current.callId,
//     });

//     cleanup();
//   }, [cleanup]);

//   const endCall = useCallback(() => {
//     const current = callRef.current;

//     if (!current) {
//       cleanup();
//       return;
//     }

//     const socket = connectCallSocket();

//     if (!socket.connected) {
//       cleanup();
//       return;
//     }

//     updatePhase("ending");

//     socket.emit(
//       current.direction === "outgoing" &&
//         phaseRef.current !== "active"
//         ? "call_cancel"
//         : "call_end",
//       { callId: current.callId },
//     );

//     // Server normally sends call_ended/call_cancelled.
//     // Avoid leaving the UI stuck if that event is lost.
//     window.setTimeout(() => {
//       if (callRef.current?.callId === current.callId) {
//         cleanup();
//       }
//     }, 5000);
//   }, [cleanup, updatePhase]);

//   const toggleMute = useCallback(() => {
//     const track = localRef.current?.getAudioTracks()[0];

//     if (!track) return;

//     track.enabled = !track.enabled;
//     setMuted(!track.enabled);
//   }, []);

//   const toggleCamera = useCallback(() => {
//     const track = localRef.current?.getVideoTracks()[0];

//     if (!track) return;

//     track.enabled = !track.enabled;
//     setCameraEnabled(track.enabled);
//   }, []);

//   useEffect(() => {
//     const socket = connectCallSocket();

//     const onConnect = () => {
//       setConnected(true);
//       setSocketError(null);
//     };

//     const onDisconnect = () => {
//       setConnected(false);

//       // The backend does not support resuming active calls.
//       if (phaseRef.current !== "idle") {
//         setError("Call disconnected.");
//         cleanup();
//       }
//     };

//     const onConnectError = (error: Error) => {
//       setConnected(false);
//       setSocketError(error.message);
//     };

//     const onIncoming = (payload: IncomingCallPayload) => {
//       if (phaseRef.current !== "idle") return;

//       setError(null);

//       updateCall({
//         callId: payload.callId,
//         rideId: payload.rideId,
//         type: payload.type,
//         direction: "incoming",
//         counterpartName: payload.caller?.name || "Your driver",
//         counterpartPhoto:
//           payload.caller?.profilePicture ?? null,
//         iceServers: payload.iceServers ?? [],
//       });

//       updatePhase("incoming");
//     };

//     const onPeerJoined = () => {
//       const current = callRef.current;

//       if (
//         phaseRef.current === "idle" ||
//         (current && current.direction !== "outgoing")
//       ) {
//         return;
//       }

//       if (!current || !peerRef.current) {
//         peerJoinedPendingRef.current = true;
//         return;
//       }

//       updatePhase("connecting");
//       void sendOffer();
//     };

//     const onOffer = async (payload: SignalPayload) => {
//       const current = callRef.current;
//       const peer = peerRef.current;

//       if (
//         !current ||
//         !peer ||
//         current.callId !== payload.callId ||
//         current.direction !== "incoming"
//       ) {
//         return;
//       }

//       try {
//         await peer.setRemoteDescription({
//           type: "offer",
//           sdp: payload.sdp,
//         });

//         await flushRemoteIce();

//         const answer = await peer.createAnswer();

//         await peer.setLocalDescription(answer);

//         const response = await emitCallAck<CallAck>(
//           socket,
//           "call_answer",
//           {
//             callId: current.callId,
//             sdpType: "answer",
//             sdp: answer.sdp,
//           },
//         );

//         assertAck(response, "Unable to answer the offer.");
//         flushOutgoingIce();
//       } catch (error) {
//         setError(getError(error));
//       }
//     };

//     const onAnswer = async (payload: SignalPayload) => {
//       const current = callRef.current;
//       const peer = peerRef.current;

//       if (
//         !current ||
//         !peer ||
//         current.callId !== payload.callId ||
//         current.direction !== "outgoing"
//       ) {
//         return;
//       }

//       try {
//         await peer.setRemoteDescription({
//           type: "answer",
//           sdp: payload.sdp,
//         });

//         await flushRemoteIce();
//       } catch (error) {
//         setError(getError(error));
//       }
//     };

//     const onIce = async (payload: IceCandidatePayload) => {
//       const current = callRef.current;

//       if (!current || current.callId !== payload.callId) {
//         return;
//       }

//       const candidate: RTCIceCandidateInit = {
//         candidate: payload.candidate,
//         sdpMid: payload.sdpMid,
//         sdpMLineIndex: payload.sdpMLineIndex,
//       };

//       const peer = peerRef.current;

//       if (!peer?.remoteDescription) {
//         pendingIceRef.current.push(candidate);
//         return;
//       }

//       try {
//         await peer.addIceCandidate(candidate);
//       } catch (error) {
//         console.warn("[RideCall] ICE candidate error:", error);
//       }
//     };

//     const onActive = (payload: {
//       callId?: string;
//       startedAt?: string;
//     }) => {
//       const current = callRef.current;

//       if (
//         !current ||
//         (payload.callId && payload.callId !== current.callId)
//       ) {
//         return;
//       }

//       setStartedAt(
//         payload.startedAt || new Date().toISOString(),
//       );

//       updatePhase("active");
//     };

//     const onTerminal = (payload?: {
//       callId?: string;
//       code?: string;
//       message?: string;
//     }) => {
//       const current = callRef.current;

//       if (
//         current &&
//         payload?.callId &&
//         payload.callId !== current.callId
//       ) {
//         return;
//       }

//       if (payload?.code || payload?.message) {
//         setError(
//           payload.message || payload.code || "Call ended.",
//         );
//       }

//       cleanup();
//     };

//     socket.on("connect", onConnect);
//     socket.on("disconnect", onDisconnect);
//     socket.on("connect_error", onConnectError);

//     socket.on("call_incoming", onIncoming);
//     socket.on("call_peer_joined", onPeerJoined);
//     socket.on("call_offer", onOffer);
//     socket.on("call_answer", onAnswer);
//     socket.on("call_ice_candidate", onIce);
//     socket.on("call_active", onActive);

//     const terminalEvents = [
//       "call_ended",
//       "call_declined",
//       "call_cancelled",
//       "call_missed",
//       "call_failed",
//       "call_handled_elsewhere",
//     ];

//     terminalEvents.forEach((event) => {
//       socket.on(event, onTerminal);
//     });

//     if (socket.connected) {
//       onConnect();
//     }

//     return () => {
//       socket.off("connect", onConnect);
//       socket.off("disconnect", onDisconnect);
//       socket.off("connect_error", onConnectError);

//       socket.off("call_incoming", onIncoming);
//       socket.off("call_peer_joined", onPeerJoined);
//       socket.off("call_offer", onOffer);
//       socket.off("call_answer", onAnswer);
//       socket.off("call_ice_candidate", onIce);
//       socket.off("call_active", onActive);

//       terminalEvents.forEach((event) => {
//         socket.off(event, onTerminal);
//       });

//       cleanup();
//     };
//   }, [
//     cleanup,
//     flushOutgoingIce,
//     flushRemoteIce,
//     sendOffer,
//     updateCall,
//     updatePhase,
//   ]);

//   return (
//     <RideCallContext.Provider
//       value={{
//         connected,
//         socketError,
//         error,
//         phase,
//         call,
//         localStream,
//         remoteStream,
//         muted,
//         cameraEnabled,
//         startedAt,
//         startCall,
//         answerCall,
//         declineCall,
//         endCall,
//         toggleMute,
//         toggleCamera,
//         clearError,
//       }}
//     >
//       {children}
//     </RideCallContext.Provider>
//   );
// }

// export function useRideCall(): RideCallContextValue {
//   const context = useContext(RideCallContext);

//   if (!context) {
//     throw new Error(
//       "useRideCall must be used inside RideCallProvider.",
//     );
//   }

//   return context;
// }