
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

import type {
  ChatMessage,
} from "../../../api/passenger/rideChat.api";
import { usePassengerProfile } from "../../../context/PassengerProfileContext";

const quickReplies = [
  "I am outside",
  "I will be there soon",
  "Okay, thanks!",
];

type CallType = "voice" | "video";

interface RideChatProps {
  currentUserId: string;
  onStartCall?: (
    type: CallType,
    rideId: string,
  ) => void;
}

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
            src={
              attachment.thumbnailUrl ||
              attachment.url
            }
            alt={
              attachment.originalName ||
              "Image attachment"
            }
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
            {attachment.originalName ||
              "Open attachment"}
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

export default function RideChat({
  onStartCall,
}: {
  onStartCall?: (
    type: "voice" | "video",
    rideId: string,
  ) => void;
}) {
  const navigate = useNavigate();

  const { ride } = usePassengerRide();
  const { userId } = usePassengerProfile();

  const backendRide = getStoredActiveRide();

  const rideId =
    backendRide?.id ??
    getStoredActiveRideId();

  if (!rideId) {
    return (
      <Navigate
        to="/passenger/home"
        replace
      />
    );
  }

  if (!userId) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAF9FB] px-6">
        <div className="max-w-sm text-center">
          <h2 className="text-[20px] font-semibold text-[#302B34]">
            Unable to identify passenger
          </h2>

          <p className="mt-3 text-[14px] leading-6 text-[#827985]">
            Your authenticated passenger profile has not loaded.
            Please sign in again or refresh your session.
          </p>

          <button
            type="button"
            onClick={() => navigate("/passenger/home")}
            className="mt-6 rounded-xl bg-[#7442AD] px-6 py-3 text-[14px] font-semibold text-white"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const routes: Record<string, string> = {
    "driver-assigned": "/passenger/ride/driver-assigned",
    "driver-en-route": "/passenger/ride/driver-en-route",
    "driver-arriving": "/passenger/ride/driver-arriving",
    "driver-arrived": "/passenger/ride/driver-arrived",
    "in-progress": "/passenger/ride/in-trip",
  };

  return (
    <RideChatSession
      key={rideId}
      rideId={rideId}
      currentUserId={userId}
      onStartCall={onStartCall}
      onBack={() =>
        navigate(
          routes[ride.status] ??
            "/passenger/ride/in-trip",
        )
      }
    />
  );
}

interface RideChatSessionProps
  extends RideChatProps {
  rideId: string;
  onBack: () => void;
}

