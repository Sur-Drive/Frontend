import {
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
  ReactNode,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Mail,
  Pencil,
  Phone,
  User,
  X,
} from "lucide-react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import PassengerAuthShell from "../../../components/passenger/auth/PassengerAuthShell";

import {
  PassengerApiError,
} from "../../../api/passenger/passengerClient";

import {
  passengerSession,
} from "../../../api/passenger/passengerSession";

import {
  useSetPassengerPersonalInfo,
} from "../../../hooks/passenger/usePassengerAuth";
import { toast } from "sonner";

/* =========================================================
   TYPES
========================================================= */

type IdentifierType =
  | "phone"
  | "email";

type Gender =
  | ""
  | "Male"
  | "Female"
  | "Other";

interface Birthday {
  month: string;
  day: number;
  year: number;
}

interface ProfileLocationState {
  identifier?: string;
  identifierType?: IdentifierType;
}

/* =========================================================
   CONSTANTS
========================================================= */

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const GENDERS: Gender[] = [
  "Male",
  "Female",
  "Other",
];

const currentYear =
  new Date().getFullYear();

const YEARS =
  Array.from(
    {
      length: 100,
    },
    (_, index) =>
      currentYear -
      16 -
      index,
  );

const inputClass = `
  h-full
  w-full
  bg-transparent
  px-3
  text-[16px]
  text-[#25212A]
  outline-none
  placeholder:text-[#B8B4BC]
`;

/* =========================================================
   HELPERS
========================================================= */

function stripNigeriaPrefix(
  value: string,
) {
  let cleaned =
    value.replace(/\D/g, "");

  if (
    cleaned.startsWith("234")
  ) {
    cleaned =
      cleaned.slice(3);
  }

  if (
    cleaned.startsWith("0")
  ) {
    cleaned =
      cleaned.slice(1);
  }

  return cleaned.slice(0, 10);
}

function splitFullName(
  fullName: string,
) {
  const parts =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const firstName =
    parts[0] ?? "";

  const lastName =
    parts
      .slice(1)
      .join(" ");

  return {
    firstName,
    lastName,
  };
}

function getMonthNumber(
  month: string,
) {
  const index =
    MONTHS.findIndex(
      (item) =>
        item === month,
    );

  return index + 1;
}

function birthdayToApiDate(
  birthday: Birthday,
) {
  const month =
    getMonthNumber(
      birthday.month,
    );

  const monthString =
    String(month).padStart(
      2,
      "0",
    );

  const dayString =
    String(
      birthday.day,
    ).padStart(
      2,
      "0",
    );

  return `${birthday.year}-${monthString}-${dayString}`;
}

function getDaysInMonth(
  month: string,
  year: number,
) {
  const monthNumber =
    getMonthNumber(month);

  if (!monthNumber) {
    return 31;
  }

  return new Date(
    year,
    monthNumber,
    0,
  ).getDate();
}

/* =========================================================
   ANIMATION
========================================================= */

