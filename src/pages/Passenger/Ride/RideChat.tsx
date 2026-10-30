import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { AnimatePresence, motion } from "framer-motion";

import {
  ArrowLeft,
  Camera,
  CheckCheck,
  FileText,
  LoaderCircle,
  MessageCircle,
  Mic,
  Phone,
  Send,
  Video,
  X,
} from "lucide-react";

import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { usePassengerRide } from "../../../context/PassengerRideContext";

import {
  getStoredActiveRide,
  getStoredActiveRideId,
} from "../../../utils/passengerActiveRide";

import { useRideChat } from "../../../hooks/passenger/useRideChat";
import { useRideCall } from "../../../hooks/passenger/useRideCall";

import type { ChatMessage } from "../../../api/passenger/rideChat.api";

import { usePassengerProfile } from "../../../context/PassengerProfileContext";
import { passengerRideApi } from "../../../api/passenger/rides";

const quickReplies = [
  "Hello, where are you?",
  "I am outside",
  "I will be there soon",
  "Okay, thanks!",
];

type CallType = "voice" | "video";

function formatTime(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
}

function MessageContent({
  message,
}: {
  message: ChatMessage;
}) {
  const attachment = message.attachment;

  if (message.type === "image" && attachment) {
    return (
      <div>
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={attachment.thumbnailUrl || attachment.url}
            alt={attachment.originalName || "Image attachment"}
            loading="lazy"
            className="object-contain max-w-full max-h-72 rounded-xl"
          />
        </a>

        {message.content && (
          <p className="mt-2 whitespace-pre-wrap">
            {message.content}
          </p>
        )}
      </div>
    );
  }

  if (message.type === "audio" && attachment) {
    return (
      <div>
        <audio
          controls
          preload="none"
          src={attachment.url}
          className="max-w-full"
        />

        {message.content && (
          <p className="mt-2 whitespace-pre-wrap">
            {message.content}
          </p>
        )}
      </div>
    );
  }

  if (message.type === "file" && attachment) {
    return (
      <div>
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 underline underline-offset-2"
        >
          <FileText size={19} />

          <span className="break-all">
            {attachment.originalName || "Open attachment"}
          </span>
        </a>

        {message.content && (
          <p className="mt-2 whitespace-pre-wrap">
            {message.content}
          </p>
        )}
      </div>
    );
  }

  return (
    <span className="break-words whitespace-pre-wrap">
      {message.content}
    </span>
  );
}