function RideChatSession({
  rideId,
  currentUserId,
  onStartCall,
  onBack,
}: RideChatSessionProps) {
  const chat = useRideChat({
    rideId,
    currentUserId,
  });

  const [draft, setDraft] = useState("");
  const [recording, setRecording] =
    useState(false);

  const [attachmentKind, setAttachmentKind] =
    useState<"image" | "file">("image");

  const bottomRef =
    useRef<HTMLDivElement | null>(null);

  const fileRef =
    useRef<HTMLInputElement | null>(null);

  const recorderRef =
    useRef<MediaRecorder | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);

  const canSend =
    Boolean(chat.conversation?.messaging.canSend);

  const canCall =
    Boolean(chat.conversation?.calling.canCall);

  const profile = chat.conversation?.counterpart;

  const displayName =
    profile?.firstName ||
    profile?.name ||
    "Your driver";

  const photo =
    profile?.photo ||
    profile?.avatarUrl ||
    null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chat.messages.length]);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;

      if (recorder && recorder.state === "recording") {
        recorder.onstop = null;
        recorder.stop();
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const sent = await chat.send(draft);

    if (sent) {
      setDraft("");
    }
  };

  const chooseFile = (
    kind: "image" | "file",
  ) => {
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

        const duration =
          Date.now() - startedAtRef.current;

        if (duration > 300000) {
          toast.error(
            "Voice notes cannot exceed 5 minutes.",
          );
          return;
        }

        if (chunksRef.current.length === 0) {
          return;
        }

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
    if (
      recorderRef.current?.state === "recording"
    ) {
      recorderRef.current.stop();
    }

    setRecording(false);
  };

  const startCall = (type: CallType) => {
    if (!canCall || !onStartCall) return;

    onStartCall(type, rideId);
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#FAF9FB]">
      {/* HEADER */}

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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEE7F5] text-[17px] font-semibold text-[#7442AD]">
              {photo ? (
                <img
                  src={photo}
                  alt={displayName}
                  className="object-cover w-full h-full"
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-[16px] font-semibold text-[#302B34]">
                {displayName}
              </h1>

              <p className="mt-0.5 text-[12px] text-[#96909A]">
                {chat.otherTyping
                  ? "Typing..."
                  : chat.connected
                    ? "Chat connected"
                    : "Connecting..."}
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => startCall("voice")}
            disabled={!canCall || !onStartCall}
            aria-label="Voice call"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F2F7] text-[#7442AD] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Phone size={19} />
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => startCall("video")}
            disabled={!canCall || !onStartCall}
            aria-label="Video call"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F2F7] text-[#7442AD] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Video size={19} />
          </motion.button>
        </div>
      </header>

      {/* CHAT AVAILABILITY */}

      {chat.conversation && !canSend && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-center text-[13px] text-amber-900">
          {chat.conversation.messaging.message ||
            "Messaging is no longer available for this ride."}
        </div>
      )}

      {/* MESSAGES */}

      <main
        className="flex-1 min-h-0 px-4 py-5 overflow-y-auto"
        aria-label="Ride conversation"
      >
        <div className="mx-auto flex w-full max-w-[680px] flex-col">
          {chat.loading && (
            <div className="flex justify-center py-12 text-[#7442AD]">
              <LoaderCircle
                size={28}
                className="animate-spin"
              />
            </div>
          )}

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
                <p className="text-[16px] font-semibold text-[#302B34]">
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
        </div>
      </main>

      {/* MESSAGE COMPOSER */}

      <footer className="shrink-0 border-t border-[#EEEAF1] bg-white px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-[680px]">
          {canSend && (
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
          )}

          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={(event) =>
              void onFile(event)
            }
          />

          {canSend && (
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
          )}

          <form
            onSubmit={(event) =>
              void submit(event)
            }
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
                canSend
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


// import {
//   ArrowLeft,
//   Camera,
//   CheckCheck,
//   Image as ImageIcon,
//   Phone,
//   Send,
// } from "lucide-react";

// import {
//   AnimatePresence,
//   motion,
// } from "framer-motion";

// import {
//   Navigate,
//   useNavigate,
// } from "react-router-dom";

// import {
//   useEffect,
//   useRef,
//   useState,
// } from "react";

// import type {
//   FormEvent,
// } from "react";

// import {
//   usePassengerRide,
// } from "../../../context/PassengerRideContext";

// import {
//   mockAssignedDriver,
// } from "../../../data/passengerRide";

// type ChatMessage = {
//   id: string;
//   sender: "driver" | "passenger";
//   type: "text" | "image";
//   content: string;
//   time: string;
// };

// const initialMessages: ChatMessage[] = [
//   {
//     id: "1",
//     sender: "driver",
//     type: "text",
//     content:
//       "Hey abiodun. where are you now!! Wait, i'll be there soon 😜",
//     time: "Mon, Jul 15, 5:35 AM",
//   },
//   {
//     id: "2",
//     sender: "passenger",
//     type: "text",
//     content:
//       "Okay, no problem you come sloway to sloway.",
//     time: "Mon, Jul 15, 5:37 AM",
//   },
// ];

// const quickReplies = [
//   "Be there in 2 mins",
//   "I am outside",
//   "Okay, thanks!",
// ];

// export default function RideChat() {
//   const navigate = useNavigate();

//   const {
//     ride,
//   } = usePassengerRide();

//   const driver =
//     ride.driver ??
//     mockAssignedDriver;

//   const [
//     messages,
//     setMessages,
//   ] = useState<ChatMessage[]>(
//     initialMessages,
//   );

//   const [
//     message,
//     setMessage,
//   ] = useState("");

//   const bottomRef =
//     useRef<HTMLDivElement | null>(
//       null,
//     );

//   if (
//     !ride.driver &&
//     ride.status === "idle"
//   ) {
//     return (
//       <Navigate
//         to="/passenger/home"
//         replace
//       />
//     );
//   }

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({
//       behavior: "smooth",
//     });
//   }, [messages]);

//   const goBack = () => {
//     switch (ride.status) {
//       case "driver-assigned":
//         navigate(
//           "/passenger/ride/driver-assigned",
//         );
//         break;

//       case "driver-en-route":
//         navigate(
//           "/passenger/ride/driver-en-route",
//         );
//         break;

//       case "driver-arriving":
//         navigate(
//           "/passenger/ride/driver-arriving",
//         );
//         break;

//       case "driver-arrived":
//         navigate(
//           "/passenger/ride/driver-arrived",
//         );
//         break;

//       case "in-progress":
//         navigate(
//           "/passenger/ride/trip",
//         );
//         break;

//       default:
//         navigate(-1);
//     }
//   };

//   const sendMessage = (
//     value = message,
//   ) => {
//     const trimmed =
//       value.trim();

//     if (!trimmed) {
//       return;
//     }

//     const newMessage: ChatMessage = {
//       id: `${Date.now()}`,
//       sender: "passenger",
//       type: "text",
//       content: trimmed,
//       time: new Date().toLocaleTimeString(
//         [],
//         {
//           hour: "2-digit",
//           minute: "2-digit",
//         },
//       ),
//     };

//     setMessages(
//       (previous) => [
//         ...previous,
//         newMessage,
//       ],
//     );

//     setMessage("");
//   };

//   const submit = (
//     event: FormEvent,
//   ) => {
//     event.preventDefault();

//     sendMessage();
//   };

//   return (
//     <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#FAF9FB]">
//       {/* ======================================
//           FIXED CHAT HEADER
//       ====================================== */}

//       <header
//         className="
//           z-[700]
//           shrink-0
//           border-b
//           border-[#EEEAF1]
//           bg-white/95
//           px-4
//           pb-3
//           pt-[max(12px,env(safe-area-inset-top))]
//           backdrop-blur-xl
//         "
//       >
//         <div
//           className="
//             mx-auto
//             flex
//             w-full
//             max-w-[680px]
//             items-center
//             gap-3
//           "
//         >
//           <motion.button
//             type="button"
//             whileTap={{
//               scale: 0.9,
//             }}
//             onClick={goBack}
//             className="
//               flex
//               h-11
//               w-11
//               shrink-0
//               items-center
//               justify-center
//               rounded-full
//               text-[#302B34]
//               hover:bg-[#F6F3F8]
//             "
//           >
//             <ArrowLeft
//               size={21}
//             />
//           </motion.button>

//           <div
//             className="flex items-center flex-1 min-w-0 gap-3 //"
//           >
//             <div
//               className="
//                 h-11
//                 w-11
//                 shrink-0
//                 overflow-hidden
//                 rounded-full
//                 bg-[#EEE7F5]
//               "
//             >
//               {driver.photo ? (
//                 <img
//                   src={
//                     driver.photo
//                   }
//                   alt={
//                     driver.firstName
//                   }
//                   className="object-cover w-full h-full"
//                 />
//               ) : (
//                 <div
//                   className="
//                     flex
//                     h-full
//                     w-full
//                     items-center
//                     justify-center
//                     text-[17px]
//                     font-bold
//                     text-[#7442AD]
//                   "
//                 >
//                   {driver.firstName.charAt(
//                     0,
//                   )}
//                 </div>
//               )}
//             </div>

//             <div className="min-w-0">
//               <div
//                 className="flex items-center gap-2 //"
//               >
//                 <h1
//                   className="
//                     truncate
//                     text-[16px]
//                     font-semibold
//                     text-[#302B34]
//                   "
//                 >
//                   {
//                     driver.firstName
//                   }
//                 </h1>

//                 <span
//                   className="
//                     flex
//                     items-center
//                     gap-1
//                     text-[13px]
//                     font-semibold
//                     text-[#D39B13]
//                   "
//                 >
//                   ★{" "}
//                   {
//                     driver.rating
//                   }
//                 </span>
//               </div>

//               <p
//                 className="
//                   mt-0.5
//                   truncate
//                   text-[13px]
//                   text-[#96909A]
//                 "
//               >
//                 {
//                   driver.totalTrips
//                 }{" "}
//                 completed rides
//               </p>
//             </div>
//           </div>

//           <motion.button
//             type="button"
//             whileTap={{
//               scale: 0.9,
//             }}
//             className="
//               flex
//               h-11
//               w-11
//               shrink-0
//               items-center
//               justify-center
//               rounded-full
//               bg-[#F5F2F7]
//               text-[#625C66]
//             "
//           >
//             <Phone
//               size={18}
//             />
//           </motion.button>
//         </div>
//       </header>

//       {/* ======================================
//           MESSAGES
//       ====================================== */}

//       <main
//         className="flex-1 min-h-0 px-4 py-5 overflow-y-auto //"
//       >
//         <div
//           className="
//             mx-auto
//             flex
//             w-full
//             max-w-[680px]
//             flex-col
//           "
//         >
//           <AnimatePresence
//             initial={false}
//           >
//             {messages.map(
//               (item) => {
//                 const mine =
//                   item.sender ===
//                   "passenger";

//                 return (
//                   <motion.div
//                     key={
//                       item.id
//                     }
//                     initial={{
//                       opacity: 0,
//                       y: 10,
//                       scale: 0.97,
//                     }}
//                     animate={{
//                       opacity: 1,
//                       y: 0,
//                       scale: 1,
//                     }}
//                     className={`
//                       mb-5
//                       flex
//                       flex-col

//                       ${
//                         mine
//                           ? "items-end"
//                           : "items-start"
//                       }
//                     `}
//                   >
//                     <p
//                       className="
//                         mb-2
//                         px-1
//                         text-[13px]
//                         text-[#AAA4AE]
//                       "
//                     >
//                       {
//                         item.time
//                       }
//                     </p>

//                     {item.type ===
//                     "text" ? (
//                       <div
//                         className={`
//                           max-w-[82%]
//                           rounded-[22px]
//                           px-5
//                           py-4
//                           text-[14px]
//                           leading-6

//                           ${
//                             mine
//                               ? `
//                                 rounded-br-[7px]
//                                 bg-[#7442AD]
//                                 text-white
//                               `
//                               : `
//                                 rounded-bl-[7px]
//                                 bg-white
//                                 text-[#302B34]
//                                 shadow-[0_5px_25px_rgba(30,20,38,0.05)]
//                               `
//                           }
//                         `}
//                       >
//                         {
//                           item.content
//                         }

//                         {mine && (
//                           <div
//                             className="flex justify-end mt-1 //"
//                           >
//                             <CheckCheck
//                               size={
//                                 15
//                               }
//                               className="text-white/70"
//                             />
//                           </div>
//                         )}
//                       </div>
//                     ) : (
//                       <div
//                         className="
//                           max-w-[82%]
//                           overflow-hidden
//                           rounded-[20px]
//                         "
//                       >
//                         <img
//                           src={
//                             item.content
//                           }
//                           alt="Chat attachment"
//                           className="
//                             max-h-[280px]
//                             w-full
//                             object-cover
//                           "
//                         />
//                       </div>
//                     )}
//                   </motion.div>
//                 );
//               },
//             )}
//           </AnimatePresence>

//           <div
//             ref={bottomRef}
//           />
//         </div>
//       </main>

//       {/* ======================================
//           QUICK REPLIES + INPUT
//       ====================================== */}

//       <footer
//         className="
//           shrink-0
//           border-t
//           border-[#EEEAF1]
//           bg-white
//           px-4
//           pb-[max(14px,env(safe-area-inset-bottom))]
//           pt-3
//         "
//       >
//         <div className="mx-auto w-full max-w-[680px]">
//           <div
//             className="
//               flex
//               gap-2
//               overflow-x-auto
//               pb-3
//               [scrollbar-width:none]
//               [&::-webkit-scrollbar]:hidden
//             "
//           >
//             {quickReplies.map(
//               (reply) => (
//                 <motion.button
//                   key={
//                     reply
//                   }
//                   type="button"
//                   whileTap={{
//                     scale: 0.96,
//                   }}
//                   onClick={() =>
//                     sendMessage(
//                       reply,
//                     )
//                   }
//                   className="
//                     shrink-0
//                     rounded-full
//                     border
//                     border-[#E7E1EA]
//                     bg-white
//                     px-4
//                     py-2.5
//                     text-[13px]
//                     font-medium
//                     text-[#514B55]
//                   "
//                 >
//                   {reply}
//                 </motion.button>
//               ),
//             )}
//           </div>

//           <form
//             onSubmit={submit}
//             className="
//               flex
//               min-h-[56px]
//               items-center
//               gap-2
//               rounded-full
//               bg-[#F6F3F7]
//               px-2
//               py-1.5
//             "
//           >
//             <motion.button
//               type="button"
//               whileTap={{
//                 scale: 0.9,
//               }}
//               className="
//                 flex
//                 h-10
//                 w-10
//                 shrink-0
//                 items-center
//                 justify-center
//                 rounded-full
//                 text-[#8E5DBA]
//               "
//             >
//               <Camera
//                 size={19}
//               />
//             </motion.button>

//             <input
//               value={message}
//               onChange={(
//                 event,
//               ) =>
//                 setMessage(
//                   event.target
//                     .value,
//                 )
//               }
//               placeholder="Write a message"
//               className="
//                 min-w-0
//                 flex-1
//                 bg-transparent
//                 text-[16px]
//                 text-[#302B34]
//                 outline-none
//                 placeholder:text-[#AAA3AD]
//               "
//             />

//             <motion.button
//               type="button"
//               whileTap={{
//                 scale: 0.9,
//               }}
//               className="
//                 flex
//                 h-10
//                 w-10
//                 shrink-0
//                 items-center
//                 justify-center
//                 rounded-full
//                 text-[#8E5DBA]
//               "
//             >
//               <ImageIcon
//                 size={18}
//               />
//             </motion.button>

//             <motion.button
//               type="submit"
//               disabled={
//                 !message.trim()
//               }
//               whileTap={{
//                 scale: 0.9,
//               }}
//               className="
//                 flex
//                 h-10
//                 w-10
//                 shrink-0
//                 items-center
//                 justify-center
//                 rounded-full
//                 bg-[#7442AD]
//                 text-white
//                 disabled:bg-transparent
//                 disabled:text-[#9B72BC]
//               "
//             >
//               <Send
//                 size={17}
//               />
//             </motion.button>
//           </form>
//         </div>
//       </footer>
//     </div>
//   );
// }