const fieldVariant = {
  hidden: {
    opacity: 0,
    y: 12,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.35,

      ease: [
        0.22,
        1,
        0.36,
        1,
      ],
    },
  },
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function ProfileField({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <motion.div
      variants={fieldVariant}
      className="
        flex
        h-[54px]
        w-full
        items-center
        overflow-hidden
        rounded-[10px]
        bg-[#F6F6F7]
        transition
        focus-within:bg-[#F3F0F6]
      "
    >
      {children}
    </motion.div>
  );
}

function FieldIcon({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="
        ml-3
        flex
        h-[30px]
        w-[30px]
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-[#ECE4F6]
        text-[#7442AD]
      "
    >
      {children}
    </div>
  );
}

/* =========================================================
   GENDER SHEET
========================================================= */

function GenderSheet({
  value,
  onClose,
  onSelect,
}: {
  value: Gender;

  onClose: () => void;

  onSelect: (
    value: Gender,
  ) => void;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      className="
        fixed
        inset-0
        z-[200]
        flex
        items-end
        justify-center
        bg-black/35
        px-0
        backdrop-blur-[2px]
        sm:px-4
      "
      onClick={onClose}
    >
      <motion.div
        initial={{
          y: "100%",
        }}
        animate={{
          y: 0,
        }}
        exit={{
          y: "100%",
        }}
        transition={{
          type: "spring",
          damping: 28,
          stiffness: 300,
        }}
        onClick={(
          event,
        ) =>
          event.stopPropagation()
        }
        className="
          w-full
          max-w-[430px]
          rounded-t-[28px]
          bg-white
          px-5
          pb-[max(2rem,env(safe-area-inset-bottom))]
          pt-4
          shadow-2xl
          sm:mb-5
          sm:rounded-[28px]
        "
      >
        <div
          className="
            mx-auto
            mb-5
            h-1
            w-10
            rounded-full
            bg-[#DDD8E2]
          "
        />

        <div
          className="flex items-center justify-between "
        >
          <div>
            <h2
              className="
                text-[20px]
                font-semibold
                tracking-[-0.02em]
                text-[#25212A]
              "
            >
              Select Gender
            </h2>

            <p
              className="
                mt-1
                text-[14px]
                text-[#9D98A2]
              "
            >
              Choose the option
              that best describes
              you.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-[#F6F6F7]
              text-[#625D67]
            "
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="mt-6 space-y-2 "
        >
          {GENDERS.map(
            (gender) => {
              const selected =
                value === gender;

              return (
                <motion.button
                  key={gender}
                  type="button"
                  whileTap={{
                    scale: 0.98,
                  }}
                  onClick={() =>
                    onSelect(
                      gender,
                    )
                  }
                  className={`
                    flex
                    h-[54px]
                    w-full
                    items-center
                    justify-between
                    rounded-[12px]
                    px-4
                    text-left
                    text-[16px]
                    font-medium
                    transition

                    ${
                      selected
                        ? `
                          bg-[#F0E8F9]
                          text-[#7442AD]
                        `
                        : `
                          bg-[#F7F7F8]
                          text-[#353039]
                        `
                    }
                  `}
                >
                  <span>
                    {gender}
                  </span>

                  <span
                    className={`
                      flex
                      h-5
                      w-5
                      items-center
                      justify-center
                      rounded-full
                      border-2

                      ${
                        selected
                          ? `
                            border-[#7442AD]
                          `
                          : `
                            border-[#D6D1DA]
                          `
                      }
                    `}
                  >
                    {selected && (
                      <span
                        className="
                          h-2.5
                          w-2.5
                          rounded-full
                          bg-[#7442AD]
                        "
                      />
                    )}
                  </span>
                </motion.button>
              );
            },
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   BIRTHDAY SHEET
========================================================= */

function BirthdaySheet({
  value,
  onClose,
  onSelect,
}: {
  value: Birthday | null;

  onClose: () => void;

  onSelect: (
    value: Birthday,
  ) => void;
}) {
  const defaultYear =
    currentYear - 25;

  const [
    month,
    setMonth,
  ] = useState(
    value?.month ??
      "January",
  );

  const [
    day,
    setDay,
  ] = useState(
    value?.day ?? 1,
  );

  const [
    year,
    setYear,
  ] = useState(
    value?.year ??
      defaultYear,
  );

  const daysInMonth =
    getDaysInMonth(
      month,
      year,
    );

  const days =
    Array.from(
      {
        length:
          daysInMonth,
      },
      (_, index) =>
        index + 1,
    );

  const safeDay =
    Math.min(
      day,
      daysInMonth,
    );

  const selectClass = `
    h-[52px]
    w-full
    rounded-[10px]
    border-0
    bg-[#F6F6F7]
    px-3
    text-[16px]
    text-[#25212A]
    outline-none
  `;

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      className="
        fixed
        inset-0
        z-[200]
        flex
        items-end
        justify-center
        bg-black/35
        backdrop-blur-[2px]
        sm:px-4
      "
      onClick={onClose}
    >
      <motion.div
        initial={{
          y: "100%",
        }}
        animate={{
          y: 0,
        }}
        exit={{
          y: "100%",
        }}
        transition={{
          type: "spring",
          damping: 28,
          stiffness: 300,
        }}
        onClick={(
          event,
        ) =>
          event.stopPropagation()
        }
        className="
          w-full
          max-w-[430px]
          rounded-t-[28px]
          bg-white
          px-5
          pb-[max(2rem,env(safe-area-inset-bottom))]
          pt-4
          shadow-2xl
          sm:mb-5
          sm:rounded-[28px]
        "
      >
        <div
          className="
            mx-auto
            mb-5
            h-1
            w-10
            rounded-full
            bg-[#DDD8E2]
          "
        />

        <div
          className="flex items-center justify-between "
        >
          <div>
            <h2
              className="
                text-[20px]
                font-semibold
                text-[#25212A]
              "
            >
              Date of Birth
            </h2>

            <p
              className="
                mt-1
                text-[14px]
                text-[#9D98A2]
              "
            >
              Select your
              birthday.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-[#F6F6F7]
              text-[#625D67]
            "
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="
            mt-6
            grid
            grid-cols-[1.35fr_0.75fr_0.9fr]
            gap-2
          "
        >
          <select
            value={month}
            onChange={(
              event,
            ) => {
              const nextMonth =
                event.target
                  .value;

              setMonth(
                nextMonth,
              );

              const nextDays =
                getDaysInMonth(
                  nextMonth,
                  year,
                );

              if (
                day >
                nextDays
              ) {
                setDay(
                  nextDays,
                );
              }
            }}
            className={
              selectClass
            }
          >
            {MONTHS.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ),
            )}
          </select>

          <select
            value={safeDay}
            onChange={(
              event,
            ) =>
              setDay(
                Number(
                  event.target
                    .value,
                ),
              )
            }
            className={
              selectClass
            }
          >
            {days.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ),
            )}
          </select>

          <select
            value={year}
            onChange={(
              event,
            ) => {
              const nextYear =
                Number(
                  event.target
                    .value,
                );

              setYear(
                nextYear,
              );

              const nextDays =
                getDaysInMonth(
                  month,
                  nextYear,
                );

              if (
                day >
                nextDays
              ) {
                setDay(
                  nextDays,
                );
              }
            }}
            className={
              selectClass
            }
          >
            {YEARS.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ),
            )}
          </select>
        </div>

        <motion.button
          type="button"
          whileTap={{
            scale: 0.98,
          }}
          onClick={() =>
            onSelect({
              month,
              day: safeDay,
              year,
            })
          }
          className="
            mt-6
            flex
            h-[54px]
            w-full
            items-center
            justify-center
            rounded-[10px]
            bg-[#7442AD]
            text-[16px]
            font-semibold
            text-white
            shadow-[0_8px_22px_rgba(116,66,173,0.25)]
          "
        >
          Confirm Birthday
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function CompletePassengerProfile() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const state =
    (location.state ??
      {}) as ProfileLocationState;

  /*
   * Prefer route state, but fall back to the identifier saved
   * during send-otp/verify-otp.
   *
   * This prevents a page refresh from losing the identifier.
   */
  const identifier =
    state.identifier ??
    passengerSession.getIdentifier() ??
    "";

  const identifierType:
    IdentifierType =
    state.identifierType ??
    (identifier.includes("@")
      ? "email"
      : "phone");

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [
    fullName,
    setFullName,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState(
    identifierType ===
      "phone"
      ? stripNigeriaPrefix(
          identifier,
        )
      : "",
  );

  const [
    email,
    setEmail,
  ] = useState(
    identifierType ===
      "email"
      ? identifier
      : "",
  );

  const [
    gender,
    setGender,
  ] =
    useState<Gender>("");

  const [
    birthday,
    setBirthday,
  ] =
    useState<Birthday | null>(
      null,
    );

  const [
    profileImage,
    setProfileImage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    showGenderSheet,
    setShowGenderSheet,
  ] = useState(false);

  const [
    showBirthdaySheet,
    setShowBirthdaySheet,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  /* =======================================================
     API
  ======================================================= */

  const {
    mutate:
      setPersonalInfo,

    isPending:
      isSaving,
  } =
    useSetPassengerPersonalInfo();

  /* =======================================================
     VALIDATION
  ======================================================= */

  const nameParts =
    useMemo(
      () =>
        fullName
          .trim()
          .split(/\s+/)
          .filter(Boolean),
      [fullName],
    );

  const hasValidName =
    nameParts.length >= 2;

  const hasValidPhone =
    stripNigeriaPrefix(
      phone,
    ).length === 10;

  const hasValidEmail =
    EMAIL_RE.test(
      email
        .trim()
        .toLowerCase(),
    );

  const isComplete =
    useMemo(() => {
      return (
        hasValidName &&
        hasValidPhone &&
        hasValidEmail &&
        gender !== "" &&
        birthday !== null
      );
    }, [
      hasValidName,
      hasValidPhone,
      hasValidEmail,
      gender,
      birthday,
    ]);

  /* =======================================================
     IMAGE
  ======================================================= */

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      setFormError(
        "Please choose a valid image.",
      );

      event.target.value =
        "";

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setFormError(
        "Profile image must be smaller than 5MB.",
      );

      event.target.value =
        "";

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result ===
        "string"
      ) {
        setProfileImage(
          reader.result,
        );

        setFormError("");
      }
    };

    reader.onerror = () => {
      setFormError(
        "Unable to load that image. Please try another one.",
      );
    };

    reader.readAsDataURL(
      file,
    );
  };

  /* =======================================================
     FIELD CHANGES
  ======================================================= */

  const handlePhoneChange = (
    value: string,
  ) => {
    setPhone(
      stripNigeriaPrefix(
        value,
      ),
    );

    if (formError) {
      setFormError("");
    }
  };

  const handleEmailChange = (
    value: string,
  ) => {
    setEmail(value);

    if (formError) {
      setFormError("");
    }
  };

  const handleNameChange = (
    value: string,
  ) => {
    setFullName(value);

    if (formError) {
      setFormError("");
    }
  };

  /* =======================================================
     CONTINUE
  ======================================================= */

  const handleContinue = () => {
    if (isSaving) {
      return;
    }

    setFormError("");

    if (!hasValidName) {
      setFormError(
        "Please enter your first and last name.",
      );

      return;
    }

    if (!hasValidPhone) {
      setFormError(
        "Please enter a valid Nigerian phone number.",
      );

      return;
    }

    if (!hasValidEmail) {
      setFormError(
        "Please enter a valid email address.",
      );

      return;
    }

    if (!gender) {
      setFormError(
        "Please select your gender.",
      );

      return;
    }

    if (!birthday) {
      setFormError(
        "Please select your date of birth.",
      );

      return;
    }

    const {
      firstName,
      lastName,
    } = splitFullName(
      fullName,
    );

    if (
      !firstName ||
      !lastName
    ) {
      setFormError(
        "Please enter your first and last name.",
      );

      return;
    }

    const dateOfBirth =
      birthdayToApiDate(
        birthday,
      );

    setPersonalInfo(
      {
        firstName,
        lastName,
        gender,
        dateOfBirth,
      },
      {
        onSuccess: (
          response,
        ) => {
          console.log(
            "[Passenger] Personal info saved:",
            response,
          );
          
          toast.success(
        "Profile completed!",
        {
          description:
            "Your personal information has been saved.",
        },
      );

          /*
           * Phone/email are deliberately NOT sent to
           * /riders/personal-info because the documented
           * payload for this endpoint is:
           *
           * firstName
           * lastName
           * gender
           * dateOfBirth
           *
           * They remain in this screen because the current
           * UI asks the passenger to complete them.
           */

          navigate(
            "/passenger/location",
            {
              replace: true,

              state: {
                identifier,

                identifierType,

                profile: {
                  fullName:
                    fullName.trim(),

                  firstName,

                  lastName,

                  phone:
                    `+234${stripNigeriaPrefix(
                      phone,
                    )}`,

                  email:
                    email
                      .trim()
                      .toLowerCase(),

                  gender,

                  dateOfBirth,

                  profileImage,
                },
              },
            },
          );
        },

        onError: (
          error,
        ) => {
          console.error(
            "[Passenger] Personal info error:",
            error,
          );

          if (
            error instanceof
            PassengerApiError
          ) {
            if (
              error.status ===
              401
            ) {
              toast.error(
          "Verification expired",
          {
            description:
              "Please verify your account again.",
          },
        );
              setFormError(
                "Your verification session has expired. Please verify your account again.",
              );

              return;
            }

            setFormError(
              error.message,
            );

            return;
          }

          toast.error(
        "Unable to save profile",
        {
          description:
            error instanceof Error
              ? error.message
              : "Please try again.",
        },
      );
      
          setFormError(
            error instanceof
              Error
              ? error.message
              : "Unable to save your profile. Please try again.",
          );
        },
      },
    );
  };

  /* =======================================================
     ROUTE PROTECTION
  ======================================================= */

  /*
   * We now allow refreshes because identifier is also stored
   * in passengerSession.
   *
   * However, this page should only be available after OTP
   * verification because personal-info needs the onboarding
   * token.
   */
  if (
    !identifier ||
    !passengerSession.getTempToken()
  ) {
    return (
      <Navigate
        to="/passenger/signup"
        replace
      />
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <PassengerAuthShell>
      <div
        className="
          min-h-[100dvh]
          w-full
          overflow-y-auto
          bg-white
        "
      >
        <motion.main
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          className="
            mx-auto
            flex
            min-h-[100dvh]
            w-full
            max-w-[430px]
            flex-col
            px-5
            pb-[max(2rem,env(safe-area-inset-bottom))]
            pt-5

            sm:px-6
            sm:pt-7

            lg:max-w-[480px]
            lg:pb-12
            lg:pt-10
          "
        >
          {/* ============================================
              BACK
          ============================================= */}

          <motion.button
            type="button"
            aria-label="Go back"
            onClick={() =>
              navigate(-1)
            }
            whileHover={{
              x: -2,
            }}
            whileTap={{
              scale: 0.9,
            }}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-white
              text-[#28232E]
              shadow-[0_3px_14px_rgba(20,15,30,0.08)]
            "
          >
            <ArrowLeft
              size={17}
              strokeWidth={
                1.8
              }
            />
          </motion.button>

          {/* ============================================
              HEADING
          ============================================= */}

          <motion.header
            initial={{
              opacity: 0,
              y: 14,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.45,

              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
            className="mt-5"
          >
            <h1
              className="
                text-[24px]
                font-semibold
                tracking-[-0.03em]
                text-[#25212A]
              "
            >
              Complete Your
              Profile
            </h1>

            <p
              className="
                mt-1.5
                text-[15px]
                leading-5
                text-[#AAA6AE]
              "
            >
              Help our premium
              drivers identify
              you easily
            </p>
          </motion.header>

          {/* ============================================
              PROFILE PHOTO
          ============================================= */}

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.85,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: 0.12,
              type: "spring",
              stiffness: 260,
              damping: 22,
            }}
            className="
              relative
              mx-auto
              mt-7
              h-[90px]
              w-[90px]
            "
          >
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                overflow-hidden
                rounded-full
                bg-[#F1E9FF]
                ring-4
                ring-[#F8F5FC]
              "
            >
              {profileImage ? (
                <img
                  src={
                    profileImage
                  }
                  alt="Passenger profile preview"
                  className="object-cover w-full h-full "
                />
              ) : (
                <User
                  size={36}
                  strokeWidth={
                    1.4
                  }
                  className="text-[#D7C2F3]"
                />
              )}
            </div>

            <motion.button
              type="button"
              aria-label="Choose profile photo"
              onClick={() =>
                fileInputRef.current?.click()
              }
              whileHover={{
                scale: 1.08,
                rotate: -5,
              }}
              whileTap={{
                scale: 0.9,
              }}
              className="
                absolute
                bottom-0
                right-[-2px]
                flex
                h-[30px]
                w-[30px]
                items-center
                justify-center
                rounded-full
                border-2
                border-white
                bg-[#7442AD]
                text-white
                shadow-md
              "
            >
              <Pencil
                size={13}
                strokeWidth={2}
              />
            </motion.button>

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept="image/*"
              onChange={
                handleImageChange
              }
              className="hidden"
            />
          </motion.div>

          {/* ============================================
              FORM
          ============================================= */}

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},

              visible: {
                transition: {
                  delayChildren:
                    0.15,

                  staggerChildren:
                    0.07,
                },
              },
            }}
            className="space-y-3 mt-7"
          >
            {/* FULL NAME */}

            <ProfileField>
              <FieldIcon>
                <User
                  size={14}
                />
              </FieldIcon>

              <input
                type="text"
                value={
                  fullName
                }
                onChange={(
                  event,
                ) =>
                  handleNameChange(
                    event.target
                      .value,
                  )
                }
                placeholder="Full Name"
                autoComplete="name"
                className={
                  inputClass
                }
              />
            </ProfileField>

            {/* PHONE */}

            <ProfileField>
              <div
                className="
                  flex
                  h-full
                  shrink-0
                  items-center
                  gap-1.5
                  border-r
                  border-white
                  px-3
                "
              >
                <span className="text-[16px]">
                  🇳🇬
                </span>

                <span
                  className="
                    text-[14px]
                    font-medium
                    text-[#4C4751]
                  "
                >
                  +234
                </span>
              </div>

              <Phone
                size={15}
                strokeWidth={
                  1.8
                }
                className="
                  ml-3
                  shrink-0
                  text-[#7442AD]/70
                "
              />

              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                onChange={(
                  event,
                ) =>
                  handlePhoneChange(
                    event.target
                      .value,
                  )
                }
                placeholder="803 660 0027"
                className={
                  inputClass
                }
              />
            </ProfileField>

            {/* EMAIL */}

            <ProfileField>
              <FieldIcon>
                <Mail
                  size={14}
                />
              </FieldIcon>

              <input
                type="email"
                value={email}
                onChange={(
                  event,
                ) =>
                  handleEmailChange(
                    event.target
                      .value,
                  )
                }
                placeholder="Email Address"
                autoComplete="email"
                className={
                  inputClass
                }
              />
            </ProfileField>

            {/* GENDER */}

            <motion.button
              variants={
                fieldVariant
              }
              type="button"
              onClick={() => {
                setFormError(
                  "",
                );

                setShowGenderSheet(
                  true,
                );
              }}
              className="
                flex
                h-[54px]
                w-full
                items-center
                rounded-[10px]
                bg-[#F6F6F7]
                text-left
                transition
                hover:bg-[#F3F0F6]
              "
            >
              <FieldIcon>
                <User
                  size={14}
                />
              </FieldIcon>

              <span
                className={`
                  flex-1
                  text-[16px]

                  ${
                    gender
                      ? "text-[#25212A]"
                      : "text-[#B8B4BC]"
                  }
                `}
              >
                {gender ||
                  "Select Gender"}
              </span>

              <ChevronDown
                size={17}
                className="
                  mr-4
                  text-[#9B969F]
                "
              />
            </motion.button>

            {/* BIRTHDAY */}

            <motion.button
              variants={
                fieldVariant
              }
              type="button"
              onClick={() => {
                setFormError(
                  "",
                );

                setShowBirthdaySheet(
                  true,
                );
              }}
              className="
                flex
                h-[54px]
                w-full
                items-center
                rounded-[10px]
                bg-[#F6F6F7]
                text-left
                transition
                hover:bg-[#F3F0F6]
              "
            >
              <FieldIcon>
                <CalendarDays
                  size={14}
                />
              </FieldIcon>

              <span
                className={`
                  flex-1
                  text-[16px]

                  ${
                    birthday
                      ? "text-[#25212A]"
                      : "text-[#B8B4BC]"
                  }
                `}
              >
                {birthday
                  ? `${birthday.month} ${birthday.day}, ${birthday.year}`
                  : "Date of Birth"}
              </span>

              <ChevronDown
                size={17}
                className="
                  mr-4
                  text-[#9B969F]
                "
              />
            </motion.button>
          </motion.div>

          {/* ============================================
              ERROR
          ============================================= */}

          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -6,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  height:
                    "auto",
                }}
                exit={{
                  opacity: 0,
                  y: -6,
                  height: 0,
                }}
                className="overflow-hidden"
              >
                <div
                  className="
                    mt-4
                    rounded-[10px]
                    bg-red-50
                    px-4
                    py-3
                  "
                >
                  <p
                    className="
                      text-[14px]
                      font-medium
                      leading-5
                      text-red-600
                    "
                  >
                    {formError}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ============================================
              CONTINUE
          ============================================= */}

          <motion.button
            type="button"
            disabled={
              !isComplete ||
              isSaving
            }
            onClick={
              handleContinue
            }
            whileHover={
              isComplete &&
              !isSaving
                ? {
                    y: -2,
                  }
                : undefined
            }
            whileTap={
              isComplete &&
              !isSaving
                ? {
                    scale:
                      0.98,
                  }
                : undefined
            }
            className={`
              mt-5
              flex
              h-[54px]
              w-full
              items-center
              justify-center
              rounded-[9px]
              text-[16px]
              font-semibold
              text-white
              transition-all
              duration-300

              ${
                isComplete &&
                !isSaving
                  ? `
                    bg-[#7442AD]
                    shadow-[0_8px_22px_rgba(116,66,173,0.25)]
                  `
                  : `
                    cursor-not-allowed
                    bg-[#BBA8D1]
                  `
              }
            `}
          >
            {isSaving ? (
              <span
                className="
                  flex
                  items-center
                  gap-2.5
                "
              >
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
                  className="
                    h-[18px]
                    w-[18px]
                    rounded-full
                    border-2
                    border-white/40
                    border-t-white
                  "
                />

                Saving
                profile...
              </span>
            ) : (
              "Continue"
            )}
          </motion.button>

          <p
            className="
              mt-3
              text-center
              text-[13px]
              leading-5
              text-[#AAA6AE]
            "
          >
            Your details help
            us personalize your
            SUR-DRIVE experience.
          </p>
        </motion.main>

        {/* ============================================
            GENDER SHEET
        ============================================= */}

        <AnimatePresence>
          {showGenderSheet && (
            <GenderSheet
              value={gender}
              onClose={() =>
                setShowGenderSheet(
                  false,
                )
              }
              onSelect={(
                value,
              ) => {
                setGender(
                  value,
                );

                setFormError(
                  "",
                );

                setShowGenderSheet(
                  false,
                );
              }}
            />
          )}
        </AnimatePresence>

        {/* ============================================
            BIRTHDAY SHEET
        ============================================= */}

        <AnimatePresence>
          {showBirthdaySheet && (
            <BirthdaySheet
              value={
                birthday
              }
              onClose={() =>
                setShowBirthdaySheet(
                  false,
                )
              }
              onSelect={(
                value,
              ) => {
                setBirthday(
                  value,
                );

                setFormError(
                  "",
                );

                setShowBirthdaySheet(
                  false,
                );
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </PassengerAuthShell>
  );
}

