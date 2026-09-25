// import { useEffect, useRef, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { ChevronDown, ChevronLeft, Mail, MapPin } from "lucide-react";
// import { useSendRideDriverOtp } from "../hooks/useAuth";

// const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// const CITIES = [
//   "Lagos",
//   "Abuja",
//   "Port Harcourt",
//   "Ibadan",
//   "Kano",
//   "Benin City",
//   "Enugu",
//   "Kaduna",
//   "Warri",
//   "Abeokuta",
//   "Owerri",
//   "Uyo",
//   "Calabar",
//   "Jos",
//   "Ilorin",
// ];

// export default function RegisterPage() {
//   const navigate = useNavigate();
//   const { mutate: sendOtp, isPending: isSubmitting } = useSendRideDriverOtp();

//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [city, setCity] = useState("");
//   const [cityOpen, setCityOpen] = useState(false);
//   const [agreed, setAgreed] = useState(false);
//   const [error, setError] = useState("");
//   const cityRef = useRef<HTMLDivElement | null>(null);

//   const digits = phone.replace(/\D/g, "");
//   const emailValid = EMAIL_RE.test(email.trim());
//   useEffect(() => {
//     if (!cityOpen) return;
//     const onClickOutside = (e: MouseEvent) => {
//       if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
//         setCityOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", onClickOutside);
//     return () => document.removeEventListener("mousedown", onClickOutside);
//   }, [cityOpen]);

//   const submit = () => {
//     if (isSubmitting) return;

//     if (!emailValid) {
//       setError("Enter a valid email address.");
//       return;
//     }
//     if (digits.length < 10) {
//       setError("Enter a valid phone number.");
//       return;
//     }
//     if (!city) {
//       setError("Select your city.");
//       return;
//     }
//     if (!agreed) {
//       setError("Please accept the Terms & Conditions to continue.");
//       return;
//     }

//     setError("");

//     sendOtp(
//       {
//         email: email.trim(),
//         phoneNumber: `+234${digits.slice(-10)}`,
//         location: city,
//       },
//       {
//         onSuccess: () => {
//           navigate("/register/otp", {
//             state: {
//               identifier: email.trim(),
//               phone: `+234${digits.slice(-10)}`,
//               city,
//               role: "driver",
//             },
//           });
//         },
//         onError: (err: unknown) => {
//           setError(err instanceof Error ? err.message : "Failed to send OTP.");
//         },
//       },
//     );
//   };

//   const field = "flex h-14 items-center gap-3 rounded-2xl bg-[#f4f4f3] px-4";
//   const iconBubble =
//     "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ece4f5] text-[#6E43A3]";
//   const input =
//     "w-full bg-transparent text-base text-gray-800 outline-none placeholder:text-gray-400";

//   return (
//     <div className="font-outfit min-h-[100dvh] bg-white px-6 pb-8 pt-4">
//       <button
//         onClick={() => navigate(-1)}
//         aria-label="Back"
//         className="flex items-center justify-center bg-white rounded-full shadow-md h-11 w-11"
//       >
//         <ChevronLeft size={22} />
//       </button>

//       <h1 className="mt-8 text-[28px] font-bold text-[#2b2b2b]">
//         Become a driver
//       </h1>
//       <p className="mt-2 text-base text-gray-400">
//         Sign up to start driving and earning.
//       </p>

//       <div className="mt-8 space-y-4">
//         {/* Email */}
//         <label className={field}>
//           <span className={iconBubble}>
//             <Mail size={16} />
//           </span>
//           <input
//             type="email"
//             autoComplete="email"
//             placeholder="Email Address"
//             value={email}
//             onChange={(e) => {
//               setEmail(e.target.value);
//               setError("");
//             }}
//             className={input}
//           />
//         </label>

//         {/* Phone */}
//         <div className="flex gap-3">
//           <div className="flex h-14 w-[104px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#f4f4f3]">
//             <span className="flex w-6 h-6 overflow-hidden rounded-full">
//               <i className="h-full w-1/3 bg-[#6aa84f]" />
//               <i className="w-1/3 h-full bg-white" />
//               <i className="h-full w-1/3 bg-[#6aa84f]" />
//             </span>
//             <span className="text-base text-gray-700">+234</span>
//           </div>
//           <input
//             type="tel"
//             inputMode="numeric"
//             autoComplete="tel-national"
//             placeholder="803 660 0027"
//             value={phone}
//             onChange={(e) => {
//               setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
//               setError("");
//             }}
//             className={`${input} h-14 rounded-2xl bg-[#f4f4f3] px-4`}
//           />
//         </div>

//         {/* City */}
//         <div className="relative" ref={cityRef}>
//           <button
//             type="button"
//             onClick={() => setCityOpen((o) => !o)}
//             className={`${field} w-full justify-between`}
//           >
//             <span className="flex items-center gap-3">
//               <span className={iconBubble}>
//                 <MapPin size={16} />
//               </span>
//               <span
//                 className={
//                   city ? "text-base text-gray-800" : "text-base text-gray-400"
//                 }
//               >
//                 {city || "Select city"}
//               </span>
//             </span>
//             <ChevronDown
//               size={18}
//               className={`text-gray-500 transition-transform ${cityOpen ? "rotate-180" : ""}`}
//             />
//           </button>

