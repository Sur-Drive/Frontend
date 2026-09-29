// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { ChevronLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
// import { useLoginRideDriver } from "../hooks/useAuth";

// type Mode = "phone" | "email";

// const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// export default function SignInPage() {
//   const navigate = useNavigate();
//   const loginMutation = useLoginRideDriver();

//   const [mode, setMode] = useState<Mode>("phone");
//   const [phone, setPhone] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPw, setShowPw] = useState(false);
//   const [error, setError] = useState("");

//   const digits = phone.replace(/\D/g, "");
//   const idValid =
//     mode === "phone" ? digits.length >= 10 : EMAIL_RE.test(email.trim());

//   const switchMode = (m: Mode) => {
//     setMode(m);
//     setError("");
//   };

//   const submit = () => {
//     if (!idValid || password.length === 0) {
//       setError(
//         mode === "phone"
//           ? "Enter your phone number and password."
//           : "Enter a valid email and your password.",
//       );
//       return;
//     }
//     setError("");

//     const identifier =
//       mode === "email" ? email.trim() : `+234${digits.replace(/^0/, "")}`;

//     loginMutation.mutate(
//       { identifier, password },
//       {
//         onSuccess: (data) => {
//           const token = data.token || data.accessToken;
//           if (token) {
//             localStorage.setItem("token", token);
//           }
//           navigate("/home", { replace: true });
//         },
//         onError: (err: any) => {
//           setError(err?.message || "Sign in failed. Please try again.");
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
//         Welcome Back 👋
//       </h1>
//       <p className="mt-2 text-base text-gray-400">
//         Sign in with one of the options below
//       </p>

//       {/* Tabs */}
//       <div className="mt-8 flex border-b border-[#e6e2ee]">
//         {(["phone", "email"] as Mode[]).map((m) => (
//           <button
//             key={m}
//             onClick={() => switchMode(m)}
//             className={`-mb-px flex-1 border-b-[3px] pb-3 text-base font-semibold transition ${
//               mode === m
//                 ? "border-[#6E43A3] text-[#6E43A3]"
//                 : "border-transparent text-[#9a9bb8]"
//             }`}
//           >
//             {m === "phone" ? "Phone Number" : "Email Address"}
//           </button>
//         ))}
//       </div>

//       <div className="mt-6 space-y-4">
//         {mode === "phone" ? (
//           <div className="flex gap-3">
//             <div className="flex h-14 w-[104px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#f4f4f3]">
//               <span className="flex w-6 h-6 overflow-hidden rounded-full">
//                 <i className="h-full w-1/3 bg-[#6aa84f]" />
//                 <i className="w-1/3 h-full bg-white" />
//                 <i className="h-full w-1/3 bg-[#6aa84f]" />
//               </span>
//               <span className="text-base text-gray-700">+234</span>
//             </div>
//             <input
//               type="tel"
//               inputMode="numeric"
//               autoComplete="tel-national"
//               placeholder="803 660 0027"
//               value={phone}
//               onChange={(e) => {
//                 setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
//                 setError("");
//               }}
//               className={`${input} h-14 rounded-2xl bg-[#f4f4f3] px-4`}
//             />
//           </div>
//         ) : (
//           <label className={field}>
//             <span className={iconBubble}>
//               <Mail size={16} />
//             </span>
//             <input
//               type="email"
//               autoComplete="email"
//               placeholder="Email Address"
//               value={email}
//               onChange={(e) => {
//                 setEmail(e.target.value);
//                 setError("");
//               }}
//               className={input}
//             />
//           </label>
//         )}

//         <label className={field}>
//           <span className={iconBubble}>
//             <Lock size={16} />
//           </span>
//           <input
//             type={showPw ? "text" : "password"}
//             autoComplete="current-password"
//             placeholder="Password"
//             value={password}
//             onChange={(e) => {
//               setPassword(e.target.value);
//               setError("");
//             }}
//             onKeyDown={(e) => e.key === "Enter" && submit()}
//             className={input}
//           />
//           <button
//             type="button"
//             onClick={() => setShowPw((s) => !s)}
//             aria-label={showPw ? "Hide password" : "Show password"}
//             className="text-gray-400"
//           >
//             {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
//           </button>
//         </label>
//       </div>

//       <p className="mt-5 text-right text-sm text-[#8a8cab]">
//         Can't remember password?{" "}
//         <Link
//           to="/forgot-password"
//           className="font-semibold text-[#4a148c] underline"
//         >
//           Recover Password
//         </Link>
//       </p>

