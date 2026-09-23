import {
  CalendarDays,
  ChevronDown,
  Mail,
  Pencil,
  Phone,
  UserRound,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import AccountHeader from "../../../components/passenger/account/AccountHeader";
import ProfileSuccessToast from "../../../components/passenger/account/ProfileSuccessToast";

import {
  usePassengerProfile,
} from "../../../context/PassengerProfileContext";
import ProfileField from "../../../components/passenger/account/ProfileField";

export default function PassengerProfile() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    profile,
    updateProfile,
  } =
    usePassengerProfile();

  const [firstName, setFirstName] =
    useState(profile.firstName);

  const [lastName, setLastName] =
    useState(profile.lastName);

  const [gender, setGender] =
    useState(profile.gender);

  const [
    dateOfBirth,
    setDateOfBirth,
  ] =
    useState(profile.dateOfBirth);

  const [
    showSuccess,
    setShowSuccess,
  ] = useState(
    Boolean(
      (
        location.state as {
          profileUpdated?: boolean;
        } | null
      )?.profileUpdated,
    ),
  );

  useEffect(() => {
    if (!showSuccess) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

    return () =>
      window.clearTimeout(timer);
  }, [showSuccess]);

  const save = () => {
    updateProfile({
      firstName,
      lastName,
      gender,
      dateOfBirth,
    });

    setShowSuccess(true);
  };

  const fullName =
    `${firstName} ${lastName}`.trim();


  return (
    <div className="min-h-[100dvh] bg-white">
      <AccountHeader />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 sm:px-7">
        <h1 className="text-[24px] font-semibold text-[#302B34]">
          Profile
        </h1>

        <p className="mt-1 text-[14px] text-[#99939D]">
          Help our drivers identify you easily
        </p>

        <div className="mt-7 flex justify-center">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-[#F1EAFE] text-[#C9B6E6]">
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound
                  size={46}
                  strokeWidth={1.5}
                />
              )}
            </div>

            <button
              type="button"
              className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#7442AD] text-white"
            >
              <Pencil size={16} />
            </button>
          </div>
        </div>

        <div className="mt-7 space-y-4">
  {/* NAME */}
  <div>
    <label className="mb-2 block text-[14px] font-medium text-[#302B34]">
      Name
    </label>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <ProfileField
        icon={
          <UserRound size={18} />
        }
        value={firstName}
        onChange={(event) =>
          setFirstName(
            event.target.value,
          )
        }
        placeholder="First name"
        autoComplete="given-name"
      />

      <ProfileField
        icon={
          <UserRound size={18} />
        }
        value={lastName}
        onChange={(event) =>
          setLastName(
            event.target.value,
          )
        }
        placeholder="Last name"
        autoComplete="family-name"
      />
    </div>
  </div>

  {/* PHONE NUMBER */}
  <ProfileField
    label="Phone Number"
    icon={
      <Phone size={18} />
    }
    value={profile.phone}
    readOnlyDisplay
    actionLabel="Change Number"
    onAction={() =>
      navigate(
        "/passenger/account/profile/change-phone",
      )
    }
  />

  {/* EMAIL */}
  <ProfileField
    label="Email"
    icon={
      <Mail size={18} />
    }
    value={profile.email}
    readOnlyDisplay
    actionLabel="Change Email"
    onAction={() =>
      navigate(
        "/passenger/account/profile/change-email",
      )
    }
  />

  {/* GENDER */}
  <div>
    <label className="mb-2 block text-[14px] font-medium text-[#302B34]">
      Gender
    </label>

    <div className="relative flex min-h-[54px] items-center gap-3 rounded-[12px] bg-[#F4F3F5] px-4">
      <UserRound
        size={18}
        className="shrink-0 text-[#7442AD]"
      />

      <select
        value={gender}
        onChange={(event) =>
          setGender(
            event.target.value,
          )
        }
        className="min-w-0 flex-1 appearance-none bg-transparent text-[15px] font-medium text-[#302B34] outline-none"
      >
        <option value="Male">
          Male
        </option>

        <option value="Female">
          Female
        </option>

        <option value="Prefer not to say">
          Prefer not to say
        </option>
      </select>

      <ChevronDown
        size={18}
        className="pointer-events-none shrink-0 text-[#99939D]"
      />
    </div>
  </div>

  {/* DATE OF BIRTH */}
  <ProfileField
    label="Date of Birth"
    icon={
      <CalendarDays size={18} />
    }
    value={dateOfBirth}
    onChange={(event) =>
      setDateOfBirth(
        event.target.value,
      )
    }
    placeholder="Date of birth"
  />
</div>

        <motion.button
          type="button"
          whileTap={{
            scale: 0.98,
          }}
          onClick={save}
          className="mt-6 h-[56px] w-full rounded-[13px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_9px_25px_rgba(116,66,173,0.22)]"
        >
          Save Changes
        </motion.button>
      </main>

      <ProfileSuccessToast
        open={showSuccess}
        onClose={() =>
          setShowSuccess(false)
        }
      />
    </div>
  );
}