//           {cityOpen && (
//             <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-64 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl">
//               {CITIES.map((c) => (
//                 <button
//                   key={c}
//                   type="button"
//                   onClick={() => {
//                     setCity(c);
//                     setCityOpen(false);
//                     setError("");
//                   }}
//                   className={`block w-full rounded-xl px-4 py-3 text-left text-base transition ${
//                     city === c
//                       ? "bg-[#ece4f5] font-semibold text-[#6E43A3]"
//                       : "text-gray-700 hover:bg-gray-50"
//                   }`}
//                 >
//                   {c}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Terms */}
//       <label className="flex items-start gap-3 mt-5 cursor-pointer">
//         <button
//           type="button"
//           role="checkbox"
//           aria-checked={agreed}
//           onClick={() => {
//             setAgreed((a) => !a);
//             setError("");
//           }}
//           className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
//             agreed
//               ? "border-[#6E43A3] bg-[#6E43A3]"
//               : "border-gray-300 bg-white"
//           }`}
//         >
//           {agreed && (
//             <svg
//               viewBox="0 0 24 24"
//               className="w-4 h-4"
//               fill="none"
//               stroke="white"
//               strokeWidth={3}
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             >
//               <path d="M5 13l4 4L19 7" />
//             </svg>
//           )}
//         </button>
//         <p className="text-sm leading-relaxed text-gray-400">
//           By Registering you agree to our{" "}
//           <span className="font-semibold text-[#4a148c]">
//             Terms &amp; Conditions,
//           </span>{" "}
//           acknowledge our{" "}
//           <Link to="/privacy" className="font-semibold text-[#4a148c]">
//             privacy policy,
//           </Link>{" "}
//           and confirm that you're over 18. we may send promotions related to our
//           services - you can unsubscribe anytime in notification setting under
//           your profile
//         </p>
//       </label>

//       {error && (
//         <p className="mt-4 text-sm text-center text-red-600">{error}</p>
//       )}

//       <button
//         onClick={submit}
//         disabled={isSubmitting}
//         className="mt-6 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-70"
//       >
//         {isSubmitting ? "Please wait..." : "Register"}
//       </button>

//       <p className="mt-6 text-center text-sm text-[#8a8cab]">
//         Already have an account?{" "}
//         <Link to="/signin" className="font-semibold text-[#4a148c] underline">
//           Register Now
//         </Link>
//       </p>
//     </div>
//   );
// }

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

  const field = "flex h-14 items-center gap-3 rounded-2xl bg-[#f4f4f3] px-4";
  const iconBubble =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ece4f5] text-[#6E43A3]";
  const input =
    "w-full bg-transparent text-base text-gray-800 outline-none placeholder:text-gray-400";

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-6 pb-8 pt-4">
      <button
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="flex items-center justify-center bg-white rounded-full shadow-md h-11 w-11"
      >
        <ChevronLeft size={22} />
      </button>

      <h1 className="mt-8 text-[28px] font-bold text-[#2b2b2b]">
        Become a driver
      </h1>
      <p className="mt-2 text-base text-gray-400">
        Sign up to start driving and earning.
      </p>

      <div className="mt-8 space-y-4">
        {/* Email */}
        <label className={field}>
          <span className={iconBubble}>
            <Mail size={16} />
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
        <div className="flex gap-3">
          <div className="flex h-14 w-[104px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#f4f4f3]">
            <span className="flex w-6 h-6 overflow-hidden rounded-full">
              <i className="h-full w-1/3 bg-[#6aa84f]" />
              <i className="w-1/3 h-full bg-white" />
              <i className="h-full w-1/3 bg-[#6aa84f]" />
            </span>
            <span className="text-base text-gray-700">+234</span>
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
            className={`${input} h-14 rounded-2xl bg-[#f4f4f3] px-4`}
          />
        </div>

        {/* City */}
        <div className="relative" ref={cityRef}>
          <button
            type="button"
            onClick={() => setCityOpen((o) => !o)}
            className={`${field} w-full justify-between`}
          >
            <span className="flex items-center gap-3">
              <span className={iconBubble}>
                <MapPin size={16} />
              </span>
              <span
                className={
                  city ? "text-base text-gray-800" : "text-base text-gray-400"
                }
              >
                {city || "Select city"}
              </span>
            </span>
            <ChevronDown
              size={18}
              className={`text-gray-500 transition-transform ${cityOpen ? "rotate-180" : ""}`}
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
                  className={`block w-full rounded-xl px-4 py-3 text-left text-base transition ${
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
      <label className="flex items-start gap-3 mt-5 cursor-pointer">
        <button
          type="button"
          role="checkbox"
          aria-checked={agreed}
          onClick={() => {
            setAgreed((a) => !a);
            setError("");
          }}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
            agreed
              ? "border-[#6E43A3] bg-[#6E43A3]"
              : "border-gray-300 bg-white"
          }`}
        >
          {agreed && (
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
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
        <p className="text-sm leading-relaxed text-gray-400">
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
        <p className="mt-4 text-sm text-center text-red-600">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={isSubmitting}
        className="mt-6 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-70"
      >
        {isSubmitting ? "Please wait..." : "Register"}
      </button>

      <p className="mt-6 text-center text-sm text-[#8a8cab]">
        Already have an account?{" "}
        <Link to="/signin" className="font-semibold text-[#4a148c] underline">
          Register Now
        </Link>
      </p>
    </div>
  );
}
