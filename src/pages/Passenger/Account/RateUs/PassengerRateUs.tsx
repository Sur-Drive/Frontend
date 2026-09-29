import {
  Check,
  Heart,
  Send,
  Star,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import RideHeader from "../../../../components/passenger/ride/RideHeader";

const feedbackTags = [
  "Easy to use",
  "Reliable rides",
  "Great drivers",
  "Good prices",
  "Safety features",
  "Fast pickup",
];

const ratingContent: Record<
  number,
  {
    title: string;
    description: string;
  }
> = {
  1: {
    title: "We're sorry to hear that",
    description:
      "Tell us what went wrong so we can improve your experience.",
  },

  2: {
    title: "We can do better",
    description:
      "Your feedback will help us understand what needs improvement.",
  },

  3: {
    title: "Thanks for your feedback",
    description:
      "Tell us what would make your Sur-Drive experience even better.",
  },

  4: {
    title: "We're glad you like Sur-Drive",
    description:
      "Let us know what you've enjoyed most about your experience.",
  },

  5: {
    title: "We're happy you love it!",
    description:
      "Thanks for riding with Sur-Drive. We'd love to hear what stands out.",
  },
};

export default function PassengerRateUs() {
  const navigate =
    useNavigate();

  const [
    rating,
    setRating,
  ] = useState(0);

  const [
    hoveredRating,
    setHoveredRating,
  ] = useState(0);

  const [
    selectedTags,
    setSelectedTags,
  ] = useState<string[]>([]);

  const [
    feedback,
    setFeedback,
  ] = useState("");

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const activeRating =
    hoveredRating || rating;

  const content =
    useMemo(
      () =>
        rating > 0
          ? ratingContent[
              rating
            ]
          : null,
      [rating],
    );

  const toggleTag = (
    tag: string,
  ) => {
    setSelectedTags(
      (previous) =>
        previous.includes(tag)
          ? previous.filter(
              (item) =>
                item !== tag,
            )
          : [
              ...previous,
              tag,
            ],
    );
  };

  const handleSubmit = () => {
    if (
      rating === 0 ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);

    /*
     * FRONTEND PREVIEW
     *
     * Replace this timeout with the
     * feedback/rating API when available.
     */
    window.setTimeout(
      () => {
        setSubmitting(false);
        setSubmitted(true);
      },
      700,
    );
  };

  const handleDone = () => {
    navigate(
      "/passenger/account",
      {
        replace: true,
      },
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8F7F9]">
      <RideHeader
        title="Rate Us"
        onBack={() =>
          navigate(
            "/passenger/account",
          )
        }
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-7 sm:px-7">
        <AnimatePresence
          mode="wait"
        >
          {!submitted ? (
            <motion.div
              key="rating-form"
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -15,
              }}
              transition={{
                duration: 0.3,
              }}
            >
              {/* INTRO */}

              <div className="text-center">
                <motion.div
                  initial={{
                    scale: 0.85,
                    opacity: 0,
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 240,
                    damping: 18,
                  }}
                  className="
                    mx-auto
                    flex
                    h-[72px]
                    w-[72px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#F0E8F8]
                    text-[#7442AD]
                  "
                >
                  <Heart
                    size={31}
                    strokeWidth={2}
                  />
                </motion.div>

                <h1 className="mt-5 text-[23px] font-semibold tracking-[-0.02em] text-[#302B34]">
                  Enjoying
                  Sur-Drive?
                </h1>

                <p className="mx-auto mt-2 max-w-[380px] text-[14px] leading-6 text-[#918B95]">
                  Your feedback
                  helps us create a
                  better experience
                  for every ride.
                </p>
              </div>

              {/* STARS */}

              <div className="mt-8 rounded-[22px] bg-white px-5 py-7 shadow-[0_6px_30px_rgba(36,25,45,0.04)]">
                <p className="text-center text-[15px] font-semibold text-[#302B34]">
                  How would you rate
                  your experience?
                </p>

                <div
                  className="
                    mt-5
                    flex
                    items-center
                    justify-center
                    gap-2
                    sm:gap-3
                  "
                  onMouseLeave={() =>
                    setHoveredRating(
                      0,
                    )
                  }
                >
                  {[
                    1,
                    2,
                    3,
                    4,
                    5,
                  ].map(
                    (
                      star,
                    ) => {
                      const active =
                        star <=
                        activeRating;

                      return (
                        <motion.button
                          key={
                            star
                          }
                          type="button"
                          aria-label={`Rate ${star} star${
                            star >
                            1
                              ? "s"
                              : ""
                          }`}
                          whileHover={{
                            scale:
                              1.12,
                            y: -2,
                          }}
                          whileTap={{
                            scale:
                              0.88,
                          }}
                          onMouseEnter={() =>
                            setHoveredRating(
                              star,
                            )
                          }
                          onFocus={() =>
                            setHoveredRating(
                              star,
                            )
                          }
                          onBlur={() =>
                            setHoveredRating(
                              0,
                            )
                          }
                          onClick={() =>
                            setRating(
                              star,
                            )
                          }
                          className="
                            flex
                            h-[48px]
                            w-[48px]
                            items-center
                            justify-center
                            rounded-full
                          "
                        >
                          <motion.div
                            animate={{
                              scale:
                                active
                                  ? 1
                                  : 0.94,
                            }}
                          >
                            <Star
                              size={
                                36
                              }
                              strokeWidth={
                                1.8
                              }
                              fill={
                                active
                                  ? "#F5B942"
                                  : "transparent"
                              }
                              className={
                                active
                                  ? "text-[#F5B942]"
                                  : "text-[#D8D3DB]"
                              }
                            />
                          </motion.div>
                        </motion.button>
                      );
                    },
                  )}
                </div>

                <AnimatePresence
                  mode="wait"
                >
                  {content && (
                    <motion.div
                      key={
                        rating
                      }
                      initial={{
                        opacity:
                          0,
                        y: 8,
                      }}
                      animate={{
                        opacity:
                          1,
                        y: 0,
                      }}
                      exit={{
                        opacity:
                          0,
                      }}
                      className="mt-5 text-center"
                    >
                      <p className="text-[16px] font-semibold text-[#302B34]">
                        {
                          content.title
                        }
                      </p>

                      <p className="mx-auto mt-1 max-w-[360px] text-[13px] leading-5 text-[#918B95]">
                        {
                          content.description
                        }
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* FEEDBACK */}

              <AnimatePresence>
                {rating >
                  0 && (
                  <motion.div
                    initial={{
                      opacity:
                        0,
                      y: 18,
                    }}
                    animate={{
                      opacity:
                        1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        0.08,
                    }}
                    className="mt-5 rounded-[22px] bg-white p-5 shadow-[0_6px_30px_rgba(36,25,45,0.04)]"
                  >
                    <h2 className="text-[16px] font-semibold text-[#302B34]">
                      Tell us
                      more
                    </h2>

                    <p className="mt-1 text-[13px] leading-5 text-[#918B95]">
                      Select
                      anything
                      that
                      describes
                      your
                      experience.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {feedbackTags.map(
                        (
                          tag,
                        ) => {
                          const selected =
                            selectedTags.includes(
                              tag,
                            );

                          return (
                            <motion.button
                              key={
                                tag
                              }
                              type="button"
                              whileTap={{
                                scale:
                                  0.95,
                              }}
                              onClick={() =>
                                toggleTag(
                                  tag,
                                )
                              }
                              className={`
                                rounded-full
                                border
                                px-4
                                py-2.5
                                text-[13px]
                                font-medium
                                transition-colors

                                ${
                                  selected
                                    ? `
                                      border-[#7442AD]
                                      bg-[#7442AD]
                                      text-white
                                    `
                                    : `
                                      border-[#E3DEE6]
                                      bg-white
                                      text-[#625C66]
                                    `
                                }
                              `}
                            >
                              {
                                tag
                              }
                            </motion.button>
                          );
                        },
                      )}
                    </div>

                    <div className="mt-5">
                      <label
                        htmlFor="rating-feedback"
                        className="text-[14px] font-semibold text-[#302B34]"
                      >
                        Additional
                        feedback
                      </label>

                      <textarea
                        id="rating-feedback"
                        value={
                          feedback
                        }
                        onChange={(
                          event,
                        ) =>
                          setFeedback(
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Tell us what you think..."
                        rows={4}
                        maxLength={
                          500
                        }
                        className="
                          mt-3
                          w-full
                          resize-none
                          rounded-[15px]
                          border
                          border-[#E5E0E8]
                          bg-[#FAF9FB]
                          p-4
                          text-[16px]
                          leading-6
                          text-[#302B34]
                          outline-none
                          transition
                          placeholder:text-[#AAA4AE]
                          focus:border-[#9E76C7]
                          focus:bg-white
                          focus:ring-4
                          focus:ring-[#7442AD]/5
                        "
                      />

                      <p className="mt-1 text-right text-[13px] text-[#AAA4AE]">
                        {
                          feedback.length
                        }
                        /500
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SUBMIT */}

              <motion.button
                type="button"
                disabled={
                  rating ===
                    0 ||
                  submitting
                }
                whileTap={
                  rating > 0
                    ? {
                        scale:
                          0.98,
                      }
                    : undefined
                }
                onClick={
                  handleSubmit
                }
                className="
                  mt-6
                  flex
                  h-[56px]
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-[14px]
                  bg-[#7442AD]
                  text-[16px]
                  font-semibold
                  text-white
                  shadow-[0_10px_28px_rgba(116,66,173,0.22)]
                  transition
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                {submitting ? (
                  <>
                    <motion.span
                      animate={{
                        rotate:
                          360,
                      }}
                      transition={{
                        duration:
                          0.8,
                        repeat:
                          Infinity,
                        ease:
                          "linear",
                      }}
                      className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white"
                    />

                    Submitting...
                  </>
                ) : (
                  <>
                    <Send
                      size={
                        18
                      }
                    />

                    Submit
                    Rating
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/passenger/account",
                  )
                }
                className="mt-3 h-[48px] w-full text-[14px] font-semibold text-[#817A85]"
              >
                Maybe later
              </button>
            </motion.div>
          ) : (
            /* =============================
               SUCCESS
            ============================== */

            <motion.div
              key="success"
              initial={{
                opacity: 0,
                scale: 0.94,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 230,
                damping: 20,
              }}
              className="
                flex
                min-h-[70dvh]
                flex-col
                items-center
                justify-center
                text-center
              "
            >
              <motion.div
                initial={{
                  scale: 0,
                  rotate:
                    -20,
                }}
                animate={{
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 240,
                  damping: 15,
                }}
                className="
                  flex
                  h-[92px]
                  w-[92px]
                  items-center
                  justify-center
                  rounded-full
                  bg-[#E6F7EC]
                  text-[#36A665]
                  shadow-[0_15px_40px_rgba(54,166,101,0.12)]
                "
              >
                <Check
                  size={43}
                  strokeWidth={
                    3
                  }
                />
              </motion.div>

              <h1 className="mt-7 text-[24px] font-semibold tracking-[-0.02em] text-[#302B34]">
                Thank you!
              </h1>

              <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-6 text-[#918B95]">
                Your
                feedback has
                been
                submitted.
                Thanks for
                helping us
                improve
                Sur-Drive.
              </p>

              <div className="mt-5 flex items-center justify-center gap-1">
                {[
                  1,
                  2,
                  3,
                  4,
                  5,
                ].map(
                  (
                    star,
                  ) => (
                    <Star
                      key={
                        star
                      }
                      size={
                        23
                      }
                      fill={
                        star <=
                        rating
                          ? "#F5B942"
                          : "transparent"
                      }
                      className={
                        star <=
                        rating
                          ? "text-[#F5B942]"
                          : "text-[#D8D3DB]"
                      }
                    />
                  ),
                )}
              </div>

              <motion.button
                type="button"
                whileTap={{
                  scale:
                    0.98,
                }}
                onClick={
                  handleDone
                }
                className="
                  mt-9
                  h-[56px]
                  w-full
                  max-w-[420px]
                  rounded-[14px]
                  bg-[#7442AD]
                  text-[16px]
                  font-semibold
                  text-white
                "
              >
                Done
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}