function DriverAvatar({
  name,
  photo,
  size = "small",
}: {
  name: string;
  photo: string | null;
  size?: "small" | "large";
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [photo]);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEE7F5] font-semibold text-[#7442AD] ${
        size === "large"
          ? "h-16 w-16 text-[24px]"
          : "h-11 w-11 text-[17px]"
      }`}
    >
      {photo && !imageFailed ? (
        <img
          src={photo}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="object-cover w-full h-full"
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

export default function RideChat() {
  const navigate = useNavigate();
  const { ride } = usePassengerRide();

  const {
    userId,
    setAuthenticatedUserId,
  } = usePassengerProfile();

  const backendRide = getStoredActiveRide();

  const rideId =
    backendRide?.id ?? getStoredActiveRideId();

  const [resolvedUserId, setResolvedUserId] =
    useState<string | null>(null);

  const [identityLoading, setIdentityLoading] =
    useState(true);

  const [identityError, setIdentityError] =
    useState<string | null>(null);

  const [retryCount, setRetryCount] = useState(0);

  const routes: Record<string, string> = {
    "driver-assigned": "/passenger/ride/driver-assigned",
    "driver-en-route": "/passenger/ride/driver-en-route",
    "driver-arriving": "/passenger/ride/driver-en-route",
    "driver-arrived": "/passenger/ride/driver-arrived",
    "in-progress": "/passenger/ride/in-trip",
  };

  const handleBack = () => {
    navigate(
      routes[ride.status] || "/passenger/ride/in-trip",
    );
  };

  useEffect(() => {
    if (!rideId) {
      setIdentityLoading(false);
      return;
    }

    let cancelled = false;

    const resolveIdentity = async () => {
      setIdentityLoading(true);
      setIdentityError(null);

      try {
        const response =
          await passengerRideApi.getRide(rideId);

        if (cancelled) return;

        const riderId =
          typeof response.riderId === "string"
            ? response.riderId.trim()
            : "";

        if (!riderId) {
          throw new Error(
            "The ride response does not contain a passenger ID.",
          );
        }

        setResolvedUserId(riderId);
        setAuthenticatedUserId(riderId);
      } catch (error) {
        if (cancelled) return;

        if (userId) {
          setResolvedUserId(userId);
        } else {
          setResolvedUserId(null);

          setIdentityError(
            error instanceof Error
              ? error.message
              : "Unable to retrieve your passenger identity.",
          );
        }
      } finally {
        if (!cancelled) {
          setIdentityLoading(false);
        }
      }
    };

    void resolveIdentity();

    return () => {
      cancelled = true;
    };
  }, [
    rideId,
    retryCount,
    setAuthenticatedUserId,
    userId,
  ]);

  if (!rideId) {
    return (
      <Navigate
        to="/passenger/home"
        replace
      />
    );
  }

  // Keep the chat layout visible while resolving identity.
  if (identityLoading) {
    return (
      <InitialChatShell onBack={handleBack} />
    );
  }

  // Only show this error after identity resolution fails.
  if (!resolvedUserId) {
    return (
      <div className="flex h-[100dvh] flex-col bg-[#FAF9FB]">
        <header className="shrink-0 border-b border-[#EEEAF1] bg-white px-4 py-3">
          <div className="mx-auto flex max-w-[680px] items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#F6F3F8]"
              aria-label="Back to ride"
            >
              <ArrowLeft size={21} />
            </button>

            <h1 className="text-[16px] font-semibold text-[#302B34]">
              Ride conversation
            </h1>
          </div>
        </header>

        <main className="flex items-center justify-center flex-1 px-6">
          <div className="w-full max-w-sm text-center">
            <MessageCircle
              size={32}
              className="mx-auto text-[#7442AD]"
            />

            <h2 className="mt-5 text-[19px] font-semibold">
              Unable to open conversation
            </h2>

            <p className="mt-3 text-[13px] text-[#827985]">
              {identityError ||
                "We couldn't identify the passenger associated with this ride."}
            </p>

            <button
              type="button"
              onClick={() =>
                setRetryCount((value) => value + 1)
              }
              className="mt-6 h-12 w-full rounded-xl bg-[#7442AD] font-semibold text-white"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="mt-3 h-12 w-full text-[#817A85]"
            >
              Back to Ride
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <RideChatSession
      key={`${rideId}-${resolvedUserId}`}
      rideId={rideId}
      currentUserId={resolvedUserId}
      onBack={handleBack}
    />
  );
}

/* ======================================================
   RIDE CHAT SESSION
====================================================== */

interface RideChatSessionProps {
  rideId: string;
  currentUserId: string;
  onBack: () => void;
}

function RideChatSession({
  rideId,
  currentUserId,
  onBack,
}: RideChatSessionProps) {
  const chat = useRideChat({
    rideId,
    currentUserId,
  });

  const calling = useRideCall();

  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);

  const [attachmentKind, setAttachmentKind] =
    useState<"image" | "file">("image");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);

  const canSend = Boolean(
    chat.conversation?.messaging.canSend,
  );

  const canCall = Boolean(
    chat.conversation?.calling.canCall,
  );

  const profile = chat.conversation?.counterpart;

  const displayName =
    profile?.name ||
    profile?.firstName ||
    "Your driver";

  const photo =
    profile?.profilePicture ||
    profile?.photo ||
    profile?.avatarUrl ||
    null;

  const isInitialLoading =
    chat.loading && !chat.conversation;

  /* ======================================================
     AUTO SCROLL
  ====================================================== */

  useEffect(() => {
    if (chat.loading) return;

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chat.loading, chat.messages.length]);

  /* ======================================================
     RECORDING CLEANUP
  ====================================================== */

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;

      if (recorder?.state === "recording") {
        recorder.onstop = null;
        recorder.stop();
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, []);

  /* ======================================================
     SEND MESSAGE
  ====================================================== */

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canSend || !draft.trim()) return;

    const sent = await chat.send(draft);

    if (sent) {
      setDraft("");
      chat.stopTyping();
    }
  };

  /* ======================================================
     ATTACHMENTS
  ====================================================== */

  const chooseFile = (kind: "image" | "file") => {
    if (!canSend) return;

    setAttachmentKind(kind);

    const input = fileRef.current;

    if (!input) return;

    input.accept =
      kind === "image"
        ? "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
        : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";

    input.click();
  };

  const onFile = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (
      attachmentKind === "image" &&
      !file.type.startsWith("image/") &&
      !/\.(heic|heif)$/i.test(file.name)
    ) {
      toast.error("Please select an image.");
      return;
    }

    await chat.upload(file);
  };

  /* ======================================================
     VOICE NOTES
  ====================================================== */

  const startRecording = async () => {
    if (!canSend) return;

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      toast.error(
        "Voice recording is unavailable on this device.",
      );
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;

      const supportedType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );

      const recorder = supportedType
        ? new MediaRecorder(stream, {
            mimeType: supportedType,
          })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
        recorderRef.current = null;

        const duration =
          Date.now() - startedAtRef.current;

        if (duration > 300000) {
          toast.error(
            "Voice notes cannot exceed 5 minutes.",
          );
          return;
        }

        if (!chunksRef.current.length) return;

        const mime =
          recorder.mimeType || "audio/webm";

        const extension = mime.includes("mp4")
          ? "m4a"
          : mime.includes("ogg")
            ? "ogg"
            : "webm";

        const file = new File(
          [
            new Blob(chunksRef.current, {
              type: mime,
            }),
          ],
          `voice-note-${Date.now()}.${extension}`,
          { type: mime },
        );

        void chat.upload(file);
      };

      recorder.start();
      setRecording(true);
    } catch {
      toast.error(
        "Microphone permission was denied or the microphone is unavailable.",
      );
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }

    setRecording(false);
  };

  /* ======================================================
     VOICE / VIDEO CALLS
  ====================================================== */

  const startCall = async (type: CallType) => {
    if (!canCall) {
      toast.error(
        "Calls are unavailable for this ride.",
      );
      return;
    }

    if (!calling.connected) {
      toast.error(
        "Call connection is unavailable. Please try again.",
      );
      return;
    }

    await calling.startCall({
      rideId,
      type,
      counterpartName: displayName,
      counterpartPhoto: photo,
    });
  };

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#FAF9FB]">
      {/* ================================================
          HEADER — ALWAYS VISIBLE
      ================================================= */}

      <header className="z-20 shrink-0 border-b border-[#EEEAF1] bg-white/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[680px] items-center gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            aria-label="Back to ride"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#302B34] hover:bg-[#F6F3F8]"
          >
            <ArrowLeft size={21} />
          </motion.button>

          <div className="flex items-center flex-1 min-w-0 gap-3">
            {isInitialLoading ? (
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[#EEEAF1]" />
            ) : (
              <DriverAvatar
                name={displayName}
                photo={photo}
              />
            )}

            <div className="min-w-0">
              {isInitialLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-[#EEEAF1]" />
                  <div className="h-3 w-16 animate-pulse rounded bg-[#EEEAF1]" />
                </div>
              ) : (
                <>
                  <h1 className="truncate text-[16px] font-semibold text-[#302B34]">
                    {displayName}
                  </h1>

                  <p className="mt-0.5 text-[12px] text-[#96909A]">
                    {chat.otherTyping
                      ? "Typing..."
                      : chat.connected
                        ? "Online"
                        : chat.socketError
                          ? "Messaging available"
                          : "Connecting..."}
                  </p>
                </>
              )}
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => void startCall("voice")}
            disabled={
              !canCall ||
              !calling.connected ||
              calling.phase !== "idle"
            }
            aria-label="Voice call"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F2F7] text-[#7442AD] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Phone size={19} />
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => void startCall("video")}
            disabled={
              !canCall ||
              !calling.connected ||
              calling.phase !== "idle"
            }
            aria-label="Video call"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F2F7] text-[#7442AD] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Video size={19} />
          </motion.button>
        </div>
      </header>

      {/* ================================================
          CHAT AVAILABILITY
      ================================================= */}

      {chat.conversation && !canSend && (
        <div className="shrink-0 border-b border-amber-100 bg-amber-50 px-4 py-3 text-center text-[13px] text-amber-900">
          {chat.conversation.messaging.message ||
            "Messaging is no longer available for this ride."}
        </div>
      )}

      {/* ================================================
          MESSAGES — ONLY THIS AREA LOADS
      ================================================= */}

      <main
        className="flex-1 min-h-0 px-4 py-5 overflow-y-auto"
        aria-label="Ride conversation"
      >
        <div className="mx-auto flex w-full max-w-[680px] flex-col">
          {isInitialLoading ? (
            <ChatMessagesSkeleton />
          ) : (
            <>
              {chat.error && (
                <div className="mb-5 rounded-[14px] bg-red-50 p-4 text-[14px] text-red-700">
                  <p>{chat.error}</p>

                  <button
                    type="button"
                    onClick={() => void chat.refresh()}
                    className="mt-2 font-semibold underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {chat.hasMore && (
                <button
                  type="button"
                  disabled={chat.loadingMore}
                  onClick={() => void chat.loadMore()}
                  className="mb-5 self-center rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#7442AD] shadow-sm disabled:opacity-50"
                >
                  {chat.loadingMore
                    ? "Loading..."
                    : "Load older messages"}
                </button>
              )}

              {!chat.loading &&
                !chat.messages.length &&
                !chat.error && (
                  <div className="py-16 text-center">
                    <MessageCircle
                      size={30}
                      className="mx-auto text-[#C5B5D4]"
                    />

                    <p className="mt-4 text-[16px] font-semibold text-[#302B34]">
                      No messages yet
                    </p>

                    <p className="mt-2 text-[14px] text-[#96909A]">
                      {canSend
                        ? "Start a conversation with your driver."
                        : "There are no messages to display."}
                    </p>
                  </div>
                )}

              <AnimatePresence initial={false}>
                {chat.messages.map((item) => {
                  const mine =
                    item.senderId === currentUserId;

                  if (item.type === "system") {
                    return (
                      <motion.p
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mx-auto mb-5 max-w-[85%] rounded-full bg-[#EEEAF1] px-4 py-2 text-center text-[12px] text-[#776E7D]"
                      >
                        {item.content}
                      </motion.p>
                    );
                  }

                  const isRead =
                    mine &&
                    Boolean(chat.readAt) &&
                    new Date(item.createdAt).getTime() <=
                      new Date(
                        chat.readAt || "",
                      ).getTime();

                  return (
                    <motion.div
                      key={item.id}
                      initial={{
                        opacity: 0,
                        y: 10,
                        scale: 0.97,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      className={`mb-5 flex flex-col ${
                        mine
                          ? "items-end"
                          : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[82%] rounded-[20px] px-4 py-3 text-[14px] leading-6 ${
                          mine
                            ? "rounded-br-[6px] bg-[#7442AD] text-white"
                            : "rounded-bl-[6px] bg-white text-[#302B34] shadow-[0_5px_25px_rgba(30,20,38,0.05)]"
                        }`}
                      >
                        <MessageContent message={item} />
                      </div>

                      <p className="mt-1 flex items-center gap-1 px-1 text-[11px] text-[#AAA4AE]">
                        {formatTime(item.createdAt)}

                        {isRead && (
                          <CheckCheck
                            size={14}
                            className="text-[#7442AD]"
                          />
                        )}
                      </p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {chat.otherTyping && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-3 text-[12px] italic text-[#7442AD]"
                >
                  {displayName} is typing...
                </motion.p>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>
      </main>

      {/* ================================================
          COMPOSER — ALWAYS VISIBLE
      ================================================= */}

      <footer className="z-20 shrink-0 border-t border-[#EEEAF1] bg-white px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-[680px]">
          {/* QUICK REPLIES */}

          {isInitialLoading ? (
            <div className="flex gap-2 mb-3">
              <div className="h-8 w-24 animate-pulse rounded-full bg-[#F0ECF3]" />
              <div className="h-8 w-28 animate-pulse rounded-full bg-[#F0ECF3]" />
              <div className="h-8 w-20 animate-pulse rounded-full bg-[#F0ECF3]" />
            </div>
          ) : canSend ? (
            <div className="flex gap-2 pb-1 mb-3 overflow-x-auto">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  disabled={chat.sending}
                  onClick={() => void chat.send(reply)}
                  className="shrink-0 rounded-full border border-[#E7E1EA] px-4 py-2 text-[13px] text-[#514B55] disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>
          ) : null}

          {/* HIDDEN FILE INPUT */}

          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={(event) => void onFile(event)}
          />

          {/* ATTACHMENT CONTROLS */}

          {isInitialLoading ? (
            <div className="mb-3 flex items-center gap-4 text-[#C6B8D3]">
              <Camera size={21} />
              <FileText size={21} />
              <Mic size={21} />

              <span className="text-[12px] text-[#AAA3AD]">
                Loading conversation...
              </span>
            </div>
          ) : canSend ? (
            <div className="flex items-center gap-4 mb-3">
              <button
                type="button"
                onClick={() => chooseFile("image")}
                disabled={chat.uploading || recording}
                aria-label="Attach image"
                className="text-[#7442AD] disabled:opacity-40"
              >
                <Camera size={21} />
              </button>

              <button
                type="button"
                onClick={() => chooseFile("file")}
                disabled={chat.uploading || recording}
                aria-label="Attach document"
                className="text-[#7442AD] disabled:opacity-40"
              >
                <FileText size={21} />
              </button>

              <button
                type="button"
                onClick={
                  recording
                    ? stopRecording
                    : () => void startRecording()
                }
                disabled={chat.uploading}
                aria-label={
                  recording
                    ? "Stop and send voice note"
                    : "Record voice note"
                }
                className={
                  recording
                    ? "text-red-600"
                    : "text-[#7442AD]"
                }
              >
                {recording ? (
                  <X size={21} />
                ) : (
                  <Mic size={21} />
                )}
              </button>

              <p className="text-[12px] text-[#96909A]">
                {recording
                  ? "Recording — tap X to send"
                  : chat.uploading
                    ? "Uploading attachment..."
                    : "Photos, files & voice notes"}
              </p>
            </div>
          ) : null}

          {/* MESSAGE INPUT */}

          <form
            onSubmit={(event) => void submit(event)}
            className="flex min-h-[54px] items-center gap-2 rounded-full bg-[#F6F3F7] px-4 py-2"
          >
            <input
              value={draft}
              maxLength={1000}
              disabled={!canSend || chat.sending}
              onBlur={chat.stopTyping}
              onChange={(event) => {
                setDraft(event.target.value);

                if (event.target.value.trim()) {
                  chat.notifyTyping();
                } else {
                  chat.stopTyping();
                }
              }}
              placeholder={
                isInitialLoading
                  ? "Loading conversation..."
                  : canSend
                    ? "Write a message..."
                    : "Chat unavailable"
              }
              aria-label="Message"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-[#302B34] outline-none placeholder:text-[#AAA3AD] disabled:opacity-50"
            />

            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              disabled={
                !canSend ||
                !draft.trim() ||
                chat.sending
              }
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7442AD] text-white disabled:opacity-40"
            >
              {chat.sending ? (
                <LoaderCircle
                  size={19}
                  className="animate-spin"
                />
              ) : (
                <Send size={19} />
              )}
            </motion.button>
          </form>
        </div>
      </footer>
    </div>
  );
}

/* ======================================================
   CHAT MESSAGES SKELETON
====================================================== */

function ChatMessagesSkeleton() {
  return (
    <div
      className="flex flex-col gap-6 py-5"
      role="status"
      aria-label="Loading messages"
    >
      <div className="mx-auto h-5 w-24 animate-pulse rounded-full bg-[#EAE5EE]" />

      <div className="flex justify-start">
        <div className="max-w-[75%] space-y-2">
          <div className="h-[70px] w-[230px] max-w-[70vw] animate-pulse rounded-[20px] rounded-bl-[6px] bg-[#EEEAF1]" />
          <div className="h-3 w-12 animate-pulse rounded bg-[#EEEAF1]" />
        </div>
      </div>

      <div className="flex justify-end">
        <div className="flex max-w-[75%] flex-col items-end space-y-2">
          <div className="h-[52px] w-[180px] max-w-[65vw] animate-pulse rounded-[20px] rounded-br-[6px] bg-[#E4D8F0]" />
          <div className="h-3 w-12 animate-pulse rounded bg-[#EEEAF1]" />
        </div>
      </div>

      <div className="flex justify-start">
        <div className="space-y-2">
          <div className="h-[95px] w-[260px] max-w-[75vw] animate-pulse rounded-[20px] rounded-bl-[6px] bg-[#EEEAF1]" />
          <div className="h-3 w-12 animate-pulse rounded bg-[#EEEAF1]" />
        </div>
      </div>

      <div className="flex justify-end">
        <div className="flex flex-col items-end space-y-2">
          <div className="h-[45px] w-[140px] animate-pulse rounded-[20px] rounded-br-[6px] bg-[#E4D8F0]" />
          <div className="h-3 w-12 animate-pulse rounded bg-[#EEEAF1]" />
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   INITIAL CHAT SHELL
====================================================== */

interface InitialChatShellProps {
  onBack: () => void;
}

function InitialChatShell({
  onBack,
}: InitialChatShellProps) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#FAF9FB]">
      {/* HEADER */}

      <header className="z-20 shrink-0 border-b border-[#EEEAF1] bg-white/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[680px] items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to ride"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#302B34] hover:bg-[#F6F3F8]"
          >
            <ArrowLeft size={21} />
          </button>

          <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[#EEEAF1]" />

          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-[#EEEAF1]" />
            <div className="h-3 w-16 animate-pulse rounded bg-[#EEEAF1]" />
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F2F7] text-[#C6B8D3]">
            <Phone size={19} />
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F2F7] text-[#C6B8D3]">
            <Video size={19} />
          </div>
        </div>
      </header>

      {/* MESSAGES */}

      <main className="flex-1 min-h-0 px-4 py-5 overflow-y-auto">
        <div className="mx-auto w-full max-w-[680px]">
          <ChatMessagesSkeleton />
        </div>
      </main>

      {/* COMPOSER */}

      <footer className="shrink-0 border-t border-[#EEEAF1] bg-white px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-[680px]">
          <div className="flex gap-2 mb-3">
            <div className="h-8 w-24 animate-pulse rounded-full bg-[#F0ECF3]" />
            <div className="h-8 w-28 animate-pulse rounded-full bg-[#F0ECF3]" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-[#F0ECF3]" />
          </div>

          <div className="mb-3 flex items-center gap-4 text-[#C6B8D3]">
            <Camera size={21} />
            <FileText size={21} />
            <Mic size={21} />

            <span className="text-[12px] text-[#AAA3AD]">
              Loading conversation...
            </span>
          </div>

          <div className="flex min-h-[54px] items-center gap-2 rounded-full bg-[#F6F3F7] px-4 py-2">
            <input
              disabled
              placeholder="Loading conversation..."
              className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[#AAA3AD]"
            />

            <button
              type="button"
              disabled
              aria-label="Send message"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7442AD] text-white opacity-40"
            >
              <Send size={19} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface RideChatSessionProps {
  rideId: string;
  currentUserId: string;
  onBack: () => void;
}

// function RideChatSession({
//   rideId,
//   currentUserId,
//   onBack,
// }: RideChatSessionProps) {
//   const chat = useRideChat({
//     rideId,
//     currentUserId,
//   });

//   const calling = useRideCall();

//   const [draft, setDraft] = useState("");
//   const [recording, setRecording] = useState(false);

//   const [attachmentKind, setAttachmentKind] =
//     useState<"image" | "file">("image");

//   const bottomRef = useRef<HTMLDivElement | null>(null);
//   const fileRef = useRef<HTMLInputElement | null>(null);

//   const recorderRef = useRef<MediaRecorder | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);

//   const chunksRef = useRef<Blob[]>([]);
//   const startedAtRef = useRef(0);

//   const canSend =
//     Boolean(chat.conversation?.messaging.canSend);

//   const canCall =
//     Boolean(chat.conversation?.calling.canCall);

//   const profile = chat.conversation?.counterpart;

//   const displayName =
//     profile?.name ||
//     profile?.firstName ||
//     "Your driver";

//   const photo =
//     profile?.profilePicture ||
//     profile?.photo ||
//     profile?.avatarUrl ||
//     null;

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({
//       behavior: "smooth",
//     });
//   }, [chat.messages.length]);

//   useEffect(() => {
//     return () => {
//       const recorder = recorderRef.current;

//       if (recorder?.state === "recording") {
//         recorder.onstop = null;
//         recorder.stop();
//       }

//       streamRef.current
//         ?.getTracks()
//         .forEach((track) => track.stop());
//     };
//   }, []);

//   const submit = async (event: FormEvent) => {
//     event.preventDefault();

//     const sent = await chat.send(draft);

//     if (sent) {
//       setDraft("");
//     }
//   };

//   const chooseFile = (kind: "image" | "file") => {
//     setAttachmentKind(kind);

//     const input = fileRef.current;

//     if (!input) return;

//     input.accept =
//       kind === "image"
//         ? "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
//         : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";

//     input.click();
//   };

//   const onFile = async (
//     event: ChangeEvent<HTMLInputElement>,
//   ) => {
//     const file = event.target.files?.[0];

//     event.target.value = "";

//     if (!file) return;

//     if (
//       attachmentKind === "image" &&
//       !file.type.startsWith("image/") &&
//       !/\.(heic|heif)$/i.test(file.name)
//     ) {
//       toast.error("Please select an image.");
//       return;
//     }

//     await chat.upload(file);
//   };

//   const startRecording = async () => {
//     if (!canSend) return;

//     if (
//       !navigator.mediaDevices?.getUserMedia ||
//       typeof MediaRecorder === "undefined"
//     ) {
//       toast.error(
//         "Voice recording is unavailable on this device.",
//       );
//       return;
//     }

//     try {
//       const stream =
//         await navigator.mediaDevices.getUserMedia({
//           audio: true,
//         });

//       streamRef.current = stream;

//       const supportedType = [
//         "audio/webm;codecs=opus",
//         "audio/mp4",
//         "audio/ogg;codecs=opus",
//       ].find((type) =>
//         MediaRecorder.isTypeSupported(type),
//       );

//       const recorder = supportedType
//         ? new MediaRecorder(stream, {
//             mimeType: supportedType,
//           })
//         : new MediaRecorder(stream);

//       recorderRef.current = recorder;
//       chunksRef.current = [];
//       startedAtRef.current = Date.now();

//       recorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           chunksRef.current.push(event.data);
//         }
//       };

//       recorder.onstop = () => {
//         stream
//           .getTracks()
//           .forEach((track) => track.stop());

//         streamRef.current = null;

//         const duration =
//           Date.now() - startedAtRef.current;

//         if (duration > 300000) {
//           toast.error(
//             "Voice notes cannot exceed 5 minutes.",
//           );
//           return;
//         }

//         if (!chunksRef.current.length) return;

//         const mime =
//           recorder.mimeType || "audio/webm";

//         const extension = mime.includes("mp4")
//           ? "m4a"
//           : mime.includes("ogg")
//             ? "ogg"
//             : "webm";

//         const file = new File(
//           [
//             new Blob(chunksRef.current, {
//               type: mime,
//             }),
//           ],
//           `voice-note-${Date.now()}.${extension}`,
//           { type: mime },
//         );

//         void chat.upload(file);
//       };

//       recorder.start();
//       setRecording(true);
//     } catch {
//       toast.error(
//         "Microphone permission was denied or the microphone is unavailable.",
//       );
//     }
//   };

//   const stopRecording = () => {
//     if (recorderRef.current?.state === "recording") {
//       recorderRef.current.stop();
//     }

//     setRecording(false);
//   };

//   const startCall = async (type: CallType) => {
//     if (!canCall) {
//       toast.error(
//         "Calls are unavailable for this ride.",
//       );
//       return;
//     }

//     if (!calling.connected) {
//       toast.error(
//         "Call connection is unavailable. Please try again.",
//       );
//       return;
//     }

//     await calling.startCall({
//       rideId,
//       type,
//       counterpartName: displayName,
//       counterpartPhoto: photo,
//     });
//   };

//   return (
//     <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#FAF9FB]">
//       {/* HEADER */}

//       <header className="z-20 shrink-0 border-b border-[#EEEAF1] bg-white/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl">
//         <div className="mx-auto flex w-full max-w-[680px] items-center gap-3">
//           <motion.button
//             type="button"
//             whileTap={{ scale: 0.95 }}
//             onClick={onBack}
//             aria-label="Back to ride"
//             className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#302B34] hover:bg-[#F6F3F8]"
//           >
//             <ArrowLeft size={21} />
//           </motion.button>

//           <div className="flex items-center flex-1 min-w-0 gap-3">
//             <DriverAvatar
//               name={displayName}
//               photo={photo}
//             />

//             <div className="min-w-0">
//               <h1 className="truncate text-[16px] font-semibold text-[#302B34]">
//                 {displayName}
//               </h1>

//               <p className="mt-0.5 text-[12px] text-[#96909A]">
//                 {chat.otherTyping
//                   ? "Typing..."
//                   : chat.connected
//                     ? "Online"
//                     : chat.socketError
//                       ? "Messaging available"
//                       : "Connecting..."}
//               </p>
//             </div>
//           </div>

//           <motion.button
//             type="button"
//             whileTap={{ scale: 0.95 }}
//             onClick={() => void startCall("voice")}
//             disabled={
//               !canCall ||
//               !calling.connected ||
//               calling.phase !== "idle"
//             }
//             aria-label="Voice call"
//             className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F2F7] text-[#7442AD] disabled:cursor-not-allowed disabled:opacity-40"
//           >
//             <Phone size={19} />
//           </motion.button>

//           <motion.button
//             type="button"
//             whileTap={{ scale: 0.95 }}
//             onClick={() => void startCall("video")}
//             disabled={
//               !canCall ||
//               !calling.connected ||
//               calling.phase !== "idle"
//             }
//             aria-label="Video call"
//             className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F2F7] text-[#7442AD] disabled:cursor-not-allowed disabled:opacity-40"
//           >
//             <Video size={19} />
//           </motion.button>
//         </div>
//       </header>

//       {/* CHAT AVAILABILITY */}

//       {chat.conversation && !canSend && (
//         <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-center text-[13px] text-amber-900">
//           {chat.conversation.messaging.message ||
//             "Messaging is no longer available for this ride."}
//         </div>
//       )}

//       {/* MESSAGES */}

//       <main
//         className="flex-1 min-h-0 px-4 py-5 overflow-y-auto"
//         aria-label="Ride conversation"
//       >
//         <div className="mx-auto flex w-full max-w-[680px] flex-col">
//           {chat.loading && (
//             <div className="flex justify-center py-12 text-[#7442AD]">
//               <LoaderCircle
//                 size={28}
//                 className="animate-spin"
//               />
//             </div>
//           )}

//           {chat.error && (
//             <div className="mb-5 rounded-[14px] bg-red-50 p-4 text-[14px] text-red-700">
//               <p>{chat.error}</p>

//               <button
//                 type="button"
//                 onClick={() => void chat.refresh()}
//                 className="mt-2 font-semibold underline"
//               >
//                 Retry
//               </button>
//             </div>
//           )}

//           {chat.hasMore && (
//             <button
//               type="button"
//               disabled={chat.loadingMore}
//               onClick={() => void chat.loadMore()}
//               className="mb-5 self-center rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#7442AD] shadow-sm disabled:opacity-50"
//             >
//               {chat.loadingMore
//                 ? "Loading..."
//                 : "Load older messages"}
//             </button>
//           )}

//           {!chat.loading &&
//             !chat.messages.length &&
//             !chat.error && (
//               <div className="py-16 text-center">
//                 <p className="text-[16px] font-semibold text-[#302B34]">
//                   No messages yet
//                 </p>

//                 <p className="mt-2 text-[14px] text-[#96909A]">
//                   {canSend
//                     ? "Start a conversation with your driver."
//                     : "There are no messages to display."}
//                 </p>
//               </div>
//             )}

//           <AnimatePresence initial={false}>
//             {chat.messages.map((item) => {
//               const mine =
//                 item.senderId === currentUserId;

//               if (item.type === "system") {
//                 return (
//                   <motion.p
//                     key={item.id}
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     className="mx-auto mb-5 max-w-[85%] rounded-full bg-[#EEEAF1] px-4 py-2 text-center text-[12px] text-[#776E7D]"
//                   >
//                     {item.content}
//                   </motion.p>
//                 );
//               }

//               const isRead =
//                 mine &&
//                 Boolean(chat.readAt) &&
//                 new Date(item.createdAt).getTime() <=
//                   new Date(chat.readAt || "").getTime();

//               return (
//                 <motion.div
//                   key={item.id}
//                   initial={{
//                     opacity: 0,
//                     y: 10,
//                     scale: 0.97,
//                   }}
//                   animate={{
//                     opacity: 1,
//                     y: 0,
//                     scale: 1,
//                   }}
//                   className={`mb-5 flex flex-col ${
//                     mine ? "items-end" : "items-start"
//                   }`}
//                 >
//                   <div
//                     className={`max-w-[82%] rounded-[20px] px-4 py-3 text-[14px] leading-6 ${
//                       mine
//                         ? "rounded-br-[6px] bg-[#7442AD] text-white"
//                         : "rounded-bl-[6px] bg-white text-[#302B34] shadow-[0_5px_25px_rgba(30,20,38,0.05)]"
//                     }`}
//                   >
//                     <MessageContent message={item} />
//                   </div>

//                   <p className="mt-1 flex items-center gap-1 px-1 text-[11px] text-[#AAA4AE]">
//                     {formatTime(item.createdAt)}

//                     {isRead && (
//                       <CheckCheck
//                         size={14}
//                         className="text-[#7442AD]"
//                       />
//                     )}
//                   </p>
//                 </motion.div>
//               );
//             })}
//           </AnimatePresence>

//           {chat.otherTyping && (
//             <motion.p
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               className="mb-3 text-[12px] italic text-[#7442AD]"
//             >
//               {displayName} is typing...
//             </motion.p>
//           )}

//           <div ref={bottomRef} />
//         </div>
//       </main>

//       {/* MESSAGE COMPOSER */}

//       <footer className="shrink-0 border-t border-[#EEEAF1] bg-white px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
//         <div className="mx-auto w-full max-w-[680px]">
//           {canSend && (
//             <div className="flex gap-2 pb-1 mb-3 overflow-x-auto">
//               {quickReplies.map((reply) => (
//                 <button
//                   key={reply}
//                   type="button"
//                   disabled={chat.sending}
//                   onClick={() => void chat.send(reply)}
//                   className="shrink-0 rounded-full border border-[#E7E1EA] px-4 py-2 text-[13px] text-[#514B55] disabled:opacity-50"
//                 >
//                   {reply}
//                 </button>
//               ))}
//             </div>
//           )}

//           <input
//             ref={fileRef}
//             type="file"
//             hidden
//             onChange={(event) => void onFile(event)}
//           />

//           {canSend && (
//             <div className="flex items-center gap-4 mb-3">
//               <button
//                 type="button"
//                 onClick={() => chooseFile("image")}
//                 disabled={chat.uploading || recording}
//                 aria-label="Attach image"
//                 className="text-[#7442AD] disabled:opacity-40"
//               >
//                 <Camera size={21} />
//               </button>

//               <button
//                 type="button"
//                 onClick={() => chooseFile("file")}
//                 disabled={chat.uploading || recording}
//                 aria-label="Attach document"
//                 className="text-[#7442AD] disabled:opacity-40"
//               >
//                 <FileText size={21} />
//               </button>

//               <button
//                 type="button"
//                 onClick={
//                   recording
//                     ? stopRecording
//                     : () => void startRecording()
//                 }
//                 disabled={chat.uploading}
//                 aria-label={
//                   recording
//                     ? "Stop and send voice note"
//                     : "Record voice note"
//                 }
//                 className={
//                   recording
//                     ? "text-red-600"
//                     : "text-[#7442AD]"
//                 }
//               >
//                 {recording ? (
//                   <X size={21} />
//                 ) : (
//                   <Mic size={21} />
//                 )}
//               </button>

//               <p className="text-[12px] text-[#96909A]">
//                 {recording
//                   ? "Recording — tap X to send"
//                   : chat.uploading
//                     ? "Uploading attachment..."
//                     : "Photos, files & voice notes"}
//               </p>
//             </div>
//           )}

//           <form
//             onSubmit={(event) => void submit(event)}
//             className="flex min-h-[54px] items-center gap-2 rounded-full bg-[#F6F3F7] px-4 py-2"
//           >
//             <input
//               value={draft}
//               maxLength={1000}
//               disabled={!canSend || chat.sending}
//               onBlur={chat.stopTyping}
//               onChange={(event) => {
//                 setDraft(event.target.value);

//                 if (event.target.value.trim()) {
//                   chat.notifyTyping();
//                 } else {
//                   chat.stopTyping();
//                 }
//               }}
//               placeholder={
//                 canSend
//                   ? "Write a message..."
//                   : "Chat unavailable"
//               }
//               aria-label="Message"
//               className="min-w-0 flex-1 bg-transparent text-[16px] text-[#302B34] outline-none placeholder:text-[#AAA3AD] disabled:opacity-50"
//             />

//             <motion.button
//               type="submit"
//               whileTap={{ scale: 0.95 }}
//               disabled={
//                 !canSend ||
//                 !draft.trim() ||
//                 chat.sending
//               }
//               aria-label="Send message"
//               className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7442AD] text-white disabled:opacity-40"
//             >
//               {chat.sending ? (
//                 <LoaderCircle
//                   size={19}
//                   className="animate-spin"
//                 />
//               ) : (
//                 <Send size={19} />
//               )}
//             </motion.button>
//           </form>
//         </div>
//       </footer>
//     </div>
//   );
// }

// import {
//   useEffect,
//   useRef,
//   useState,
//   type ChangeEvent,
//   type FormEvent,
// } from "react";

// import { AnimatePresence, motion } from "framer-motion";

// import {
//   ArrowLeft,
//   Camera,
//   CheckCheck,
//   FileText,
//   LoaderCircle,
//   MessageCircle,
//   Mic,
//   Phone,
//   Send,
//   Video,
//   X,
// } from "lucide-react";

// import { Navigate, useNavigate } from "react-router-dom";
// import { toast } from "sonner";

// import { usePassengerRide } from "../../../context/PassengerRideContext";

// import {
//   getStoredActiveRide,
//   getStoredActiveRideId,
// } from "../../../utils/passengerActiveRide";

// import { useRideChat } from "../../../hooks/passenger/useRideChat";

// import type {
//   ChatMessage,
// } from "../../../api/passenger/rideChat.api";
// import { usePassengerProfile } from "../../../context/PassengerProfileContext";
// import { passengerRideApi } from "../../../api/passenger/rides";

// const quickReplies = [
//   "I am outside",
//   "I will be there soon",
//   "Okay, thanks!",
// ];

// type CallType = "voice" | "video";

// interface RideChatProps {
//   currentUserId: string;
//   onStartCall?: (
//     type: CallType,
//     rideId: string,
//   ) => void;
// }

// function formatTime(value: string) {
//   const date = new Date(value);

//   return Number.isNaN(date.getTime())
//     ? ""
//     : date.toLocaleTimeString([], {
//         hour: "2-digit",
//         minute: "2-digit",
//       });
// }

// function MessageContent({
//   message,
// }: {
//   message: ChatMessage;
// }) {
//   const attachment = message.attachment;

//   if (message.type === "image" && attachment) {
//     return (
//       <div>
//         <a
//           href={attachment.url}
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <img
//             src={
//               attachment.thumbnailUrl ||
//               attachment.url
//             }
//             alt={
//               attachment.originalName ||
//               "Image attachment"
//             }
//             loading="lazy"
//             className="object-contain max-w-full max-h-72 rounded-xl"
//           />
//         </a>

//         {message.content && (
//           <p className="mt-2 whitespace-pre-wrap">
//             {message.content}
//           </p>
//         )}
//       </div>
//     );
//   }

//   if (message.type === "audio" && attachment) {
//     return (
//       <div>
//         <audio
//           controls
//           preload="none"
//           src={attachment.url}
//           className="max-w-full"
//         />

//         {message.content && (
//           <p className="mt-2 whitespace-pre-wrap">
//             {message.content}
//           </p>
//         )}
//       </div>
//     );
//   }

//   if (message.type === "file" && attachment) {
//     return (
//       <div>
//         <a
//           href={attachment.url}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="flex items-center gap-2 underline underline-offset-2"
//         >
//           <FileText size={19} />
//           <span className="break-all">
//             {attachment.originalName ||
//               "Open attachment"}
//           </span>
//         </a>

//         {message.content && (
//           <p className="mt-2 whitespace-pre-wrap">
//             {message.content}
//           </p>
//         )}
//       </div>
//     );
//   }

//   return (
//     <span className="break-words whitespace-pre-wrap">
//       {message.content}
//     </span>
//   );
// }

// export default function RideChat({
//   onStartCall,
// }: {
//   onStartCall?: (
//     type: "voice" | "video",
//     rideId: string,
//   ) => void;
// }) {
//   const navigate = useNavigate();

//   const { ride } = usePassengerRide();

//   const {
//     userId,
//     setAuthenticatedUserId,
//   } = usePassengerProfile();

//   const backendRide = getStoredActiveRide();

//   const rideId =
//     backendRide?.id ??
//     getStoredActiveRideId();

//   const [resolvedUserId, setResolvedUserId] =
//     useState<string | null>(null);

//   const [identityLoading, setIdentityLoading] =
//     useState(true);

//   const [identityError, setIdentityError] =
//     useState<string | null>(null);

//   const [retryCount, setRetryCount] =
//     useState(0);

//   useEffect(() => {
//     if (!rideId) {
//       setIdentityLoading(false);
//       return;
//     }

//      // The passenger identity has already been resolved
//   // for this mounted chat session.
//   if (resolvedUserId && retryCount === 0) {
//     return;
//   }

//     let cancelled = false;

//     const resolvePassengerIdentity = async () => {
//       setIdentityLoading(true);
//       setIdentityError(null);

//       try {
//         // Retrieve the ride using the authenticated
//         // passenger API client.
//         const response =
//           await passengerRideApi.getRide(rideId);

//         if (cancelled) return;

//         const riderId =
//           typeof response.riderId === "string"
//             ? response.riderId.trim()
//             : "";

//         if (!riderId) {
//           throw new Error(
//             "The ride response does not contain a passenger ID.",
//           );
//         }

//         // Use the backend-provided rider ID.
//         setResolvedUserId(riderId);

//         // Keep the existing passenger context in sync.
//         setAuthenticatedUserId(riderId);
//       } catch (error) {
//         if (cancelled) return;

//         console.error(
//           "[RideChat] Passenger identity error:",
//           error,
//         );

//         // An ID already established by the authentication
//         // flow can be used if the ride lookup fails.
//         if (userId) {
//           setResolvedUserId(userId);
//         } else {
//           setResolvedUserId(null);

//           setIdentityError(
//             error instanceof Error
//               ? error.message
//               : "Unable to retrieve your passenger identity.",
//           );
//         }
//       } finally {
//         if (!cancelled) {
//           setIdentityLoading(false);
//         }
//       }
//     };

//     void resolvePassengerIdentity();

//     return () => {
//       cancelled = true;
//     };
//   }, [
//     rideId,
//     retryCount,
//     resolvedUserId,
//     setAuthenticatedUserId,
//     userId,
//   ]);

//   if (!rideId) {
//     return (
//       <Navigate
//         to="/passenger/home"
//         replace
//       />
//     );
//   }

//   if (identityLoading) {
//     return (
//       <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAF9FB] px-6">
//         <div className="text-center">
//           <LoaderCircle
//             size={30}
//             className="mx-auto animate-spin text-[#7442AD]"
//           />

//           <h2 className="mt-5 text-[16px] font-semibold text-[#302B34]">
//             Opening your conversation
//           </h2>

//           <p className="mt-2 text-[13px] text-[#918B95]">
//             Connecting you with your driver...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (!resolvedUserId) {
//     return (
//       <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAF9FB] px-6">
//         <div className="w-full max-w-sm text-center">
//           <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F0E8F8] text-[#7442AD]">
//             <MessageCircle size={25} />
//           </div>

//           <h2 className="mt-5 text-[19px] font-semibold text-[#302B34]">
//             Unable to open conversation
//           </h2>

//           <p className="mt-3 text-[13px] leading-6 text-[#827985]">
//             {identityError ??
//               "We couldn't identify the passenger associated with this ride."}
//           </p>

//           <button
//             type="button"
//             onClick={() =>
//               setRetryCount((previous) => previous + 1)
//             }
//             className="mt-6 h-[48px] w-full rounded-xl bg-[#7442AD] text-[14px] font-semibold text-white"
//           >
//             Try Again
//           </button>

//           <button
//             type="button"
//             onClick={() => navigate(-1)}
//             className="mt-3 h-[44px] w-full text-[14px] font-medium text-[#817A85]"
//           >
//             Back to Ride
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const routes: Record<string, string> = {
//     "driver-assigned":
//       "/passenger/ride/driver-assigned",

//     "driver-en-route":
//       "/passenger/ride/driver-en-route",

//     "driver-arriving":
//       "/passenger/ride/driver-en-route",

//     "driver-arrived":
//       "/passenger/ride/driver-arrived",

//     "in-progress":
//       "/passenger/ride/in-trip",
//   };

//   return (
//     <RideChatSession
//       key={`${rideId}-${resolvedUserId}`}
//       rideId={rideId}
//       currentUserId={resolvedUserId}
//       onStartCall={onStartCall}
//       onBack={() =>
//         navigate(
//           routes[ride.status] ??
//             "/passenger/ride/in-trip",
//         )
//       }
//     />
//   );
// }

// interface RideChatSessionProps
//   extends RideChatProps {
//   rideId: string;
//   onBack: () => void;
// }

// function RideChatSession({
//   rideId,
//   currentUserId,
//   onStartCall,
//   onBack,
// }: RideChatSessionProps) {
//   const chat = useRideChat({
//     rideId,
//     currentUserId,
//   });

//   const [draft, setDraft] = useState("");
//   const [recording, setRecording] =
//     useState(false);

//   const [attachmentKind, setAttachmentKind] =
//     useState<"image" | "file">("image");

//   const bottomRef =
//     useRef<HTMLDivElement | null>(null);

//   const fileRef =
//     useRef<HTMLInputElement | null>(null);

//   const recorderRef =
//     useRef<MediaRecorder | null>(null);

//   const streamRef =
//     useRef<MediaStream | null>(null);

//   const chunksRef = useRef<Blob[]>([]);
//   const startedAtRef = useRef(0);

//   const canSend =
//     Boolean(chat.conversation?.messaging.canSend);

//   const canCall =
//     Boolean(chat.conversation?.calling.canCall);

//   const profile = chat.conversation?.counterpart;

//   const displayName =
//     profile?.firstName ||
//     profile?.name ||
//     "Your driver";

//   const photo =
//   profile?.profilePicture ||
//   profile?.photo ||
//   profile?.avatarUrl ||
//   null;

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({
//       behavior: "smooth",
//     });
//   }, [chat.messages.length]);

//   useEffect(() => {
//     return () => {
//       const recorder = recorderRef.current;

//       if (recorder && recorder.state === "recording") {
//         recorder.onstop = null;
//         recorder.stop();
//       }

//       streamRef.current
//         ?.getTracks()
//         .forEach((track) => track.stop());
//     };
//   }, []);

//   const submit = async (event: FormEvent) => {
//     event.preventDefault();

//     const sent = await chat.send(draft);

//     if (sent) {
//       setDraft("");
//     }
//   };

//   const chooseFile = (
//     kind: "image" | "file",
//   ) => {
//     setAttachmentKind(kind);

//     const input = fileRef.current;

//     if (!input) return;

//     input.accept =
//       kind === "image"
//         ? "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
//         : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";

//     input.click();
//   };

//   const onFile = async (
//     event: ChangeEvent<HTMLInputElement>,
//   ) => {
//     const file = event.target.files?.[0];

//     event.target.value = "";

//     if (!file) return;

//     if (
//       attachmentKind === "image" &&
//       !file.type.startsWith("image/") &&
//       !/\.(heic|heif)$/i.test(file.name)
//     ) {
//       toast.error("Please select an image.");
//       return;
//     }

//     await chat.upload(file);
//   };

//   const startRecording = async () => {
//     if (!canSend) return;

//     if (
//       !navigator.mediaDevices?.getUserMedia ||
//       typeof MediaRecorder === "undefined"
//     ) {
//       toast.error(
//         "Voice recording is unavailable on this device.",
//       );
//       return;
//     }

//     try {
//       const stream =
//         await navigator.mediaDevices.getUserMedia({
//           audio: true,
//         });

//       streamRef.current = stream;

//       const supportedType = [
//         "audio/webm;codecs=opus",
//         "audio/mp4",
//         "audio/ogg;codecs=opus",
//       ].find((type) =>
//         MediaRecorder.isTypeSupported(type),
//       );

//       const recorder = supportedType
//         ? new MediaRecorder(stream, {
//             mimeType: supportedType,
//           })
//         : new MediaRecorder(stream);

//       recorderRef.current = recorder;
//       chunksRef.current = [];
//       startedAtRef.current = Date.now();

//       recorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           chunksRef.current.push(event.data);
//         }
//       };

//       recorder.onstop = () => {
//         stream
//           .getTracks()
//           .forEach((track) => track.stop());

//         streamRef.current = null;

//         const duration =
//           Date.now() - startedAtRef.current;

//         if (duration > 300000) {
//           toast.error(
//             "Voice notes cannot exceed 5 minutes.",
//           );
//           return;
//         }

//         if (chunksRef.current.length === 0) {
//           return;
//         }

//         const mime =
//           recorder.mimeType || "audio/webm";

//         const extension = mime.includes("mp4")
//           ? "m4a"
//           : mime.includes("ogg")
//             ? "ogg"
//             : "webm";

//         const file = new File(
//           [
//             new Blob(chunksRef.current, {
//               type: mime,
//             }),
//           ],
//           `voice-note-${Date.now()}.${extension}`,
//           { type: mime },
//         );

//         void chat.upload(file);
//       };

//       recorder.start();
//       setRecording(true);
//     } catch {
//       toast.error(
//         "Microphone permission was denied or the microphone is unavailable.",
//       );
//     }
//   };

//   const stopRecording = () => {
//     if (
//       recorderRef.current?.state === "recording"
//     ) {
//       recorderRef.current.stop();
//     }

//     setRecording(false);
//   };

//   const startCall = (type: CallType) => {
//     if (!canCall || !onStartCall) return;

//     onStartCall(type, rideId);
//   };

//   return (
//     <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#FAF9FB]">
//       {/* HEADER */}

//       <header className="z-20 shrink-0 border-b border-[#EEEAF1] bg-white/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl">
//         <div className="mx-auto flex w-full max-w-[680px] items-center gap-3">
//           <motion.button
//             type="button"
//             whileTap={{ scale: 0.95 }}
//             onClick={onBack}
//             aria-label="Back to ride"
//             className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#302B34] hover:bg-[#F6F3F8]"
//           >
//             <ArrowLeft size={21} />
//           </motion.button>

//           <div className="flex items-center flex-1 min-w-0 gap-3">
//             <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEE7F5] text-[17px] font-semibold text-[#7442AD]">
//               {photo ? (
//                 <img
//                   src={photo}
//                   alt={displayName}
//                   className="object-cover w-full h-full"
//                 />
//               ) : (
//                 displayName.charAt(0).toUpperCase()
//               )}
//             </div>

//             <div className="min-w-0">
//               <h1 className="truncate text-[16px] font-semibold text-[#302B34]">
//                 {displayName}
//               </h1>

//               <p className="mt-0.5 text-[12px] text-[#96909A]">
//                 {chat.otherTyping
//               ? "Typing..."
//               : chat.connected
//                 ? "Online"
//                 : chat.socketError
//                   ? "Messaging available"
//                   : "Connecting..."}
//               </p>
//             </div>
//           </div>

//           <motion.button
//             type="button"
//             whileTap={{ scale: 0.95 }}
//             onClick={() => startCall("voice")}
//             disabled={!canCall || !onStartCall}
//             aria-label="Voice call"
//             className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F2F7] text-[#7442AD] disabled:cursor-not-allowed disabled:opacity-40"
//           >
//             <Phone size={19} />
//           </motion.button>

//           <motion.button
//             type="button"
//             whileTap={{ scale: 0.95 }}
//             onClick={() => startCall("video")}
//             disabled={!canCall || !onStartCall}
//             aria-label="Video call"
//             className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F2F7] text-[#7442AD] disabled:cursor-not-allowed disabled:opacity-40"
//           >
//             <Video size={19} />
//           </motion.button>
//         </div>
//       </header>

//       {/* CHAT AVAILABILITY */}

//       {chat.conversation && !canSend && (
//         <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-center text-[13px] text-amber-900">
//           {chat.conversation.messaging.message ||
//             "Messaging is no longer available for this ride."}
//         </div>
//       )}

//       {/* MESSAGES */}

//       <main
//         className="flex-1 min-h-0 px-4 py-5 overflow-y-auto"
//         aria-label="Ride conversation"
//       >
//         <div className="mx-auto flex w-full max-w-[680px] flex-col">
//           {chat.loading && (
//             <div className="flex justify-center py-12 text-[#7442AD]">
//               <LoaderCircle
//                 size={28}
//                 className="animate-spin"
//               />
//             </div>
//           )}

//           {chat.error && (
//             <div className="mb-5 rounded-[14px] bg-red-50 p-4 text-[14px] text-red-700">
//               <p>{chat.error}</p>

//               <button
//                 type="button"
//                 onClick={() => void chat.refresh()}
//                 className="mt-2 font-semibold underline"
//               >
//                 Retry
//               </button>
//             </div>
//           )}

//           {chat.hasMore && (
//             <button
//               type="button"
//               disabled={chat.loadingMore}
//               onClick={() => void chat.loadMore()}
//               className="mb-5 self-center rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#7442AD] shadow-sm disabled:opacity-50"
//             >
//               {chat.loadingMore
//                 ? "Loading..."
//                 : "Load older messages"}
//             </button>
//           )}

//           {!chat.loading &&
//             !chat.messages.length &&
//             !chat.error && (
//               <div className="py-16 text-center">
//                 <p className="text-[16px] font-semibold text-[#302B34]">
//                   No messages yet
//                 </p>

//                 <p className="mt-2 text-[14px] text-[#96909A]">
//                   {canSend
//                     ? "Start a conversation with your driver."
//                     : "There are no messages to display."}
//                 </p>
//               </div>
//             )}

//           <AnimatePresence initial={false}>
//             {chat.messages.map((item) => {
//               const mine =
//                 item.senderId === currentUserId;

//               if (item.type === "system") {
//                 return (
//                   <motion.p
//                     key={item.id}
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     className="mx-auto mb-5 max-w-[85%] rounded-full bg-[#EEEAF1] px-4 py-2 text-center text-[12px] text-[#776E7D]"
//                   >
//                     {item.content}
//                   </motion.p>
//                 );
//               }

//               const isRead =
//                 mine &&
//                 Boolean(chat.readAt) &&
//                 new Date(item.createdAt).getTime() <=
//                   new Date(
//                     chat.readAt || "",
//                   ).getTime();

//               return (
//                 <motion.div
//                   key={item.id}
//                   initial={{
//                     opacity: 0,
//                     y: 10,
//                     scale: 0.97,
//                   }}
//                   animate={{
//                     opacity: 1,
//                     y: 0,
//                     scale: 1,
//                   }}
//                   className={`mb-5 flex flex-col ${
//                     mine
//                       ? "items-end"
//                       : "items-start"
//                   }`}
//                 >
//                   <div
//                     className={`max-w-[82%] rounded-[20px] px-4 py-3 text-[14px] leading-6 ${
//                       mine
//                         ? "rounded-br-[6px] bg-[#7442AD] text-white"
//                         : "rounded-bl-[6px] bg-white text-[#302B34] shadow-[0_5px_25px_rgba(30,20,38,0.05)]"
//                     }`}
//                   >
//                     <MessageContent message={item} />
//                   </div>

//                   <p className="mt-1 flex items-center gap-1 px-1 text-[11px] text-[#AAA4AE]">
//                     {formatTime(item.createdAt)}

//                     {isRead && (
//                       <CheckCheck
//                         size={14}
//                         className="text-[#7442AD]"
//                       />
//                     )}
//                   </p>
//                 </motion.div>
//               );
//             })}
//           </AnimatePresence>

//           {chat.otherTyping && (
//             <motion.p
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               className="mb-3 text-[12px] italic text-[#7442AD]"
//             >
//               {displayName} is typing...
//             </motion.p>
//           )}

//           <div ref={bottomRef} />
//         </div>
//       </main>

//       {/* MESSAGE COMPOSER */}

//       <footer className="shrink-0 border-t border-[#EEEAF1] bg-white px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
//         <div className="mx-auto w-full max-w-[680px]">
//           {canSend && (
//             <div className="flex gap-2 pb-1 mb-3 overflow-x-auto">
//               {quickReplies.map((reply) => (
//                 <button
//                   key={reply}
//                   type="button"
//                   disabled={chat.sending}
//                   onClick={() => void chat.send(reply)}
//                   className="shrink-0 rounded-full border border-[#E7E1EA] px-4 py-2 text-[13px] text-[#514B55] disabled:opacity-50"
//                 >
//                   {reply}
//                 </button>
//               ))}
//             </div>
//           )}

//           <input
//             ref={fileRef}
//             type="file"
//             hidden
//             onChange={(event) =>
//               void onFile(event)
//             }
//           />

//           {canSend && (
//             <div className="flex items-center gap-4 mb-3">
//               <button
//                 type="button"
//                 onClick={() => chooseFile("image")}
//                 disabled={chat.uploading || recording}
//                 aria-label="Attach image"
//                 className="text-[#7442AD] disabled:opacity-40"
//               >
//                 <Camera size={21} />
//               </button>

//               <button
//                 type="button"
//                 onClick={() => chooseFile("file")}
//                 disabled={chat.uploading || recording}
//                 aria-label="Attach document"
//                 className="text-[#7442AD] disabled:opacity-40"
//               >
//                 <FileText size={21} />
//               </button>

//               <button
//                 type="button"
//                 onClick={
//                   recording
//                     ? stopRecording
//                     : () => void startRecording()
//                 }
//                 disabled={chat.uploading}
//                 aria-label={
//                   recording
//                     ? "Stop and send voice note"
//                     : "Record voice note"
//                 }
//                 className={
//                   recording
//                     ? "text-red-600"
//                     : "text-[#7442AD]"
//                 }
//               >
//                 {recording ? (
//                   <X size={21} />
//                 ) : (
//                   <Mic size={21} />
//                 )}
//               </button>

//               <p className="text-[12px] text-[#96909A]">
//                 {recording
//                   ? "Recording — tap X to send"
//                   : chat.uploading
//                     ? "Uploading attachment..."
//                     : "Photos, files & voice notes"}
//               </p>
//             </div>
//           )}

//           <form
//             onSubmit={(event) =>
//               void submit(event)
//             }
//             className="flex min-h-[54px] items-center gap-2 rounded-full bg-[#F6F3F7] px-4 py-2"
//           >
//             <input
//               value={draft}
//               maxLength={1000}
//               disabled={!canSend || chat.sending}
//               onBlur={chat.stopTyping}
//               onChange={(event) => {
//                 setDraft(event.target.value);

//                 if (event.target.value.trim()) {
//                   chat.notifyTyping();
//                 } else {
//                   chat.stopTyping();
//                 }
//               }}
//               placeholder={
//                 canSend
//                   ? "Write a message..."
//                   : "Chat unavailable"
//               }
//               aria-label="Message"
//               className="min-w-0 flex-1 bg-transparent text-[16px] text-[#302B34] outline-none placeholder:text-[#AAA3AD] disabled:opacity-50"
//             />

//             <motion.button
//               type="submit"
//               whileTap={{ scale: 0.95 }}
//               disabled={
//                 !canSend ||
//                 !draft.trim() ||
//                 chat.sending
//               }
//               aria-label="Send message"
//               className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7442AD] text-white disabled:opacity-40"
//             >
//               {chat.sending ? (
//                 <LoaderCircle
//                   size={19}
//                   className="animate-spin"
//                 />
//               ) : (
//                 <Send size={19} />
//               )}
//             </motion.button>
//           </form>
//         </div>
//       </footer>
//     </div>
//   );
// }


