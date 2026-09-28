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
} from "lucide-react";
import {
  ChangeEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PassengerAuthShell from "../../../components/passenger/auth/PassengerAuthShell";

type Gender = "Male" | "Female" | "Others" | "";

interface ProfileLocationState {
  identifier?: string;
  identifierType?: "phone" | "email";
}

interface Birthday {
  month: string;
  day: number;
}

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
];

const DAYS = Array.from(
  { length: 31 },
  (_, index) => index + 1,
);

const genders: Exclude<Gender, "">[] = [
  "Male",
  "Female",
  "Others",
];

export default function CompletePassengerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const state =
    (location.state ?? {}) as ProfileLocationState;

  const identifier = state.identifier ?? "";
  const identifierType =
    state.identifierType ?? "phone";

  const [fullName, setFullName] = useState("");

  const [phone, setPhone] = useState(
    identifierType === "phone"
      ? identifier.replace("+234", "")
      : "",
  );

  const [email, setEmail] = useState(
    identifierType === "email"
      ? identifier
      : "",
  );

  const [gender, setGender] =
    useState<Gender>("");

  const [birthday, setBirthday] =
    useState<Birthday | null>(null);

  const [profileImage, setProfileImage] =
    useState<string | null>(null);

  const [showGenderSheet, setShowGenderSheet] =
    useState(false);

  const [showBirthdaySheet, setShowBirthdaySheet] =
    useState(false);

  const isComplete = useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      phone.replace(/\D/g, "").length >= 10 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim(),
      ) &&
      gender !== "" &&
      birthday !== null
    );
  }, [
    fullName,
    phone,
    email,
    gender,
    birthday,
  ]);

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileImage(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleContinue = () => {
    if (!isComplete) return;

    /*
      Later:
      connect this to the passenger profile endpoint.
    */

    navigate("/passenger/location", {
      state: {
        fullName: fullName.trim(),
        phone,
        email: email.trim().toLowerCase(),
        gender,
        birthday,
        profileImage,
      },
    });
  };

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="
            mx-auto
            flex
            min-h-[100dvh]
            w-full
            max-w-[430px]
            flex-col
            px-5
            pb-8
            pt-5

            sm:px-6
            sm:pt-7

            lg:max-w-[480px]
            lg:pb-12
            lg:pt-10
          "
        >
          {/* Back */}

          <motion.button
            type="button"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.9 }}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              bg-white
              text-[#28232E]
              shadow-[0_3px_14px_rgba(20,15,30,0.08)]
            "
          >
            <ArrowLeft
              size={15}
              strokeWidth={1.8}
            />
          </motion.button>

          {/* Heading */}

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
              ease: [0.22, 1, 0.36, 1],
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
              Complete Your Profile
            </h1>

            <p
              className="
                mt-1
                text-[14px]
                leading-4
                text-[#AAA6AE]

                sm:text-[14px]
              "
            >
              Help our premium drivers identify you easily
            </p>
          </motion.header>

          {/* Profile photo */}

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
              h-[82px]
              w-[82px]
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
              "
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />
              ) : (
                <User
                  size={32}
                  strokeWidth={1.4}
                  className="text-[#E0D0FA]"
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
              whileTap={{ scale: 0.9 }}
              className="
                absolute
                bottom-0
                right-[-2px]
                flex
                h-[28px]
                w-[28px]
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
                size={12}
                strokeWidth={2}
              />
            </motion.button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </motion.div>

          {/* Form */}

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  delayChildren: 0.15,
                  staggerChildren: 0.07,
                },
              },
            }}
            className="mt-7 space-y-3"
          >
            <ProfileField>
              <FieldIcon>
                <User size={13} />
              </FieldIcon>

              <input
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                placeholder="Full Name"
                autoComplete="name"
                className={inputClass}
              />
            </ProfileField>

            {/* Phone */}

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
                <span className="text-[14px]">
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
                size={13}
                className="
                  ml-3
                  shrink-0
                  text-[#7442AD]/60
                "
              />

              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 11),
                  )
                }
                placeholder="803 660 0027"
                className={inputClass}
              />
            </ProfileField>

            {/* Email */}

            <ProfileField>
              <FieldIcon>
                <Mail size={13} />
              </FieldIcon>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Email Address"
                autoComplete="email"
                className={inputClass}
              />
            </ProfileField>

            {/* Gender */}

            <motion.button
              variants={fieldVariant}
              type="button"
              onClick={() =>
                setShowGenderSheet(true)
              }
              className="
                flex
                h-[50px]
                w-full
                items-center
                rounded-[10px]
                bg-[#F6F6F7]
                text-left
              "
            >
              <FieldIcon>
                <User size={13} />
              </FieldIcon>

              <span
                className={`
                  flex-1
                  text-[14px]
                  ${
                    gender
                      ? "text-[#25212A]"
                      : "text-[#C5C1C8]"
                  }
                `}
              >
                {gender || "Select Gender"}
              </span>

              <ChevronDown
                size={15}
                className="
                  mr-4
                  text-[#9B969F]
                "
              />
            </motion.button>

            {/* Birthday */}

            <motion.button
              variants={fieldVariant}
              type="button"
              onClick={() =>
                setShowBirthdaySheet(true)
              }
              className="
                flex
                h-[50px]
                w-full
                items-center
                rounded-[10px]
                bg-[#F6F6F7]
                text-left
              "
            >
              <FieldIcon>
                <CalendarDays size={13} />
              </FieldIcon>

              <span
                className={`
                  flex-1
                  text-[14px]
                  ${
                    birthday
                      ? "text-[#25212A]"
                      : "text-[#C5C1C8]"
                  }
                `}
              >
                {birthday
                  ? `${birthday.month}, ${birthday.day}`
                  : "Birthday"}
              </span>
            </motion.button>
          </motion.div>

          {/* Continue */}

          <motion.button
            type="button"
            disabled={!isComplete}
            onClick={handleContinue}
            whileHover={
              isComplete
                ? { y: -1 }
                : undefined
            }
            whileTap={
              isComplete
                ? { scale: 0.98 }
                : undefined
            }
            className={`
              mt-5
              flex
              h-[50px]
              w-full
              items-center
              justify-center
              rounded-[8px]
              text-[14px]
              font-semibold
              text-white
              transition-all
              duration-300

              ${
                isComplete
                  ? `
                    bg-[#7442AD]
                    shadow-[0_7px_18px_rgba(116,66,173,0.25)]
                  `
                  : `
                    cursor-not-allowed
                    bg-[#BBA8D1]
                  `
              }
            `}
          >
            Continue
          </motion.button>
        </motion.main>

        {/* Gender sheet */}

        <AnimatePresence>
          {showGenderSheet && (
            <GenderSheet
              value={gender}
              onClose={() =>
                setShowGenderSheet(false)
              }
              onSelect={(value) => {
                setGender(value);
                setShowGenderSheet(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* Birthday sheet */}

        <AnimatePresence>
          {showBirthdaySheet && (
            <BirthdaySheet
              value={birthday}
              onClose={() =>
                setShowBirthdaySheet(false)
              }
              onSelect={(value) => {
                setBirthday(value);
                setShowBirthdaySheet(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </PassengerAuthShell>
  );
}

/* ----------------------------------
   Profile field
----------------------------------- */

function ProfileField({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fieldVariant}
      className="
        flex
        h-[50px]
        w-full
        items-center
        overflow-hidden
        rounded-[10px]
        bg-[#F6F6F7]
      "
    >
      {children}
    </motion.div>
  );
}

function FieldIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span
      className="
        ml-3
        mr-3
        flex
        h-6
        w-6
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-[#EFE7F8]
        text-[#7442AD]
      "
    >
      {children}
    </span>
  );
}

const inputClass = `
  h-full
  min-w-0
  flex-1
  bg-transparent
  pr-4
  text-[14px]
  text-[#25212A]
  outline-none
  placeholder:text-[#C5C1C8]
`;

const fieldVariant = {
  hidden: {
    opacity: 0,
    y: 10,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

/* ----------------------------------
   Gender sheet
----------------------------------- */

function GenderSheet({
  value,
  onClose,
  onSelect,
}: {
  value: Gender;
  onClose: () => void;
  onSelect: (
    gender: Exclude<Gender, "">,
  ) => void;
}) {
  const [selected, setSelected] =
    useState<Exclude<Gender, "">>(
      value || "Female",
    );

  return (
    <BottomSheetOverlay onClose={onClose}>
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
          stiffness: 320,
          damping: 30,
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
        className="
          absolute
          bottom-0
          left-1/2
          w-full
          max-w-[430px]
          -translate-x-1/2
          rounded-t-[30px]
          bg-white
          px-6
          pb-[max(1.5rem,env(safe-area-inset-bottom))]
          pt-3
          shadow-[0_-20px_60px_rgba(0,0,0,0.10)]
        "
      >
        <SheetHandle />

        <h2
          className="
            mt-4
            text-center
            text-[15px]
            font-medium
            text-[#60719B]
          "
        >
          Select gender
        </h2>

        <div className="mt-3 flex flex-col items-center">
          {genders.map((item) => {
            const active =
              selected === item;

            return (
              <motion.button
                key={item}
                type="button"
                onClick={() =>
                  setSelected(item)
                }
                animate={{
                  scale: active ? 1.08 : 1,
                }}
                className={`
                  py-1
                  text-center
                  transition-colors

                  ${
                    active
                      ? `
                        text-[18px]
                        font-bold
                        text-[#071B54]
                      `
                      : `
                        text-[12px]
                        font-medium
                        text-[#98A1BA]
                      `
                  }
                `}
              >
                {item}
              </motion.button>
            );
          })}
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() =>
            onSelect(selected)
          }
          className="
            mt-6
            h-[50px]
            w-full
            rounded-[8px]
            bg-[#7442AD]
            text-[12px]
            font-semibold
            text-white
            shadow-[0_7px_18px_rgba(116,66,173,0.25)]
          "
        >
          Select
        </motion.button>
      </motion.div>
    </BottomSheetOverlay>
  );
}

/* ----------------------------------
   Birthday sheet
----------------------------------- */

function BirthdaySheet({
  value,
  onClose,
  onSelect,
}: {
  value: Birthday | null;
  onClose: () => void;
  onSelect: (
    birthday: Birthday,
  ) => void;
}) {
  const [month, setMonth] = useState(
    value?.month ?? "April",
  );

  const [day, setDay] = useState(
    value?.day ?? 4,
  );

  return (
    <BottomSheetOverlay onClose={onClose}>
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
          stiffness: 320,
          damping: 30,
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
        className="
          absolute
          bottom-0
          left-1/2
          w-full
          max-w-[430px]
          -translate-x-1/2
          rounded-t-[30px]
          bg-white
          px-6
          pb-[max(1.5rem,env(safe-area-inset-bottom))]
          pt-3
        "
      >
        <SheetHandle />

        <h2
          className="
            mt-4
            text-center
            text-[15px]
            font-medium
            text-[#60719B]
          "
        >
          Birthday
        </h2>

        <div
          className="
            mx-auto
            mt-4
            grid
            max-w-[220px]
            grid-cols-2
            gap-8
          "
        >
          <WheelPicker
            values={MONTHS}
            value={month}
            onChange={setMonth}
          />

          <WheelPicker
            values={DAYS}
            value={day}
            onChange={setDay}
          />
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() =>
            onSelect({
              month,
              day,
            })
          }
          className="
            mt-6
            h-[50px]
            w-full
            rounded-[8px]
            bg-[#7442AD]
            text-[12px]
            font-semibold
            text-white
            shadow-[0_7px_18px_rgba(116,66,173,0.25)]
          "
        >
          Select
        </motion.button>
      </motion.div>
    </BottomSheetOverlay>
  );
}

/* ----------------------------------
   Wheel picker
----------------------------------- */

function WheelPicker<T extends string | number>({
  values,
  value,
  onChange,
}: {
  values: T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const currentIndex = values.indexOf(value);

  const visible = [
    values[
      Math.max(0, currentIndex - 2)
    ],
    values[
      Math.max(0, currentIndex - 1)
    ],
    value,
    values[
      Math.min(
        values.length - 1,
        currentIndex + 1,
      )
    ],
    values[
      Math.min(
        values.length - 1,
        currentIndex + 2,
      )
    ],
  ];

  const move = (direction: number) => {
    const nextIndex = Math.min(
      values.length - 1,
      Math.max(
        0,
        currentIndex + direction,
      ),
    );

    onChange(values[nextIndex]);
  };

  return (
    <div
      className="
        relative
        flex
        flex-col
        items-center
      "
      onWheel={(event) => {
        event.preventDefault();

        move(
          event.deltaY > 0 ? 1 : -1,
        );
      }}
    >
      {visible.map((item, index) => {
        const active = index === 2;

        return (
          <button
            key={`${String(item)}-${index}`}
            type="button"
            onClick={() => {
              if (index < 2) move(-1);
              if (index > 2) move(1);
            }}
            className={`
              h-6
              whitespace-nowrap
              transition-all

              ${
                active
                  ? `
                    scale-110
                    text-[17px]
                    font-bold
                    text-[#071B54]
                  `
                  : `
                    text-[14px]
                    font-medium
                    text-[#9BA6C2]
                  `
              }
            `}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------------
   Shared sheet overlay
----------------------------------- */

function BottomSheetOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="
        fixed
        inset-0
        z-[1000]
        bg-black/70
        backdrop-blur-[1px]
      "
    >
      {children}
    </motion.div>
  );
}

function SheetHandle() {
  return (
    <div
      className="
        mx-auto
        h-[3px]
        w-10
        rounded-full
        bg-[#C7CEDD]
      "
    />
  );
}