//       {error && (
//         <p className="mt-4 text-sm text-center text-red-600">{error}</p>
//       )}

//       <button
//         onClick={submit}
//         disabled={loginMutation.isPending}
//         className="mt-6 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-60"
//       >
//         {loginMutation.isPending ? "Signing in..." : "Sign In"}
//       </button>

//       <p className="mt-6 text-center text-sm text-[#8a8cab]">
//         Don't have an account?{" "}
//         <Link to="/register" className="font-semibold text-[#4a148c] underline">
//           Register Now
//         </Link>
//       </p>
//     </div>
//   );
// }

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useLoginRideDriver } from "../hooks/useAuth";

type Mode = "phone" | "email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInPage() {
  const navigate = useNavigate();
  const loginMutation = useLoginRideDriver();

  const [mode, setMode] = useState<Mode>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const digits = phone.replace(/\D/g, "");
  const idValid =
    mode === "phone" ? digits.length >= 10 : EMAIL_RE.test(email.trim());

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
  };

  const submit = () => {
    if (!idValid || password.length === 0) {
      setError(
        mode === "phone"
          ? "Enter your phone number and password."
          : "Enter a valid email and your password.",
      );
      return;
    }
    setError("");

    const identifier =
      mode === "email" ? email.trim() : `+234${digits.replace(/^0/, "")}`;

    loginMutation.mutate(
      { identifier, password },
      {
        onSuccess: (data) => {
          const token = data.token || data.accessToken;
          if (token) {
            localStorage.setItem("token", token);
          }
          navigate("/home", { replace: true });
        },
        onError: (err: any) => {
          setError(err?.message || "Sign in failed. Please try again.");
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
        Welcome Back 👋
      </h1>
      <p className="mt-[clamp(2px,0.8dvh,6px)] text-[clamp(11.5px,2.5dvh,14px)] text-gray-400">
        Sign in with one of the options below
      </p>

      {/* Tabs */}
      <div className="mt-[clamp(14px,3.6dvh,22px)] flex border-b border-[#e6e2ee]">
        {(["phone", "email"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`-mb-px flex-1 border-b-[3px] pb-[clamp(6px,1.6dvh,10px)] text-[clamp(12.5px,2.8dvh,15px)] font-semibold transition ${
              mode === m
                ? "border-[#6E43A3] text-[#6E43A3]"
                : "border-transparent text-[#9a9bb8]"
            }`}
          >
            {m === "phone" ? "Phone Number" : "Email Address"}
          </button>
        ))}
      </div>

      <div className="mt-[clamp(10px,2.6dvh,16px)] space-y-[clamp(8px,2dvh,14px)]">
        {mode === "phone" ? (
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
        ) : (
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
        )}

        <label className={field}>
          <span className={iconBubble}>
            <Lock className="h-[55%] w-[55%]" />
          </span>
          <input
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className={input}
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="text-gray-400"
          >
            {showPw ? (
              <EyeOff className="h-[clamp(14px,3.2dvh,18px)] w-[clamp(14px,3.2dvh,18px)]" />
            ) : (
              <Eye className="h-[clamp(14px,3.2dvh,18px)] w-[clamp(14px,3.2dvh,18px)]" />
            )}
          </button>
        </label>
      </div>

      <p className="mt-[clamp(10px,2.6dvh,16px)] text-right text-[clamp(11px,2.4dvh,13px)] text-[#8a8cab]">
        Can't remember password?{" "}
        <Link
          to="/forgot-password"
          className="font-semibold text-[#4a148c] underline"
        >
          Recover Password
        </Link>
      </p>

      {error && (
        <p className="mt-[clamp(8px,2dvh,12px)] text-center text-[clamp(11.5px,2.5dvh,14px)] text-red-600">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={loginMutation.isPending}
        className="mt-[clamp(14px,3.6dvh,22px)] h-[clamp(44px,10dvh,56px)] w-full rounded-2xl bg-[#6E43A3] text-[clamp(14px,3.2dvh,18px)] font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-60"
      >
        {loginMutation.isPending ? "Signing in..." : "Sign In"}
      </button>

      <p className="mt-[clamp(14px,3.6dvh,22px)] text-center text-[clamp(11.5px,2.5dvh,14px)] text-[#8a8cab]">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-[#4a148c] underline">
          Register Now
        </Link>
      </p>
    </div>
  );
}
