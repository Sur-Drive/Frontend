import {
  useEffect,
} from "react";

import {
  BriefcaseBusiness,
  Crosshair,
  Home,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Siren,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "sonner";

import PassengerBottomNav from "../../../components/passenger/PassengerBottomNav";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";

import {
  passengerLocationApi,
} from "../../../api/passenger/location";

import {
  usePassengerProfile,
  usePassengerRecentDestinations,
  usePassengerSavedPlaces,
} from "../../../hooks/passenger/usePassengerHome";

import type {
  PassengerRecentDestination,
  PassengerSavedPlace,
} from "../../../types/passengerHome";

/* =====================================
   TYPES
===================================== */

type HomeBanner =
  | "emergency";

/* =====================================
   HOME
===================================== */

export default function PassengerHome() {
  const navigate =
    useNavigate();

  /* -------------------------------------
     SERVER DATA
  ------------------------------------- */

  const profileQuery =
    usePassengerProfile();

  const savedPlacesQuery =
    usePassengerSavedPlaces();

  const recentDestinationsQuery =
    usePassengerRecentDestinations();

  const profile =
    profileQuery.data;

  const savedPlaces =
    savedPlacesQuery.data ?? [];

  const recentDestinations =
    recentDestinationsQuery.data ?? [];

  /* -------------------------------------
     DERIVED DATA
  ------------------------------------- */

  const homePlace =
    savedPlaces.find(
      (place) =>
        place.type === "home",
    );

  const workPlace =
    savedPlaces.find(
      (place) =>
        place.type === "work",
    );

  const hasRecentDestinations =
    recentDestinations.length > 0;

  const hasUsableLocation =
    profile?.locationEnabled === true &&
    profile.currentLat !== null &&
    profile.currentLng !== null;

  const userLocation =
    hasUsableLocation
      ? {
          lat: profile.currentLat!,
          lng: profile.currentLng!,
        }
      : null;

  /*
   * We currently only have a real backend
   * condition for the emergency-contact
   * banner.
   *
   * Do not display fake promotions.
   */
  const banner: HomeBanner | null =
    profile &&
    profile.emergencyContactsCount === 0
      ? "emergency"
      : null;

  const isInitialLoading =
    profileQuery.isLoading ||
    savedPlacesQuery.isLoading ||
    recentDestinationsQuery.isLoading;

  /*
   * Profile is essential to the Home page.
   * Saved places/recent destinations can
   * gracefully fall back to empty arrays.
   */
  const hasInitialError =
    profileQuery.isError;

  /* -------------------------------------
     LOCATION ONBOARDING GUARD
  ------------------------------------- */

  useEffect(() => {
    if (
      profile &&
      !hasUsableLocation
    ) {
      navigate(
        "/passenger/location",
        {
          replace: true,
        },
      );
    }
  }, [
    profile,
    hasUsableLocation,
    navigate,
  ]);

  /* -------------------------------------
     NAVIGATION
  ------------------------------------- */

  const handleWhereTo = () => {
    navigate(
      "/passenger/book-ride",
    );
  };

  const handleSavedPlace = (
    place: PassengerSavedPlace,
  ) => {
    navigate(
      "/passenger/book-ride",
      {
        state: {
          destination: {
            id: place.id,
            name: place.name,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
            savedPlaceId: place.id,
            type: place.type,
          },
        },
      },
    );
  };

  const handleAddSavedPlace = (
  type?: "home" | "work",
) => {
  if (type) {
    navigate(
      `/passenger/account/saved-places/location/${type}`,
    );

    return;
  }

  navigate(
    "/passenger/account/saved-places/location/new",
  );
};

  const handleRecentDestination = (
    destination:
      PassengerRecentDestination,
  ) => {
    navigate(
      "/passenger/book-ride",
      {
        state: {
          destination,
        },
      },
    );
  };

  const handleBannerClick = () => {
    if (
      banner === "emergency"
    ) {
      navigate(
        "/passenger/account/safety/emergency-contacts/add",
      );
    }
  };

  /* -------------------------------------
     MANUAL LOCATION REFRESH
  ------------------------------------- */

  const handleRefreshLocation = () => {
    /*
     * Do not request browser GPS
     * automatically on page mount.
     *
     * GPS is requested here because the
     * passenger explicitly pressed the
     * Location button.
     */
    if (
      !navigator.geolocation
    ) {
      toast.error(
        "Location unavailable",
        {
          description:
            "Location services are not supported by this browser.",
        },
      );

      return;
    }

    const toastId =
      toast.loading(
        "Updating your location...",
      );

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const {
            latitude,
            longitude,
            accuracy,
            heading,
            speed,
          } = position.coords;

          await passengerLocationApi.updateLocation({
            lat: latitude,
            lng: longitude,
            accuracy,

            ...(heading !== null
              ? {
                  heading,
                }
              : {}),

            ...(speed !== null
              ? {
                  speed,
                }
              : {}),
          });

          /*
           * Profile is the Home page's
           * authoritative location summary.
           */
          await profileQuery.refetch();

          toast.success(
            "Location updated",
            {
              id: toastId,
              description:
                "Your current location has been refreshed.",
            },
          );
        } catch (error) {
          console.error(
            "[Passenger Home] Failed to update location:",
            error,
          );

          toast.error(
            "Couldn't update location",
            {
              id: toastId,
              description:
                "Please try again.",
            },
          );
        }
      },

      (error) => {
        console.error(
          "[Passenger Home] Browser location error:",
          error,
        );

        let message =
          "We couldn't access your location.";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          message =
            "Location permission is disabled. Enable it in your browser settings and try again.";
        } else if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          message =
            "Your current location is unavailable. Please try again.";
        } else if (
          error.code ===
          error.TIMEOUT
        ) {
          message =
            "Getting your location took too long. Please try again.";
        }

        toast.error(
          "Location unavailable",
          {
            id: toastId,
            description: message,
          },
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 0,
      },
    );
  };

  /* =====================================
     LOCATION REDIRECT
  ===================================== */

  if (
    profile &&
    !hasUsableLocation
  ) {
    return (
      <HomeLoadingState
        message="Setting up your location..."
      />
    );
  }

  /* =====================================
     LOADING
  ===================================== */

  if (isInitialLoading) {
    return (
      <HomeLoadingState
        message="Getting things ready..."
      />
    );
  }

  /* =====================================
     ERROR
  ===================================== */

  if (
    hasInitialError ||
    !profile
  ) {
    return (
      <HomeErrorState
        onRetry={() => {
          void profileQuery.refetch();
          void savedPlacesQuery.refetch();
          void recentDestinationsQuery.refetch();
        }}
      />
    );
  }

  /*
   * TypeScript now knows this exists
   * because of the guards above.
   */
  if (!userLocation) {
    return null;
  }

  /* =====================================
     PAGE
  ===================================== */

  return (
    <div
      className="
        relative
        min-h-[100dvh]
        w-full
        bg-[#F8F8FA]
        text-[#25212A]
      "
    >
      {/* =================================
          MAP
      ================================= */}

      <section
        className="
          fixed inset-x-0 top-0
          h-[42dvh]
          min-h-[300px]
          overflow-hidden
          bg-[#F3F3F3]

          lg:h-[100dvh]
        "
      >
        <PassengerMap
          center={userLocation}
          userLocation={
            userLocation
          }
          zoom={15}
        />

        {/* Location refresh */}

        <motion.button
          type="button"
          onClick={
            handleRefreshLocation
          }
          whileHover={{
            scale: 1.03,
          }}
          whileTap={{
            scale: 0.95,
          }}
          className="
            absolute
            right-5 top-6

            flex h-[46px]
            items-center
            gap-2

            rounded-full
            bg-white
            px-4

            text-[14px]
            font-semibold
            text-[#25212A]

            shadow-[0_6px_24px_rgba(0,0,0,0.10)]

            sm:right-7

            lg:right-8
            lg:top-8
          "
        >
          <span
            className="
              flex h-7 w-7
              items-center
              justify-center
              rounded-full
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

        {/* Current location marker overlay */}

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
            pointer-events-none
            absolute
            left-1/2
            top-[68%]
            -translate-x-1/2
            -translate-y-1/2
          "
        >
          <motion.div
            animate={{
              scale: [
                1,
                1.7,
              ],
              opacity: [
                0.2,
                0,
              ],
            }}
            transition={{
              duration: 2,
              repeat:
                Infinity,
              ease: "easeOut",
            }}
            className="
              absolute inset-0
              rounded-full
              bg-[#7442AD]
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

      {/* =================================
          CONTENT PANEL
      ================================= */}

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
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="
          absolute
          left-0 right-0
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
            mx-auto
            mb-5
            h-[4px]
            w-12
            rounded-full
            bg-[#C8C4D2]
          "
        />

        {/* Status banner */}

        {banner && (
          <HomeStatusBanner
            type={banner}
            onClick={
              handleBannerClick
            }
          />
        )}

        {/* Search */}

        <motion.button
          type="button"
          onClick={
            handleWhereTo
          }
          whileHover={{
            borderColor:
              "#CDB8E5",
          }}
          whileTap={{
            scale: 0.99,
          }}
          className={`
            ${
              banner
                ? "mt-5"
                : "mt-1"
            }

            flex h-[54px]
            w-full
            items-center
            gap-3

            rounded-[12px]
            border
            border-transparent
            bg-[#F5F5F6]

            px-4
            text-left

            transition-colors
          `}
        >
          <Search
            size={21}
            strokeWidth={1.8}
            className="
              shrink-0
              text-[#1F315D]
            "
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

        {/* Saved places */}

        <div
          className="
            mt-5
            flex flex-wrap
            items-center
            gap-2.5
          "
        >
          <SavedPlaceButton
            icon={Home}
            label={
              homePlace
                ? "Home"
                : "Add Home"
            }
            onClick={() => {
              if (
                homePlace
              ) {
                handleSavedPlace(
                  homePlace,
                );

                return;
              }

              handleAddSavedPlace(
                "home",
              );
            }}
          />

          <SavedPlaceButton
            icon={
              BriefcaseBusiness
            }
            label={
              workPlace
                ? "Work"
                : "Add Work"
            }
            onClick={() => {
              if (
                workPlace
              ) {
                handleSavedPlace(
                  workPlace,
                );

                return;
              }

              handleAddSavedPlace(
                "work",
              );
            }}
          />

          <SavedPlaceButton
            icon={Plus}
            label="Add"
            dashed
            onClick={() =>
              handleAddSavedPlace()
            }
          />
        </div>

        {/* Recent destinations */}

        <div className="mt-6">
          {recentDestinationsQuery.isError ? (
            <RecentDestinationsError
              onRetry={() => {
                void recentDestinationsQuery.refetch();
              }}
            />
          ) : hasRecentDestinations ? (
            <RecentDestinations
              destinations={
                recentDestinations
              }
              onSelect={
                handleRecentDestination
              }
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
  onClick,
}: {
  type: HomeBanner;
  onClick?: () => void;
}) {
  const content = {
    emergency: {
      icon: Siren,

      title:
        "Emergency Contact",

      description:
        "Set an emergency contact we can call in case of emergency",

      wrapper:
        "bg-[#FCE8E3] text-[#413337]",

      iconBackground:
        "bg-[#FFD7CE]",

      iconColor:
        "text-[#FF654D]",
    },
  }[type];

  const Icon =
    content.icon;

  return (
    <motion.button
      type="button"
      onClick={onClick}
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
        flex
        min-h-[62px]
        w-full
        items-center
        gap-3

        rounded-[12px]

        px-3.5
        py-3

        text-left

        ${content.wrapper}
      `}
    >
      <span
        className={`
          flex
          h-9 w-9
          shrink-0
          items-center
          justify-center
          rounded-full

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
            block
            text-[16px]
            font-semibold
          "
        >
          {content.title}
        </span>

        <span
          className="
            mt-0.5
            block
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
   SAVED PLACE BUTTON
===================================== */

function SavedPlaceButton({
  icon: Icon,
  label,
  dashed = false,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  dashed?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{
        y: -2,
        backgroundColor:
          "#FAF7FD",
      }}
      whileTap={{
        scale: 0.95,
      }}
      className={`
        flex h-[42px]
        items-center
        gap-2

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
  destinations:
    PassengerRecentDestination[];

  onSelect: (
    destination:
      PassengerRecentDestination,
  ) => void;
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
          mb-4
          text-[18px]
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
          (
            destination,
            index,
          ) => {
            const title =
              destination.name?.trim() ||
              destination.address;

            return (
              <motion.button
                key={
                  destination.id
                }
                type="button"
                onClick={() =>
                  onSelect(
                    destination,
                  )
                }
                whileHover={{
                  x: 3,
                }}
                whileTap={{
                  scale: 0.99,
                }}
                className={`
                  flex w-full
                  items-center
                  gap-3
                  py-3.5
                  text-left

                  ${
                    index !==
                    destinations.length -
                      1
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
                  <MapPin
                    size={21}
                    fill="currentColor"
                    strokeWidth={
                      1.5
                    }
                  />
                </span>

                <span className="min-w-0">
                  <span
                    className="
                      block
                      truncate
                      text-[16px]
                      font-medium
                      text-[#302B34]
                    "
                  >
                    {title}
                  </span>

                  {destination.name &&
                    destination.name.trim() !==
                      destination.address && (
                      <span
                        className="
                          mt-0.5
                          block
                          truncate
                          text-[13px]
                          text-[#7487B3]
                        "
                      >
                        {
                          destination.address
                        }
                      </span>
                    )}
                </span>
              </motion.button>
            );
          },
        )}
      </div>
    </motion.section>
  );
}

/* =====================================
   EMPTY RECENT DESTINATIONS
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
      className="flex flex-col items-center px-4 pt-5 pb-8 text-center "
    >
      <motion.div
        animate={{
          y: [
            0,
            -5,
            0,
          ],
        }}
        transition={{
          duration: 2.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          flex
          h-[72px]
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
        Your recent trips will
        appear here. Start by
        searching for a
        destination.
      </p>
    </motion.div>
  );
}

/* =====================================
   RECENT DESTINATIONS ERROR
===================================== */

function RecentDestinationsError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        rounded-[16px]
        bg-[#FAF8FC]
        px-5
        py-6
        text-center
      "
    >
      <MapPin
        size={28}
        className="
          mx-auto
          text-[#7442AD]
        "
      />

      <h2
        className="
          mt-3
          text-[17px]
          font-semibold
          text-[#302B34]
        "
      >
        Couldn't load recent destinations
      </h2>

      <button
        type="button"
        onClick={onRetry}
        className="
          mt-3
          inline-flex
          items-center
          gap-2

          text-[14px]
          font-semibold
          text-[#7442AD]
        "
      >
        <RefreshCw
          size={15}
        />

        Try again
      </button>
    </motion.div>
  );
}

/* =====================================
   LOADING STATE
===================================== */

function HomeLoadingState({
  message,
}: {
  message: string;
}) {
  return (
    <div
      className="
        flex
        min-h-[100dvh]
        items-center
        justify-center
        bg-white
      "
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="flex flex-col items-center gap-3 "
      >
        <LoaderCircle
          size={30}
          className="
            animate-spin
            text-[#7442AD]
          "
        />

        <p
          className="
            text-[15px]
            text-[#77717D]
          "
        >
          {message}
        </p>
      </motion.div>
    </div>
  );
}

/* =====================================
   ERROR STATE
===================================== */

function HomeErrorState({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div
      className="
        flex
        min-h-[100dvh]
        items-center
        justify-center
        bg-white
        px-6
      "
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="
          w-full
          max-w-[360px]
          text-center
        "
      >
        <div
          className="
            mx-auto
            flex h-[62px]
            w-[62px]
            items-center
            justify-center
            rounded-full
            bg-[#F3ECFA]
          "
        >
          <RefreshCw
            size={27}
            className="
              text-[#7442AD]
            "
          />
        </div>

        <h1
          className="
            mt-5
            text-[20px]
            font-semibold
            text-[#25212A]
          "
        >
          Couldn't load your account
        </h1>

        <p
          className="
            mt-2
            text-[15px]
            leading-[1.5]
            text-[#8D8891]
          "
        >
          Check your connection
          and try again.
        </p>

        <motion.button
          type="button"
          onClick={onRetry}
          whileTap={{
            scale: 0.98,
          }}
          className="
            mt-5
            inline-flex
            h-[48px]
            items-center
            justify-center
            gap-2

            rounded-[10px]
            bg-[#7442AD]

            px-5

            text-[16px]
            font-semibold
            text-white
          "
        >
          <RefreshCw
            size={18}
          />

          Try Again
        </motion.button>
      </motion.div>
    </div>
  );
}


