import {
  BadgePercent,
  Building2,
  CircleHelp,
  CreditCard,
  LoaderCircle,
  LogOut,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Star,
  UserRound,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "sonner";

import PassengerBottomNav from "../../../components/passenger/PassengerBottomNav";

import AccountMenuItem from "../../../components/passenger/account/AccountMenuItem";

import {
  usePassengerProfileQuery,
} from "../../../hooks/passenger/usePassengerProfileApi";

import {
  getPassengerApiError,
} from "../../../api/passenger/getPassengerApiError";
import { passengerAuthApi } from "../../../api/passenger/passengerAuth.api";
import { useQueryClient } from "@tanstack/react-query";

export default function PassengerAccount() {
  const navigate =
    useNavigate();

    const queryClient =
    useQueryClient();

  const [
    pageError,
    setPageError,
  ] = useState("");

  const [
    showLogoutModal,
    setShowLogoutModal,
  ] = useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  /*
   * ------------------------------------------------
   * BACKEND PROFILE
   * ------------------------------------------------
   */

  const profileQuery =
    usePassengerProfileQuery();

  const profile =
    profileQuery.data;

  /*
   * ------------------------------------------------
   * DISPLAY VALUES
   * ------------------------------------------------
   */

  const fullName =
    profile?.fullName?.trim() ||
    "Passenger";

  const phoneNumber =
    profile?.phoneNumber?.trim() ||
    "";

  const email =
    profile?.email?.trim() ||
    "";

  const profilePicture =
    profile?.profilePicture ||
    null;

  const rating =
    profile?.rating ?? null;

  const initial =
    fullName !== "Passenger"
      ? fullName
          .charAt(0)
          .toUpperCase()
      : "";

  /*
   * ------------------------------------------------
   * QUERY STATE
   * ------------------------------------------------
   */

  const loading =
    profileQuery.isPending;

  const refreshing =
    profileQuery.isFetching &&
    !profileQuery.isPending;

  const queryError =
    profileQuery.error
      ? getPassengerApiError(
          profileQuery.error,
          "Unable to load your profile.",
        )
      : "";

  const visibleError =
    pageError ||
    queryError;

  /*
   * ------------------------------------------------
   * RETRY
   * ------------------------------------------------
   */

  const retryProfile =
    async () => {
      setPageError("");

      try {
        const result =
          await profileQuery.refetch();

        if (result.error) {
          throw result.error;
        }

        toast.success(
          "Profile refreshed.",
        );
      } catch (caughtError) {
        const message =
          getPassengerApiError(
            caughtError,
            "Unable to load your profile.",
          );

        setPageError(
          message,
        );

        toast.error(
          message,
        );
      }
    };


    const openLogoutModal = () => {
  if (loggingOut) {
    return;
  }

  setShowLogoutModal(true);
};

const closeLogoutModal = () => {
  if (loggingOut) {
    return;
  }

  setShowLogoutModal(false);
};

const handleLogout = async () => {
  if (loggingOut) {
    return;
  }

  try {
    setLoggingOut(true);

    /*
     * Calls:
     *
     * POST /riders/logout
     *
     * passengerAuthApi.logout() also clears
     * passengerSession in its finally block.
     */
    await passengerAuthApi.logout();

    /*
     * Don't leave authenticated passenger data
     * sitting inside React Query after logout.
     */
    queryClient.clear();

    setShowLogoutModal(false);

    toast.success(
      "You have been logged out.",
    );

    navigate(
      "/passenger/signup",
      {
        replace: true,
      },
    );
  } catch (error) {
    /*
     * passengerAuthApi.logout() clears the local
     * passenger session even when the backend
     * logout request fails.
     *
     * Therefore the passenger is still locally
     * logged out and should leave protected pages.
     */

    console.error(
      "Passenger logout failed:",
      error,
    );

    queryClient.clear();

    setShowLogoutModal(false);

    toast.success(
      "You have been logged out.",
    );

    navigate(
      "/passenger/signup",
      {
        replace: true,
      },
    );
  } finally {
    setLoggingOut(false);
  }
};

  return (
    <div className="min-h-[100dvh] bg-[#FAF9FB] pb-[100px]">
      <main className="mx-auto w-full max-w-[680px] px-5 pb-8 pt-7 sm:px-7">
        {/* HEADER */}

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
            Account
          </h1>

          {refreshing && (
            <LoaderCircle
              size={19}
              className="animate-spin text-[#7442AD]"
            />
          )}
        </div>

        {/* VERIFY IDENTITY */}

        <div className="mt-5 flex items-center gap-3 rounded-[14px] bg-[#E3F8EA] px-4 py-3 text-[#358759]">
          <span className="flex items-center justify-center rounded-full h-9 w-9 shrink-0 bg-white/80">
            <ShieldCheck
              size={19}
            />
          </span>

          <div className="min-w-0">
            <p className="text-[15px] font-semibold">
              Enjoy smooth and safe ride
            </p>

            <p className="mt-0.5 text-[14px]">
              Verify Identity
            </p>
          </div>
        </div>

        {/* ERROR */}

        {visibleError && (
          <div
            role="alert"
            className="mt-4 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3"
          >
            <p className="text-[14px] font-medium leading-5 text-red-700">
              {visibleError}
            </p>

            <button
              type="button"
              disabled={
                profileQuery.isFetching
              }
              onClick={
                retryProfile
              }
              className="mt-2 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#7442AD] disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  profileQuery.isFetching
                    ? "animate-spin"
                    : ""
                }
              />

              Try again
            </button>
          </div>
        )}

        {/* PROFILE CARD */}

        <motion.button
          type="button"
          whileTap={{
            scale: 0.985,
          }}
          onClick={() =>
            navigate(
              "/passenger/account/profile",
            )
          }
          className="mt-4 flex w-full items-center gap-3 rounded-[18px] bg-white p-4 text-left shadow-[0_5px_24px_rgba(30,20,38,0.04)]"
        >
          {/* AVATAR */}

          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#7442AD] bg-[#F0E8F8] text-[18px] font-semibold text-[#7442AD]">
            {loading ? (
              <div className="h-full w-full animate-pulse bg-[#E8DDF3]" />
            ) : profilePicture ? (
              <img
                src={
                  profilePicture
                }
                alt={fullName}
                className="object-cover w-full h-full"
              />
            ) : initial ? (
              initial
            ) : (
              <UserRound
                size={25}
              />
            )}
          </div>

          {/* USER INFORMATION */}

          <div className="flex-1 min-w-0">
            {loading ? (
              <>
                <div className="h-5 w-[160px] animate-pulse rounded-md bg-[#ECE9EE]" />

                <div className="mt-2 h-4 w-[120px] animate-pulse rounded-md bg-[#F0EDF1]" />
              </>
            ) : (
              <>
                <p className="truncate text-[16px] font-semibold text-[#302B34]">
                  {fullName}
                </p>

                {phoneNumber ? (
                  <p className="mt-1 truncate text-[14px] text-[#918B95]">
                    {phoneNumber}
                  </p>
                ) : email ? (
                  <p className="mt-1 truncate text-[14px] text-[#918B95]">
                    {email}
                  </p>
                ) : (
                  <p className="mt-1 text-[14px] text-[#B0AAB3]">
                    Add phone number
                  </p>
                )}

                {rating !==
                  null && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <Star
                      size={14}
                      className="fill-[#F0B429] text-[#F0B429]"
                    />

                    <span className="text-[13px] font-medium text-[#625C66]">
                      {rating.toFixed(
                        1,
                      )}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ARROW */}

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1EAF8] text-[20px] text-[#7442AD]">
            ›
          </span>
        </motion.button>

        {/* MENU */}

        <div className="mt-5 overflow-hidden rounded-[18px] bg-white shadow-[0_5px_24px_rgba(30,20,38,0.035)]">
          <AccountMenuItem
            icon={MapPin}
            label="Saved Addresses"
            onClick={() =>
              navigate(
                "/passenger/account/saved-places",
              )
            }
          />

          <AccountMenuItem
            icon={BadgePercent}
            label="Promos & Rewards"
            onClick={() =>
              navigate(
                "/passenger/account/promos",
              )
            }
          />

          <AccountMenuItem
            icon={CreditCard}
            label="Payment Methods"
            onClick={() =>
              navigate(
                "/passenger/account/payment-methods",
              )
            }
          />

          <AccountMenuItem
            icon={ShieldCheck}
            label="Safety"
            onClick={() =>
              navigate(
                "/passenger/account/safety",
              )
            }
          />

          <AccountMenuItem
            icon={CircleHelp}
            label="Help & Support"
            onClick={() =>
              navigate(
                "/passenger/account/support",
              )
            }
          />

          <AccountMenuItem
            icon={Building2}
            label="Legal"
            onClick={() =>
              navigate(
                "/passenger/account/legal",
              )
            }
          />

          <AccountMenuItem
            icon={Star}
            label="Rate us"
            onClick={() =>
              navigate(
                "/passenger/account/rate-us",
              )
            }
          />

         <AccountMenuItem
  icon={LogOut}
  label="Logout"
  danger
  onClick={openLogoutModal}
/>
        </div>

        {/* REQUEST TRIP */}

        <motion.button
          type="button"
          whileTap={{
            scale: 0.98,
          }}
          onClick={() =>
            navigate(
              "/passenger/book-ride",
            )
          }
          className="mt-5 flex min-h-[62px] w-full items-center justify-between rounded-[14px] bg-[#7442AD] px-4 text-left text-white"
        >
          <span>
            <span className="block text-[15px] font-semibold">
              Want to request a trip?
            </span>

            <span className="mt-0.5 block text-[14px] text-white/80">
              Book your next ride
            </span>
          </span>

          <span className="text-[22px]">
            ›
          </span>
        </motion.button>
      </main>


      {/* LOGOUT CONFIRMATION */}

<AnimatePresence>
  {showLogoutModal && (
    <motion.div
      key="logout-modal"
      className="
        fixed
        inset-0
        z-[1200]
        flex
        items-end
        justify-center
        bg-black/45
        px-4
        pb-4
        backdrop-blur-[2px]
        sm:items-center
        sm:pb-0
      "
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{
        duration: 0.2,
      }}
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          closeLogoutModal();
        }
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        aria-describedby="logout-description"
        initial={{
          opacity: 0,
          y: 35,
          scale: 0.97,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 25,
          scale: 0.97,
        }}
        transition={{
          duration: 0.24,
          ease: "easeOut",
        }}
        className="
          relative
          w-full
          max-w-[410px]
          overflow-hidden
          rounded-[26px]
          bg-white
          px-5
          pb-5
          pt-6
          shadow-[0_30px_90px_rgba(28,18,35,0.28)]
          sm:px-6
          sm:pb-6
          sm:pt-7
        "
      >
        {/* CLOSE */}

        <button
          type="button"
          aria-label="Close logout confirmation"
          disabled={loggingOut}
          onClick={closeLogoutModal}
          className="
            absolute
            right-4
            top-4
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-[#F6F3F7]
            text-[#7E7782]
            transition
            hover:bg-[#EEE8F1]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <X
            size={18}
            strokeWidth={2}
          />
        </button>

        {/* ICON */}

        <div
          className="
            mx-auto
            flex
            h-[62px]
            w-[62px]
            items-center
            justify-center
            rounded-full
            bg-[#FCEBEC]
          "
        >
          <div
            className="
              flex
              h-[46px]
              w-[46px]
              items-center
              justify-center
              rounded-full
              bg-[#F9DCDD]
              text-[#C83E45]
            "
          >
            <LogOut
              size={22}
              strokeWidth={2}
            />
          </div>
        </div>

        {/* COPY */}

        <div className="mt-5 text-center">
          <h2
            id="logout-title"
            className="
              text-[20px]
              font-semibold
              tracking-[-0.02em]
              text-[#302B34]
            "
          >
            Log out?
          </h2>

          <p
            id="logout-description"
            className="
              mx-auto
              mt-2
              max-w-[310px]
              text-[14px]
              leading-[1.65]
              text-[#817A85]
            "
          >
            Are you sure you want
            to log out of your
            SurDrive account?
          </p>
        </div>

        {/* ACTIONS */}

        <div className="mt-6 space-y-3">
          <motion.button
            type="button"
            whileTap={
              loggingOut
                ? undefined
                : {
                    scale: 0.985,
                  }
            }
            disabled={loggingOut}
            onClick={() =>
              void handleLogout()
            }
            className="
              flex
              min-h-[52px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-[14px]
              bg-[#C83E45]
              px-4
              text-[15px]
              font-semibold
              text-white
              transition
              hover:bg-[#B9363D]
              disabled:cursor-not-allowed
              disabled:opacity-70
            "
          >
            {loggingOut ? (
              <>
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />

                Logging out...
              </>
            ) : (
              <>
                <LogOut
                  size={18}
                  strokeWidth={2}
                />

                Log out
              </>
            )}
          </motion.button>

          <button
            type="button"
            disabled={loggingOut}
            onClick={closeLogoutModal}
            className="
              flex
              min-h-[50px]
              w-full
              items-center
              justify-center
              rounded-[14px]
              border
              border-[#E9E4EB]
              bg-white
              px-4
              text-[15px]
              font-semibold
              text-[#5F5863]
              transition
              hover:bg-[#FAF8FB]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

<PassengerBottomNav />

      <PassengerBottomNav />
    </div>
  );
}

