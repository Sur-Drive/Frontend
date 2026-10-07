import {
  CalendarDays,
  ChevronDown,
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  UserRound,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "sonner";

import AccountHeader from "../../../components/passenger/account/AccountHeader";

import ProfileField from "../../../components/passenger/account/ProfileField";

import ProfileSuccessToast from "../../../components/passenger/account/ProfileSuccessToast";

import {
  usePassengerProfileQuery,
  useUpdatePassengerProfile,
  useUploadPassengerProfilePicture,
} from "../../../hooks/passenger/usePassengerProfileApi";

import {
  getPassengerApiError,
} from "../../../api/passenger/getPassengerApiError";

/*
 * The profile endpoint returns one fullName, while PATCH /riders/profile
 * accepts firstName and lastName.
 *
 * For now:
 * "Adebayo Faridah" => firstName "Adebayo", lastName "Faridah"
 *
 * Everything after the first word is kept as lastName so a name such as
 * "Adebayo Faridah Grace" becomes:
 * firstName: Adebayo
 * lastName: Faridah Grace
 */
function splitFullName(
  fullName: string | null | undefined,
) {
  const normalized =
    fullName?.trim() ?? "";

  if (!normalized) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const parts =
    normalized
      .split(/\s+/)
      .filter(Boolean);

  return {
    firstName:
      parts[0] ?? "",

    lastName:
      parts
        .slice(1)
        .join(" "),
  };
}

export default function PassengerProfile() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  /*
   * --------------------------------------------------
   * SERVER STATE
   * --------------------------------------------------
   */

  const profileQuery =
    usePassengerProfileQuery();

  const updateMutation =
    useUpdatePassengerProfile();

  const uploadPhotoMutation =
    useUploadPassengerProfilePicture();

  const backendProfile =
    profileQuery.data;

  /*
   * --------------------------------------------------
   * FORM STATE
   * --------------------------------------------------
   *
   * Do NOT initialize these from PassengerProfileContext.
   *
   * GET /riders/profile is now our source of truth.
   */

  const [
    firstName,
    setFirstName,
  ] = useState("");

  const [
    lastName,
    setLastName,
  ] = useState("");

  const [
    gender,
    setGender,
  ] = useState("");

  const [
    dateOfBirth,
    setDateOfBirth,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

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

  /*
   * Prevent a background refetch from overwriting fields
   * while the user is editing them.
   */
  const [
    formInitialized,
    setFormInitialized,
  ] = useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  /*
   * --------------------------------------------------
   * HYDRATE FORM FROM GET /riders/profile
   * --------------------------------------------------
   */

  useEffect(() => {
    if (
      !backendProfile ||
      formInitialized
    ) {
      return;
    }

    const names =
      splitFullName(
        backendProfile.fullName,
      );

    setFirstName(
      names.firstName,
    );

    setLastName(
      names.lastName,
    );

    setGender(
      backendProfile.gender ?? "",
    );

    setDateOfBirth(
      backendProfile.dateOfBirth ??
        "",
    );

    setFormInitialized(true);
  }, [
    backendProfile,
    formInitialized,
  ]);

  /*
   * --------------------------------------------------
   * SUCCESS TOAST TIMER
   * --------------------------------------------------
   */

  useEffect(() => {
    if (!showSuccess) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [showSuccess]);

  /*
   * --------------------------------------------------
   * DERIVED BACKEND VALUES
   * --------------------------------------------------
   */

  const fullName =
    `${firstName} ${lastName}`
      .trim();

  const phoneNumber =
    backendProfile
      ?.phoneNumber
      ?.trim() ?? "";

  const email =
    backendProfile
      ?.email
      ?.trim() ?? "";

  const profilePicture =
    backendProfile
      ?.profilePicture ??
    null;

  const initial =
    (
      firstName ||
      backendProfile
        ?.fullName ||
      ""
    )
      .charAt(0)
      .toUpperCase();

  /*
   * --------------------------------------------------
   * QUERY STATES
   * --------------------------------------------------
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
    error ||
    queryError;

  /*
   * --------------------------------------------------
   * REFRESH
   * --------------------------------------------------
   */

  const retryProfile =
    async () => {
      setError("");

      try {
        /*
         * Allow the returned profile to
         * hydrate the form again.
         */
        setFormInitialized(
          false,
        );

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

        setError(message);

        toast.error(message);
      }
    };

  /*
   * --------------------------------------------------
   * SAVE PROFILE
   * --------------------------------------------------
   */

  const save =
    async () => {
      if (
        updateMutation.isPending
      ) {
        return;
      }

      const normalizedFirstName =
        firstName.trim();

      const normalizedLastName =
        lastName.trim();

      if (
        !normalizedFirstName ||
        !normalizedLastName
      ) {
        const message =
          "First name and last name are required.";

        setError(message);

        toast.error(message);

        return;
      }

      if (!gender) {
        const message =
          "Please select your gender.";

        setError(message);

        toast.error(message);

        return;
      }

      if (!dateOfBirth) {
        const message =
          "Please enter your date of birth.";

        setError(message);

        toast.error(message);

        return;
      }

      setError("");

      try {
        await updateMutation.mutateAsync({
          firstName:
            normalizedFirstName,

          lastName:
            normalizedLastName,

          gender,

          dateOfBirth,
        });

        /*
         * useUpdatePassengerProfile should invalidate
         * ["passenger", "profile"] after success.
         *
         * This means both Account and Profile will
         * receive the latest GET /riders/profile data.
         */

        setShowSuccess(true);

        toast.success(
          "Profile updated successfully.",
        );
      } catch (caughtError) {
        const message =
          getPassengerApiError(
            caughtError,
            "Unable to update your profile.",
          );

        setError(message);

        toast.error(message);
      }
    };

  /*
   * --------------------------------------------------
   * PROFILE PICTURE
   * --------------------------------------------------
   */

  const selectPhoto = () => {
    if (
      uploadPhotoMutation.isPending
    ) {
      return;
    }

    fileInputRef.current?.click();
  };

  const uploadPhoto =
    async (
      event:
        React.ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target.files?.[0];

      /*
       * Reset so selecting the same image
       * again still fires onChange.
       */
      event.target.value = "";

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/",
        )
      ) {
        const message =
          "Please select an image file.";

        setError(message);

        toast.error(message);

        return;
      }

      const maxSize =
        5 * 1024 * 1024;

      if (
        file.size > maxSize
      ) {
        const message =
          "Profile photo must be 5 MB or smaller.";

        setError(message);

        toast.error(message);

        return;
      }

      setError("");

      try {
        await uploadPhotoMutation.mutateAsync(
          file,
        );

        toast.success(
          "Profile photo updated.",
        );
      } catch (caughtError) {
        const message =
          getPassengerApiError(
            caughtError,
            "Unable to update your profile photo.",
          );

        setError(message);

        toast.error(message);
      }
    };

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (
    loading &&
    !backendProfile
  ) {
    return (
      <div className="min-h-[100dvh] bg-white">
        <AccountHeader />

        <main className="mx-auto w-full max-w-[680px] px-5 pb-12 sm:px-7">
          <h1 className="text-[24px] font-semibold text-[#302B34]">
            Profile
          </h1>

          <p className="mt-1 text-[14px] text-[#99939D]">
            Help our drivers identify
            you easily
          </p>

          <div className="flex flex-col items-center justify-center mt-16">
            <LoaderCircle
              size={34}
              className="animate-spin text-[#7442AD]"
            />

            <p className="mt-3 text-[14px] text-[#918B95]">
              Loading your
              profile...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white">
      <AccountHeader />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 sm:px-7">
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold text-[#302B34]">
              Profile
            </h1>

            <p className="mt-1 text-[14px] text-[#99939D]">
              Help our drivers
              identify you easily
            </p>
          </div>

          {refreshing && (
            <LoaderCircle
              size={19}
              className="mt-1 animate-spin text-[#7442AD]"
            />
          )}
        </div>

        {/* PROFILE PICTURE */}

        <div className="flex justify-center mt-7">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-[#F1EAFE] text-[30px] font-semibold text-[#7442AD]">
              {profilePicture ? (
                <img
                  src={
                    profilePicture
                  }
                  alt={
                    fullName ||
                    "Passenger profile"
                  }
                  className="object-cover w-full h-full"
                />
              ) : initial ? (
                initial
              ) : (
                <UserRound
                  size={46}
                  strokeWidth={
                    1.5
                  }
                  className="text-[#C9B6E6]"
                />
              )}
            </div>

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept="image/*"
              className="hidden"
              onChange={
                uploadPhoto
              }
            />

            <button
              type="button"
              disabled={
                uploadPhotoMutation.isPending
              }
              onClick={
                selectPhoto
              }
              aria-label="Change profile photo"
              className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#7442AD] text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadPhotoMutation.isPending ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Pencil
                  size={16}
                />
              )}
            </button>
          </div>
        </div>

        {/* ERROR */}

        {visibleError && (
          <div
            role="alert"
            className="mt-6 rounded-[13px] border border-red-200 bg-red-50 px-4 py-3"
          >
            <p className="text-[14px] font-medium leading-5 text-red-700">
              {visibleError}
            </p>

            {queryError && (
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
            )}
          </div>
        )}

        {/* FORM */}

        <div className="space-y-4 mt-7">
          {/* NAME */}

          <div>
            <label className="mb-2 block text-[14px] font-medium text-[#302B34]">
              Name
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ProfileField
                icon={
                  <UserRound
                    size={18}
                  />
                }
                value={
                  firstName
                }
                onChange={(
                  event,
                ) =>
                  setFirstName(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="First name"
                autoComplete="given-name"
              />

              <ProfileField
                icon={
                  <UserRound
                    size={18}
                  />
                }
                value={
                  lastName
                }
                onChange={(
                  event,
                ) =>
                  setLastName(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Last name"
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* PHONE */}

          <ProfileField
            label="Phone Number"
            icon={
              <Phone
                size={18}
              />
            }
            value={
              phoneNumber
            }
            placeholder="No phone number"
            readOnlyDisplay
            actionLabel={
              phoneNumber
                ? "Change Number"
                : "Add Number"
            }
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
              <Mail
                size={18}
              />
            }
            value={
              email
            }
            placeholder="No email address"
            readOnlyDisplay
            actionLabel={
              email
                ? "Change Email"
                : "Add Email"
            }
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
                onChange={(
                  event,
                ) =>
                  setGender(
                    event
                      .target
                      .value,
                  )
                }
                className="min-w-0 flex-1 appearance-none bg-transparent text-[16px] font-medium text-[#302B34] outline-none"
              >
                {!gender && (
                  <option
                    value=""
                    disabled
                  >
                    Select gender
                  </option>
                )}

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
              <CalendarDays
                size={18}
              />
            }
            value={
              dateOfBirth
            }
            onChange={(
              event,
            ) =>
              setDateOfBirth(
                event.target.value,
              )
            }
            placeholder="Date of birth"
            type="date"
          />
        </div>

        {/* SAVE */}

        <motion.button
          type="button"
          disabled={
            updateMutation.isPending
          }
          whileTap={
            !updateMutation.isPending
              ? {
                  scale: 0.98,
                }
              : undefined
          }
          onClick={save}
          className="mt-6 flex h-[56px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_9px_25px_rgba(116,66,173,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updateMutation.isPending && (
            <LoaderCircle
              size={19}
              className="animate-spin"
            />
          )}

          {updateMutation.isPending
            ? "Saving..."
            : "Save Changes"}
        </motion.button>
      </main>

      <ProfileSuccessToast
        open={showSuccess}
        onClose={() =>
          setShowSuccess(
            false,
          )
        }
      />
    </div>
  );
}

