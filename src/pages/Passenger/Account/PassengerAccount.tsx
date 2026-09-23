import {
  BadgePercent,
  Building2,
  CircleHelp,
  CreditCard,
  LogOut,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useNavigate,
} from "react-router-dom";

import PassengerBottomNav from "../../../components/passenger/PassengerBottomNav";

import AccountMenuItem from "../../../components/passenger/account/AccountMenuItem";

import {
  usePassengerProfile,
} from "../../../context/PassengerProfileContext";

export default function PassengerAccount() {
  const navigate =
    useNavigate();

  const { profile } =
    usePassengerProfile();

  const fullName =
    `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <div className="min-h-[100dvh] bg-[#FAF9FB] pb-[100px]">
      <main className="mx-auto w-full max-w-[680px] px-5 pb-8 pt-7 sm:px-7">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
          Account
        </h1>

        <div className="mt-5 flex items-center gap-3 rounded-[14px] bg-[#E3F8EA] px-4 py-3 text-[#358759]">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80">
            <ShieldCheck
              size={18}
            />
          </span>

          <div>
            <p className="text-[14px] font-semibold">
              Enjoy smooth and safe ride
            </p>

            <p className="mt-0.5 text-[13px]">
              Verify Identity
            </p>
          </div>
        </div>

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
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#7442AD] bg-[#F0E8F8] text-[16px] font-semibold text-[#7442AD]">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={fullName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              profile.firstName
                .charAt(0)
                .toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold text-[#302B34]">
              {fullName}
            </p>

            <p className="mt-1 text-[13px] text-[#918B95]">
              {profile.phone}
            </p>
          </div>

          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1EAF8] text-[20px] text-[#7442AD]">
            ›
          </span>
        </motion.button>

        <div className="mt-5 overflow-hidden rounded-[18px] bg-white shadow-[0_5px_24px_rgba(30,20,38,0.035)]">
          <AccountMenuItem
            icon={MapPin}
            label="Saved Addresses"
            onClick={() =>
              navigate(
                "/passenger/account/saved-addresses",
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
          />

          <AccountMenuItem
            icon={LogOut}
            label="Logout"
            danger
            onClick={() =>
              navigate(
                "/passenger/signup",
                {
                  replace: true,
                },
              )
            }
          />
        </div>

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
          className="mt-5 flex min-h-[58px] w-full items-center justify-between rounded-[14px] bg-[#7442AD] px-4 text-left text-white"
        >
          <span>
            <span className="block text-[14px] font-semibold">
              Want to request a trip?
            </span>

            <span className="mt-0.5 block text-[13px] text-white/80">
              Get a taxi App
            </span>
          </span>

          <span className="text-[22px]">
            ›
          </span>
        </motion.button>
      </main>

      <PassengerBottomNav />
    </div>
  );
}