import { motion } from "framer-motion";
import {
  BadgePercent,
  BriefcaseBusiness,
  Crosshair,
  Home,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useEffect,
  useState,
} from "react";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";

import PassengerBottomNav from "../../../components/passenger/PassengerBottomNav";

type HomeBanner =
  | "identity"
  | "emergency"
  | "promotion";

interface RecentDestination {
  id: number;
  name: string;
  address: string;
  type: "home" | "location";
}

/*
 * TEMPORARY UI DATA.
 *
 * Once the passenger APIs are connected:
 * - recentDestinations comes from passenger trip history
 * - banner is derived from passenger profile/state
 * - saved locations come from backend
 */
const recentDestinations: RecentDestination[] = [
  {
    id: 1,
    name: "14 Admiralty Way",
    address: "Lekki Phase 1, Lagos",
    type: "home",
  },
  {
    id: 2,
    name: "25 Marina Street",
    address: "Lagos Island, Lagos",
    type: "location",
  },
  {
    id: 3,
    name: "14 Admiralty Way",
    address: "Lekki Phase 1, Lagos",
    type: "location",
  },
];

export default function PassengerHome() {
  const navigate = useNavigate();

  /*
   * Change to "identity" to see the empty-state
   * design from the first Figma screen.
   */
  const banner: HomeBanner = "promotion";

  /*
   * Set false to reproduce the first Figma screen.
   */
  const hasRecentDestinations = true;

  const handleWhereTo = () => {
    navigate("/passenger/book-ride");
  };

  const DEFAULT_LOCATION = {
  lat: 6.5244,
  lng: 3.3792,
};

const [userLocation, setUserLocation] =
  useState(DEFAULT_LOCATION);

useEffect(() => {
  if (!navigator.geolocation) {
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    () => {
      // Existing Lagos fallback remains.
    },
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    },
  );
}, []);

  return (
    <div
      className="
        relative min-h-[100dvh]
        w-full bg-[#F8F8FA]
        text-[#25212A]
      "
    >
      {/* ==============================
          MAP
      =============================== */}

      <section
        className="
          fixed inset-x-0 top-0
          h-[42dvh] min-h-[300px]
          overflow-hidden
          bg-[#F3F3F3]

          lg:h-[100dvh]
        "
      >
        <PassengerMap
  center={userLocation}
  userLocation={userLocation}
  zoom={15}
/>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          className="
            absolute right-5 top-6
            flex h-[46px] items-center
            gap-2 rounded-full
            bg-white px-4
            text-[14px] font-semibold
            text-[#25212A]
            shadow-[0_6px_24px_rgba(0,0,0,0.10)]

            sm:right-7
            lg:right-8 lg:top-8
          "
        >
          <span
            className="
              flex h-7 w-7 items-center
              justify-center rounded-full
              bg-[#F5F2F8]
            "
          >
            <Crosshair
              size={17}
              strokeWidth={2}
            />
          </span>

          Location
        </motion.button>

        {/* Current location */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.5,
            y: -15,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 220,
            damping: 15,
          }}
          className="
            absolute left-1/2
            top-[68%]
            -translate-x-1/2
            -translate-y-1/2
          "
        >
          <motion.div
            animate={{
              scale: [1, 1.7],
              opacity: [0.2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className="
              absolute inset-0
              rounded-full bg-[#7442AD]
            "
          />

          <MapPin
            size={48}
            fill="#7442AD"
            stroke="#7442AD"
            className="
              relative
              drop-shadow-[0_6px_12px_rgba(116,66,173,0.28)]
            "
          />
        </motion.div>
      </section>

      {/* ==============================
          MOBILE CONTENT PANEL
      =============================== */}

      <motion.main
        initial={{
          opacity: 0,
          y: 80,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="
          absolute left-0 right-0
          top-[34dvh]
          z-20
          min-h-[66dvh]
          rounded-t-[32px]
          bg-white
          px-5
          pb-[110px]
          pt-3

          sm:px-7

          lg:fixed
          lg:left-8
          lg:right-auto
          lg:top-1/2
          lg:min-h-0
          lg:max-h-[calc(100dvh-64px)]
          lg:w-[480px]
          lg:-translate-y-1/2
          lg:overflow-y-auto
          lg:rounded-[28px]
          lg:px-6
          lg:pb-[100px]
          lg:shadow-[0_20px_70px_rgba(25,15,40,0.18)]
        "
      >
        {/* Sheet handle */}

        <div
          className="
            mx-auto mb-5
            h-[4px] w-12
            rounded-full
            bg-[#C8C4D2]
          "
        />

        <HomeStatusBanner type={banner} />

        {/* Search */}

        <motion.button
          type="button"
          onClick={handleWhereTo}
          whileHover={{
            borderColor: "#CDB8E5",
          }}
          whileTap={{ scale: 0.99 }}
          className="
            mt-5
            flex h-[54px]
            w-full items-center
            gap-3 rounded-[12px]
            border border-transparent
            bg-[#F5F5F6]
            px-4
            text-left
            transition-colors
          "
        >
          <Search
            size={21}
            strokeWidth={1.8}
            className="shrink-0 text-[#1F315D]"
          />

          <span
            className="
              text-[16px]
              text-[#A09CA4]
            "
          >
            Where to?
          </span>
        </motion.button>

        {/* Saved locations */}

        <div
          className="
            mt-5 flex
            flex-wrap items-center
            gap-2.5
          "
        >
          <SavedPlaceButton
            icon={Home}
            label={
              hasRecentDestinations
                ? "Home"
                : "Add Home"
            }
          />

          <SavedPlaceButton
            icon={BriefcaseBusiness}
            label={
              hasRecentDestinations
                ? "Work"
                : "Add Work"
            }
          />

          <SavedPlaceButton
            icon={Plus}
            label="Add"
            dashed
          />
        </div>

        {/* Recent destinations */}

        <div className="mt-6">
          {hasRecentDestinations ? (
            <RecentDestinations
              destinations={
                recentDestinations
              }
              onSelect={handleWhereTo}
            />
          ) : (
            <EmptyRecentDestinations />
          )}
        </div>
      </motion.main>

      <PassengerBottomNav />
    </div>
  );
}

/* =====================================
   STATUS BANNER
===================================== */

function HomeStatusBanner({
  type,
}: {
  type: HomeBanner;
}) {
  const content = {
    identity: {
      icon: ShieldCheck,
      title: "Verify your identity",
      description:
        "This helps keep rides safe",
      wrapper:
        "bg-[#E4F8E9] text-[#276A42]",
      iconBackground: "bg-[#C6F0D2]",
      iconColor: "text-[#35B76C]",
    },

    emergency: {
      icon: Siren,
      title: "Emergency Contact",
      description:
        "Set emergency contact we can call in case of emergency",
      wrapper:
        "bg-[#FCE8E3] text-[#413337]",
      iconBackground: "bg-[#FFD7CE]",
      iconColor: "text-[#FF654D]",
    },

    promotion: {
      icon: BadgePercent,
      title: "10% off your next 5 rides",
      description: "View details",
      wrapper:
        "bg-[#F0E7FA] text-[#392C4C]",
      iconBackground: "bg-[#E1D0F5]",
      iconColor: "text-[#7442AD]",
    },
  }[type];

  const Icon = content.icon;

  return (
    <motion.button
      type="button"
      initial={{
        opacity: 0,
        x: 25,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      whileHover={{
        y: -1,
      }}
      whileTap={{
        scale: 0.99,
      }}
      className={`
        flex min-h-[62px]
        w-full items-center
        gap-3 rounded-[12px]
        px-3.5 py-3
        text-left
        ${content.wrapper}
      `}
    >
      <span
        className={`
          flex h-9 w-9
          shrink-0 items-center
          justify-center rounded-full
          ${content.iconBackground}
          ${content.iconColor}
        `}
      >
        <Icon
          size={19}
          strokeWidth={2}
        />
      </span>

      <span className="min-w-0">
        <span
          className="
            block text-[16px]
            font-semibold
          "
        >
          {content.title}
        </span>

        <span
          className="
            mt-0.5 block
            text-[13px]
            leading-[1.35]
            opacity-70
          "
        >
          {content.description}
        </span>
      </span>
    </motion.button>
  );
}

/* =====================================
   SAVED PLACE
===================================== */

function SavedPlaceButton({
  icon: Icon,
  label,
  dashed = false,
}: {
  icon: typeof Home;
  label: string;
  dashed?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{
        y: -2,
        backgroundColor: "#FAF7FD",
      }}
      whileTap={{
        scale: 0.95,
      }}
      className={`
        flex h-[42px]
        items-center gap-2
        rounded-[11px]
        border
        px-3.5
        text-[14px]
        font-medium
        text-[#5E367F]

        ${
          dashed
            ? "border-dashed border-[#D7C6E7] bg-white"
            : "border-[#E9E0F1] bg-[#FBF9FD]"
        }
      `}
    >
      <Icon
        size={16}
        strokeWidth={1.8}
      />

      {label}
    </motion.button>
  );
}

/* =====================================
   RECENT DESTINATIONS
===================================== */

function RecentDestinations({
  destinations,
  onSelect,
}: {
  destinations: RecentDestination[];
  onSelect: () => void;
}) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: 0.2,
      }}
    >
      <h2
        className="
          mb-4 text-[18px]
          font-semibold
          text-[#302B34]
        "
      >
        Recent Destinations
      </h2>

      <div
        className="
          overflow-hidden
          rounded-[20px]
          bg-white
          px-4
          shadow-[0_6px_30px_rgba(28,20,38,0.05)]
        "
      >
        {destinations.map(
          (destination, index) => (
            <motion.button
              key={destination.id}
              type="button"
              onClick={onSelect}
              whileHover={{
                x: 3,
              }}
              whileTap={{
                scale: 0.99,
              }}
              className={`
                flex w-full
                items-center
                gap-3 py-3.5
                text-left

                ${
                  index !==
                  destinations.length - 1
                    ? "border-b border-[#D9DFEA]"
                    : ""
                }
              `}
            >
              <span
                className="
                  flex h-8 w-8
                  shrink-0
                  items-center
                  justify-center
                  text-[#7C90BD]
                "
              >
                {destination.type ===
                "home" ? (
                  <Home
                    size={21}
                    fill="currentColor"
                    strokeWidth={1.5}
                  />
                ) : (
                  <MapPin
                    size={21}
                    fill="currentColor"
                    strokeWidth={1.5}
                  />
                )}
              </span>

              <span className="min-w-0">
                <span
                  className="
                    block truncate
                    text-[16px]
                    font-medium
                    text-[#302B34]
                  "
                >
                  {destination.name}
                </span>

                <span
                  className="
                    mt-0.5
                    block truncate
                    text-[13px]
                    text-[#7487B3]
                  "
                >
                  {destination.address}
                </span>
              </span>
            </motion.button>
          ),
        )}
      </div>
    </motion.section>
  );
}

/* =====================================
   EMPTY STATE
===================================== */

function EmptyRecentDestinations() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: 0.2,
      }}
      className="
        flex flex-col
        items-center
        px-4
        pb-8
        pt-5
        text-center
      "
    >
      <motion.div
        animate={{
          y: [0, -5, 0],
        }}
        transition={{
          duration: 2.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          flex h-[72px]
          w-[72px]
          items-center
          justify-center
          rounded-full
          bg-[#F0E8F8]
          ring-[10px]
          ring-[#F8F4FC]
        "
      >
        <MapPin
          size={34}
          fill="#7442AD"
          stroke="#7442AD"
        />
      </motion.div>

      <h2
        className="
          mt-7
          text-[20px]
          font-semibold
          text-[#302B34]
        "
      >
        No recent destinations
      </h2>

      <p
        className="
          mt-2
          max-w-[330px]
          text-[15px]
          leading-[1.55]
          text-[#9B969F]
        "
      >
        Your recent trips will appear here.
        Start by searching for a destination.
      </p>
    </motion.div>
  );
}
