import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, Mail, MapPin } from "lucide-react";
import { useSendRideDriverOtp } from "../hooks/useAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CITIES = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
  "Kano",
  "Benin City",
  "Enugu",
  "Kaduna",
  "Warri",
  "Abeokuta",
  "Owerri",
  "Uyo",
  "Calabar",
  "Jos",
  "Ilorin",
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { mutate: sendOtp, isPending: isSubmitting } = useSendRideDriverOtp();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const cityRef = useRef<HTMLDivElement | null>(null);

  const digits = phone.replace(/\D/g, "");
  const emailValid = EMAIL_RE.test(email.trim());
  useEffect(() => {
    if (!cityOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [cityOpen]);

  const submit = () => {
    if (isSubmitting) return;

    if (!emailValid) {
      setError("Enter a valid email address.");
      return;
    }
    if (digits.length < 10) {
      setError("Enter a valid phone number.");
      return;
    }
    if (!city) {
      setError("Select your city.");
      return;
    }
    if (!agreed) {
      setError("Please accept the Terms & Conditions to continue.");
      return;
    }

    setError("");

    sendOtp(
      {
        email: email.trim(),
        phoneNumber: `+234${digits.slice(-10)}`,
        location: city,
      },
      {
        onSuccess: (data) => {
          navigate("/register/otp", {
            state: {
              identifier: email.trim(),
              phone: `+234${digits.slice(-10)}`,
              city,
              role: "driver",
              userId: data.userId,
            },
          });
        },
        onError: (err: unknown) => {
          setError(err instanceof Error ? err.message : "Failed to send OTP.");
        },
      },
    );
  };

  const field =
    "flex h-[clamp(42px,9.5dvh,52px)] items-center gap-[clamp(6px,1.8dvh,10px)] rounded-2xl bg-[#f4f4f3] px-[clamp(10px,2.6dvh,14px)]";
  const iconBubble =
    "flex h-[clamp(26px,6dvh,32px)] w-[clamp(26px,6dvh,32px)] shrink-0 items-center justify-center rounded-full bg-[#ece4f5] text-[#6E43A3]";
  const input =
    "w-full bg-transparent text-[clamp(12.5px,2.8dvh,15px)] text-gray-800 outline-none placeholder:text-gray-400";

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-[clamp(16px,5vw,24px)] pb-[clamp(16px,4dvh,28px)] pt-[clamp(10px,2.6dvh,16px)]">
      <button
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="flex h-[clamp(34px,7.5dvh,40px)] w-[clamp(34px,7.5dvh,40px)] items-center justify-center rounded-full bg-white shadow-md"
      >
        <ChevronLeft className="h-[55%] w-[55%]" />
      </button>

      <h1 className="mt-[clamp(14px,3.6dvh,22px)] text-[clamp(19px,4.4dvh,25px)] font-bold leading-tight text-[#2b2b2b]">
        Become a driver
      </h1>
      <p className="mt-[clamp(2px,0.8dvh,6px)] text-[clamp(11.5px,2.5dvh,14px)] text-gray-400">
        Sign up to start driving and earning.
      </p>

      <div className="mt-[clamp(14px,3.6dvh,22px)] space-y-[clamp(8px,2dvh,14px)]">
        {/* Email */}
        <label className={field}>
          <span className={iconBubble}>
            <Mail className="h-[55%] w-[55%]" />
          </span>
          <input
            type="email"
            autoComplete="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            className={input}
          />
        </label>

        {/* Phone */}
        <div className="flex gap-[clamp(6px,1.8dvh,10px)]">
          <div className="flex h-[clamp(42px,9.5dvh,52px)] w-[clamp(78px,20vw,100px)] shrink-0 items-center justify-center gap-[clamp(4px,1dvh,8px)] rounded-2xl bg-[#f4f4f3]">
            <span className="flex h-[clamp(16px,3.6dvh,22px)] w-[clamp(16px,3.6dvh,22px)] overflow-hidden rounded-full">
              <i className="h-full w-1/3 bg-[#6aa84f]" />
              <i className="w-1/3 h-full bg-white" />
              <i className="h-full w-1/3 bg-[#6aa84f]" />
            </span>
            <span className="text-[clamp(11.5px,2.5dvh,14px)] text-gray-700">
              +234
            </span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="803 660 0027"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
              setError("");
            }}
            className={`${input} h-[clamp(42px,9.5dvh,52px)] rounded-2xl bg-[#f4f4f3] px-[clamp(10px,2.6dvh,14px)]`}
          />
        </div>

        {/* City */}
        <div className="relative" ref={cityRef}>
          <button
            type="button"
            onClick={() => setCityOpen((o) => !o)}
            className={`${field} w-full justify-between`}
          >
            <span className="flex items-center gap-[clamp(6px,1.8dvh,10px)]">
              <span className={iconBubble}>
                <MapPin className="h-[55%] w-[55%]" />
              </span>
              <span
                className={`text-[clamp(12.5px,2.8dvh,15px)] ${
                  city ? "text-gray-800" : "text-gray-400"
                }`}
              >
                {city || "Select city"}
              </span>
            </span>
            <ChevronDown
              className={`h-[clamp(14px,3.2dvh,18px)] w-[clamp(14px,3.2dvh,18px)] text-gray-500 transition-transform ${
                cityOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {cityOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-64 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl">
              {CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCity(c);
                    setCityOpen(false);
                    setError("");
                  }}
                  className={`block w-full rounded-xl px-[clamp(10px,2.6dvh,16px)] py-[clamp(8px,2dvh,12px)] text-left text-[clamp(12.5px,2.8dvh,15px)] transition ${
                    city === c
                      ? "bg-[#ece4f5] font-semibold text-[#6E43A3]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Terms */}
      <label className="mt-[clamp(10px,2.6dvh,16px)] flex cursor-pointer items-start gap-[clamp(6px,1.8dvh,10px)]">
        <button
          type="button"
          role="checkbox"
          aria-checked={agreed}
          onClick={() => {
            setAgreed((a) => !a);
            setError("");
          }}
          className={`mt-0.5 flex h-[clamp(18px,4dvh,22px)] w-[clamp(18px,4dvh,22px)] shrink-0 items-center justify-center rounded-md border transition ${
            agreed
              ? "border-[#6E43A3] bg-[#6E43A3]"
              : "border-gray-300 bg-white"
          }`}
        >
          {agreed && (
            <svg
              viewBox="0 0 24 24"
              className="h-[70%] w-[70%]"
              fill="none"
              stroke="white"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <p className="text-[clamp(10.5px,2.2dvh,13px)] leading-relaxed text-gray-400">
          By Registering you agree to our{" "}
          <span className="font-semibold text-[#4a148c]">
            Terms &amp; Conditions,
          </span>{" "}
          acknowledge our{" "}
          <Link to="/privacy" className="font-semibold text-[#4a148c]">
            privacy policy,
          </Link>{" "}
          and confirm that you're over 18. we may send promotions related to our
          services - you can unsubscribe anytime in notification setting under
          your profile
        </p>
      </label>

      {error && (
        <p className="mt-[clamp(8px,2dvh,12px)] text-center text-[clamp(11.5px,2.5dvh,14px)] text-red-600">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={isSubmitting}
        className="mt-[clamp(14px,3.6dvh,22px)] h-[clamp(44px,10dvh,56px)] w-full rounded-2xl bg-[#6E43A3] text-[clamp(14px,3.2dvh,18px)] font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-70"
      >
        {isSubmitting ? "Please wait..." : "Register"}
      </button>

      <p className="mt-[clamp(14px,3.6dvh,22px)] text-center text-[clamp(11.5px,2.5dvh,14px)] text-[#8a8cab]">
        Already have an account?{" "}
        <Link to="/signin" className="font-semibold text-[#4a148c] underline">
          Register Now
        </Link>
      </p>
    </div>
  );
}
