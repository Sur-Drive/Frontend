import {
  ArrowLeft,
  Camera,
  CheckCheck,
  Image as ImageIcon,
  Phone,
  Send,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import {
  mockAssignedDriver,
} from "../../../data/passengerRide";

type ChatMessage = {
  id: string;
  sender: "driver" | "passenger";
  type: "text" | "image";
  content: string;
  time: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    sender: "driver",
    type: "text",
    content:
      "Hey abiodun. where are you now!! Wait, i'll be there soon 😜",
    time: "Mon, Jul 15, 5:35 AM",
  },
  {
    id: "2",
    sender: "passenger",
    type: "text",
    content:
      "Okay, no problem you come sloway to sloway.",
    time: "Mon, Jul 15, 5:37 AM",
  },
];

const quickReplies = [
  "Be there in 2 mins",
  "I am outside",
  "Okay, thanks!",
];

export default function RideChat() {
  const navigate = useNavigate();

  const {
    ride,
  } = usePassengerRide();

  const driver =
    ride.driver ??
    mockAssignedDriver;

  const [
    messages,
    setMessages,
  ] = useState<ChatMessage[]>(
    initialMessages,
  );

  const [
    message,
    setMessage,
  ] = useState("");

  const bottomRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  if (
    !ride.driver &&
    ride.status === "idle"
  ) {
    return (
      <Navigate
        to="/passenger/home"
        replace
      />
    );
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const goBack = () => {
    switch (ride.status) {
      case "driver-assigned":
        navigate(
          "/passenger/ride/driver-assigned",
        );
        break;

      case "driver-en-route":
        navigate(
          "/passenger/ride/driver-en-route",
        );
        break;

      case "driver-arriving":
        navigate(
          "/passenger/ride/driver-arriving",
        );
        break;

      case "driver-arrived":
        navigate(
          "/passenger/ride/driver-arrived",
        );
        break;

      case "in-progress":
        navigate(
          "/passenger/ride/trip",
        );
        break;

      default:
        navigate(-1);
    }
  };

  const sendMessage = (
    value = message,
  ) => {
    const trimmed =
      value.trim();

    if (!trimmed) {
      return;
    }

    const newMessage: ChatMessage = {
      id: `${Date.now()}`,
      sender: "passenger",
      type: "text",
      content: trimmed,
      time: new Date().toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      ),
    };

    setMessages(
      (previous) => [
        ...previous,
        newMessage,
      ],
    );

    setMessage("");
  };

  const submit = (
    event: FormEvent,
  ) => {
    event.preventDefault();

    sendMessage();
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#FAF9FB]">
      {/* ======================================
          FIXED CHAT HEADER
      ====================================== */}

      <header
        className="
          z-[700]
          shrink-0
          border-b
          border-[#EEEAF1]
          bg-white/95
          px-4
          pb-3
          pt-[max(12px,env(safe-area-inset-top))]
          backdrop-blur-xl
        "
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-[680px]
            items-center
            gap-3
          "
        >
          <motion.button
            type="button"
            whileTap={{
              scale: 0.9,
            }}
            onClick={goBack}
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              text-[#302B34]
              hover:bg-[#F6F3F8]
            "
          >
            <ArrowLeft
              size={21}
            />
          </motion.button>

          <div
            className="
              flex
              min-w-0
              flex-1
              items-center
              gap-3
            "
          >
            <div
              className="
                h-11
                w-11
                shrink-0
                overflow-hidden
                rounded-full
                bg-[#EEE7F5]
              "
            >
              {driver.photo ? (
                <img
                  src={
                    driver.photo
                  }
                  alt={
                    driver.firstName
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="
                    flex
                    h-full
                    w-full
                    items-center
                    justify-center
                    text-[17px]
                    font-bold
                    text-[#7442AD]
                  "
                >
                  {driver.firstName.charAt(
                    0,
                  )}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <h1
                  className="
                    truncate
                    text-[16px]
                    font-semibold
                    text-[#302B34]
                  "
                >
                  {
                    driver.firstName
                  }
                </h1>

                <span
                  className="
                    flex
                    items-center
                    gap-1
                    text-[13px]
                    font-semibold
                    text-[#D39B13]
                  "
                >
                  ★{" "}
                  {
                    driver.rating
                  }
                </span>
              </div>

              <p
                className="
                  mt-0.5
                  truncate
                  text-[13px]
                  text-[#96909A]
                "
              >
                {
                  driver.totalTrips
                }{" "}
                completed rides
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={{
              scale: 0.9,
            }}
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#F5F2F7]
              text-[#625C66]
            "
          >
            <Phone
              size={18}
            />
          </motion.button>
        </div>
      </header>

      {/* ======================================
          MESSAGES
      ====================================== */}

      <main
        className="
          min-h-0
          flex-1
          overflow-y-auto
          px-4
          py-5
        "
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-[680px]
            flex-col
          "
        >
          <AnimatePresence
            initial={false}
          >
            {messages.map(
              (item) => {
                const mine =
                  item.sender ===
                  "passenger";

                return (
                  <motion.div
                    key={
                      item.id
                    }
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
                    className={`
                      mb-5
                      flex
                      flex-col

                      ${
                        mine
                          ? "items-end"
                          : "items-start"
                      }
                    `}
                  >
                    <p
                      className="
                        mb-2
                        px-1
                        text-[13px]
                        text-[#AAA4AE]
                      "
                    >
                      {
                        item.time
                      }
                    </p>

                    {item.type ===
                    "text" ? (
                      <div
                        className={`
                          max-w-[82%]
                          rounded-[22px]
                          px-5
                          py-4
                          text-[14px]
                          leading-6

                          ${
                            mine
                              ? `
                                rounded-br-[7px]
                                bg-[#7442AD]
                                text-white
                              `
                              : `
                                rounded-bl-[7px]
                                bg-white
                                text-[#302B34]
                                shadow-[0_5px_25px_rgba(30,20,38,0.05)]
                              `
                          }
                        `}
                      >
                        {
                          item.content
                        }

                        {mine && (
                          <div
                            className="
                              mt-1
                              flex
                              justify-end
                            "
                          >
                            <CheckCheck
                              size={
                                15
                              }
                              className="text-white/70"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="
                          max-w-[82%]
                          overflow-hidden
                          rounded-[20px]
                        "
                      >
                        <img
                          src={
                            item.content
                          }
                          alt="Chat attachment"
                          className="
                            max-h-[280px]
                            w-full
                            object-cover
                          "
                        />
                      </div>
                    )}
                  </motion.div>
                );
              },
            )}
          </AnimatePresence>

          <div
            ref={bottomRef}
          />
        </div>
      </main>

      {/* ======================================
          QUICK REPLIES + INPUT
      ====================================== */}

      <footer
        className="
          shrink-0
          border-t
          border-[#EEEAF1]
          bg-white
          px-4
          pb-[max(14px,env(safe-area-inset-bottom))]
          pt-3
        "
      >
        <div className="mx-auto w-full max-w-[680px]">
          <div
            className="
              flex
              gap-2
              overflow-x-auto
              pb-3
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {quickReplies.map(
              (reply) => (
                <motion.button
                  key={
                    reply
                  }
                  type="button"
                  whileTap={{
                    scale: 0.96,
                  }}
                  onClick={() =>
                    sendMessage(
                      reply,
                    )
                  }
                  className="
                    shrink-0
                    rounded-full
                    border
                    border-[#E7E1EA]
                    bg-white
                    px-4
                    py-2.5
                    text-[13px]
                    font-medium
                    text-[#514B55]
                  "
                >
                  {reply}
                </motion.button>
              ),
            )}
          </div>

          <form
            onSubmit={submit}
            className="
              flex
              min-h-[56px]
              items-center
              gap-2
              rounded-full
              bg-[#F6F3F7]
              px-2
              py-1.5
            "
          >
            <motion.button
              type="button"
              whileTap={{
                scale: 0.9,
              }}
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                text-[#8E5DBA]
              "
            >
              <Camera
                size={19}
              />
            </motion.button>

            <input
              value={message}
              onChange={(
                event,
              ) =>
                setMessage(
                  event.target
                    .value,
                )
              }
              placeholder="Write a message"
              className="
                min-w-0
                flex-1
                bg-transparent
                text-[16px]
                text-[#302B34]
                outline-none
                placeholder:text-[#AAA3AD]
              "
            />

            <motion.button
              type="button"
              whileTap={{
                scale: 0.9,
              }}
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                text-[#8E5DBA]
              "
            >
              <ImageIcon
                size={18}
              />
            </motion.button>

            <motion.button
              type="submit"
              disabled={
                !message.trim()
              }
              whileTap={{
                scale: 0.9,
              }}
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#7442AD]
                text-white
                disabled:bg-transparent
                disabled:text-[#9B72BC]
              "
            >
              <Send
                size={17}
              />
            </motion.button>
          </form>
        </div>
      </footer>
    </div>
  );
}