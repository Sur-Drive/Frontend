import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Phone,
    Mail,
    MapPin,
    Navigation,
    Car,
    Calendar,
    CheckCircle2,
    XCircle,
    CreditCard,
    KeyRound,
    ShieldCheck,
    Rocket,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    PartyPopper,
    Loader2,
} from "lucide-react";

const API_BASE = "https://backend-production-01de.up.railway.app";

type VehicleType =
    | "sedan"
    | "suv"
    | "hatchback"
    | "mini_bus"
    | "bus"
    | "station_wagon"
    | "van"
    | "pickup"
    | "mpv"
    | "other";

type VehicleOwnership = "owner" | "authorised_driver";

interface FormState {
    fullName: string;
    phoneNumber: string;
    email: string;
    city: string;
    preferredOperatingArea: string;
    vehicleMakeModel: string;
    vehicleYear: string;
    vehicleType: VehicleType | "";
    vehicleInGoodCondition: boolean | null;
    vehicleOwnership: VehicleOwnership | "";
    hasValidLicence: boolean | null;
    interestedInEarlyAccess: boolean | null;
    consentToContact: boolean | null;
}

const initialForm: FormState = {
    fullName: "",
    phoneNumber: "",
    email: "",
    city: "",
    preferredOperatingArea: "",
    vehicleMakeModel: "",
    vehicleYear: "",
    vehicleType: "",
    vehicleInGoodCondition: null,
    vehicleOwnership: "",
    hasValidLicence: null,
    interestedInEarlyAccess: null,
    consentToContact: null,
};

const VEHICLE_TYPE_OPTIONS: { value: VehicleType; label: string }[] = [
    { value: "sedan", label: "Sedan (e.g Corolla, Camry)" },
    { value: "suv", label: "SUV (e.g Highlander, Prado)" },
    { value: "hatchback", label: "Hatchback (e.g Golf, Yaris)" },
    { value: "mini_bus", label: "Mini Bus / Korope" },
    { value: "bus", label: "Bus" },
    { value: "station_wagon", label: "Station Wagon " },
    { value: "van", label: "Van (e.g Hiace, Urvan)" },
    { value: "mpv", label: "MPV (e.g Sienna)" },
    { value: "pickup", label: "Pickup (e.g Hilux)" },
    { value: "other", label: "Other" },
];

const STEPS = [
    { id: "personal", label: "Personal", icon: User },
    { id: "location", label: "Location", icon: MapPin },
    { id: "vehicle", label: "Vehicle", icon: Car },
    { id: "eligibility", label: "Eligibility", icon: ShieldCheck },
];

export const EarlyAccessForm: React.FC = () => {
    const [form, setForm] = useState<FormState>(initialForm);
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<{
        message: string;
        alreadyRegistered: boolean;
    } | null>(null);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((f) => ({ ...f, [key]: value }));

    const canProceed = useMemo(() => {
        if (step === 0) {
            return (
                form.fullName.trim().length >= 3 &&
                /^\+?[0-9]{10,15}$/.test(
                    form.phoneNumber.replace(/[\s-]/g, ""),
                ) &&
                (form.email === "" || /^\S+@\S+\.\S+$/.test(form.email))
            );
        }
        if (step === 1) {
            return (
                form.city.trim().length >= 2 &&
                form.preferredOperatingArea.trim().length >= 2
            );
        }
        if (step === 2) {
            const year = Number(form.vehicleYear);
            return (
                form.vehicleMakeModel.trim().length >= 2 &&
                Number.isInteger(year) &&
                year >= 1990 &&
                year <= new Date().getFullYear() + 1 &&
                form.vehicleType !== "" &&
                form.vehicleInGoodCondition !== null &&
                form.vehicleOwnership !== ""
            );
        }
        if (step === 3) {
            return (
                form.hasValidLicence !== null &&
                form.interestedInEarlyAccess !== null &&
                form.consentToContact === true
            );
        }
        return false;
    }, [step, form]);

    // Scroll to top of card on step change (mobile especially)
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [step]);

    const next = () => {
        if (!canProceed) return;
        setError(null);
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
    };

    const back = () => {
        setError(null);
        setStep((s) => Math.max(s - 1, 0));
    };

    const submit = async () => {
        if (!canProceed) return;
        setSubmitting(true);
        setError(null);

        const payload = {
            fullName: form.fullName.trim(),
            phoneNumber: form.phoneNumber.replace(/[\s-]/g, ""),
            email: form.email.trim() || undefined,
            city: form.city.trim(),
            preferredOperatingArea: form.preferredOperatingArea.trim(),
            vehicleMakeModel: form.vehicleMakeModel.trim(),
            vehicleYear: Number(form.vehicleYear),
            vehicleType: form.vehicleType,
            vehicleInGoodCondition: form.vehicleInGoodCondition,
            vehicleOwnership: form.vehicleOwnership,
            hasValidLicence: form.hasValidLicence,
            interestedInEarlyAccess: form.interestedInEarlyAccess,
            consentToContact: form.consentToContact,
        };

        try {
            const res = await fetch(`${API_BASE}/early-access/drivers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(
                    data?.message ?? "Something went wrong. Please try again.",
                );
                return;
            }

            setSuccess({
                message: data.message,
                alreadyRegistered: data.alreadyRegistered,
            });
        } catch {
            setError(
                "Network error. Please check your connection and try again.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const reset = () => {
        setForm(initialForm);
        setStep(0);
        setSuccess(null);
        setError(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ─────────────────────────────────────────────────────────
    // Success screen
    // ─────────────────────────────────────────────────────────
    if (success) {
        return (
            <section className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-purple-50/40 px-4 py-10 sm:py-16">
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="w-full max-w-xl bg-white rounded-3xl shadow-2xl shadow-purple-500/10 border border-purple-100 p-6 sm:p-8 md:p-12 text-center relative overflow-hidden"
                >
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-gold-200/30 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                delay: 0.15,
                                type: "spring",
                                stiffness: 200,
                            }}
                            className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-100 to-gold-100 mb-5 sm:mb-6"
                        >
                            <PartyPopper className="w-8 h-8 sm:w-10 sm:h-10 text-purple-700" />
                        </motion.div>

                        <h2 className="text-xl sm:text-2xl md:text-3xl font-archivo text-purple-900 mb-3">
                            {success.alreadyRegistered
                                ? "You're already on the list!"
                                : "You're in!"}
                        </h2>

                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6 sm:mb-8 max-w-md mx-auto">
                            {success.message}
                        </p>

                        <button
                            onClick={reset}
                            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl font-medium transition-colors"
                        >
                            Submit another driver
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </section>
        );
    }

    // ─────────────────────────────────────────────────────────
    // Form
    // ─────────────────────────────────────────────────────────
    return (
        <section className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/40 relative overflow-hidden">
            {/* Ambient background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 left-10 w-72 h-72 bg-gold-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Sticky progress bar — top of viewport on mobile, in-flow on desktop */}
            <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-purple-100/60 md:static md:bg-transparent md:backdrop-blur-none md:border-none md:pt-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-0">
                    {/* Progress bar */}
                    <div className="flex items-center justify-between mb-2">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const active = i === step;
                            const done = i < step;
                            return (
                                <div
                                    key={s.id}
                                    className="flex flex-col items-center flex-1"
                                >
                                    <motion.div
                                        animate={{
                                            scale: active ? 1.08 : 1,
                                        }}
                                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors ${
                                            done || active
                                                ? "bg-purple-700 text-white shadow-md shadow-purple-500/30"
                                                : "bg-gray-100 text-gray-400"
                                        }`}
                                    >
                                        {done ? (
                                            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                                        ) : (
                                            <Icon className="w-4 h-4 md:w-5 md:h-5" />
                                        )}
                                    </motion.div>
                                    <span
                                        className={`text-[10px] md:text-xs mt-1 md:mt-2 font-medium ${
                                            active
                                                ? "text-purple-900"
                                                : "text-gray-400"
                                        }`}
                                    >
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="h-1 md:h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-600 to-gold-500"
                            initial={false}
                            animate={{
                                width: `${((step + 1) / STEPS.length) * 100}%`,
                            }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 md:pb-16 relative z-10">
                {/* Header — full on step 0 only, compact on later steps */}
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="hero"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-center pt-6 md:pt-10 mb-6 md:mb-10 overflow-hidden"
                        >
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium border border-purple-100 shadow-sm mb-4 md:mb-5">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [1, 0.3, 1],
                                    }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                    }}
                                    className="w-2 h-2 rounded-full bg-gold-500"
                                />
                                <span>Early Access · Limited Slots</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-archivo text-purple-900 leading-[1.1]">
                                Drive with{" "}
                                <span className="text-gold-500">SurDrive</span>
                            </h1>

                            <p className="text-sm sm:text-base text-gray-600 mt-3 md:mt-4 max-w-lg mx-auto leading-relaxed px-2">
                                Be the first to hit the road when we launch.
                                Register your interest and our team will reach
                                out with onboarding instructions.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Compact label on steps 1+ (mobile only) */}
                {step > 0 && (
                    <div className="pt-4 md:pt-8 mb-4 md:mb-6 text-center md:hidden">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                            Step {step + 1} of {STEPS.length} ·{" "}
                            {STEPS[step].label}
                        </p>
                    </div>
                )}

                {/* Form card */}
                <motion.div
                    layout
                    className="bg-white rounded-2xl md:rounded-3xl shadow-xl shadow-purple-500/5 border border-purple-100 p-5 sm:p-6 md:p-8"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.2 }}
                        >
                            {step === 0 && (
                                <div className="space-y-4 md:space-y-5">
                                    <Field
                                        icon={User}
                                        label="Full Name"
                                        value={form.fullName}
                                        onChange={(v) => set("fullName", v)}
                                        placeholder="Chidi Okonkwo"
                                        autoComplete="name"
                                    />
                                    <Field
                                        icon={Phone}
                                        label="Phone Number (WhatsApp-enabled)"
                                        value={form.phoneNumber}
                                        onChange={(v) => set("phoneNumber", v)}
                                        placeholder="+2348012345678"
                                        hint="We'll reach out on WhatsApp"
                                        type="tel"
                                        autoComplete="tel"
                                        inputMode="tel"
                                    />
                                    <Field
                                        icon={Mail}
                                        label="Email Address"
                                        optional
                                        value={form.email}
                                        onChange={(v) => set("email", v)}
                                        placeholder="you@example.com"
                                        type="email"
                                        autoComplete="email"
                                        inputMode="email"
                                    />
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-4 md:space-y-5">
                                    <Field
                                        icon={MapPin}
                                        label="City / Town of Residence"
                                        value={form.city}
                                        onChange={(v) => set("city", v)}
                                        placeholder="Lagos"
                                        autoComplete="address-level2"
                                    />
                                    <Field
                                        icon={Navigation}
                                        label="Preferred Operating Area"
                                        value={form.preferredOperatingArea}
                                        onChange={(v) =>
                                            set("preferredOperatingArea", v)
                                        }
                                        placeholder="Lekki Phase 1, Victoria Island, Ikoyi"
                                        hint="Where would you like to drive most?"
                                    />
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4 md:space-y-5">
                                    <Field
                                        icon={Car}
                                        label="Vehicle Make & Model"
                                        value={form.vehicleMakeModel}
                                        onChange={(v) =>
                                            set("vehicleMakeModel", v)
                                        }
                                        placeholder="Toyota Corolla"
                                    />
                                    <Field
                                        icon={Calendar}
                                        label="Vehicle Year"
                                        value={form.vehicleYear}
                                        onChange={(v) =>
                                            set(
                                                "vehicleYear",
                                                v
                                                    .replace(/\D/g, "")
                                                    .slice(0, 4),
                                            )
                                        }
                                        placeholder="2018"
                                        type="tel"
                                        inputMode="numeric"
                                    />

                                    <SelectField
                                        icon={Car}
                                        label="Vehicle Type"
                                        value={form.vehicleType}
                                        onChange={(v) =>
                                            set("vehicleType", v as VehicleType)
                                        }
                                        options={VEHICLE_TYPE_OPTIONS}
                                    />

                                    <YesNoField
                                        icon={CheckCircle2}
                                        label="Is your vehicle in good working condition?"
                                        value={form.vehicleInGoodCondition}
                                        onChange={(v) =>
                                            set("vehicleInGoodCondition", v)
                                        }
                                    />

                                    <SelectField
                                        icon={KeyRound}
                                        label="Do you own the vehicle or drive for someone else?"
                                        value={form.vehicleOwnership}
                                        onChange={(v) =>
                                            set(
                                                "vehicleOwnership",
                                                v as VehicleOwnership,
                                            )
                                        }
                                        options={[
                                            {
                                                value: "owner",
                                                label: "I own the vehicle",
                                            },
                                            {
                                                value: "authorised_driver",
                                                label: "I drive for someone else",
                                            },
                                        ]}
                                    />
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4 md:space-y-5">
                                    <YesNoField
                                        icon={CreditCard}
                                        label="Do you have a valid driver's licence?"
                                        value={form.hasValidLicence}
                                        onChange={(v) =>
                                            set("hasValidLicence", v)
                                        }
                                    />

                                    <YesNoField
                                        icon={Rocket}
                                        label="Are you interested in joining the SurDrive Early Access Programme?"
                                        value={form.interestedInEarlyAccess}
                                        onChange={(v) =>
                                            set("interestedInEarlyAccess", v)
                                        }
                                    />

                                    <YesNoField
                                        icon={ShieldCheck}
                                        label="Do you consent to being contacted about driver onboarding?"
                                        value={form.consentToContact}
                                        onChange={(v) =>
                                            set("consentToContact", v)
                                        }
                                        hint="We can't reach out without your consent."
                                    />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="mt-4 md:mt-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm"
                            >
                                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Sticky footer on mobile, inline on desktop */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-purple-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:static md:bg-transparent md:backdrop-blur-none md:border-none md:px-0 md:py-0 md:pb-16 md:mt-8">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
                    <button
                        onClick={back}
                        disabled={step === 0}
                        className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                            step === 0
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-purple-700 hover:bg-purple-50 active:bg-purple-100"
                        }`}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back</span>
                    </button>

                    {step < STEPS.length - 1 ? (
                        <motion.button
                            whileTap={{ scale: canProceed ? 0.97 : 1 }}
                            onClick={next}
                            disabled={!canProceed}
                            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all ${
                                canProceed
                                    ? "bg-purple-900 hover:bg-purple-800 text-white shadow-lg shadow-purple-500/20"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    ) : (
                        <motion.button
                            whileTap={{ scale: canProceed ? 0.97 : 1 }}
                            onClick={submit}
                            disabled={!canProceed || submitting}
                            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all ${
                                canProceed && !submitting
                                    ? "bg-gradient-to-r from-purple-900 to-purple-700 hover:from-purple-800 hover:to-purple-600 text-white shadow-lg shadow-purple-500/30"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting…
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Join Early Access
                                </>
                            )}
                        </motion.button>
                    )}
                </div>
            </div>
        </section>
    );
};

// ─────────────────────────────────────────────────────────────
// Field components
// ─────────────────────────────────────────────────────────────

interface FieldProps {
    icon: React.ElementType;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    hint?: string;
    optional?: boolean;
    type?: string;
    autoComplete?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}

const Field: React.FC<FieldProps> = ({
    icon: Icon,
    label,
    value,
    onChange,
    placeholder,
    hint,
    optional,
    type = "text",
    autoComplete,
    inputMode,
}) => (
    <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Icon className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span className="leading-tight">
                {label}
                {optional && (
                    <span className="text-xs font-normal text-gray-400 ml-1">
                        (optional)
                    </span>
                )}
            </span>
        </label>
        <input
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-12 md:h-auto px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-base md:text-sm text-gray-900 placeholder:text-gray-300"
        />
        {hint && <p className="text-xs text-gray-400 mt-1.5 ml-1">{hint}</p>}
    </div>
);

interface SelectFieldProps {
    icon: React.ElementType;
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}

const SelectField: React.FC<SelectFieldProps> = ({
    icon: Icon,
    label,
    value,
    onChange,
    options,
}) => (
    <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Icon className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span className="leading-tight">{label}</span>
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-12 md:h-auto px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-base md:text-sm text-gray-900 bg-white appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2214%22 height=%2214%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%237C3AED%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat pr-12"
        >
            <option value="">Select…</option>
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    </div>
);

interface YesNoFieldProps {
    icon: React.ElementType;
    label: string;
    value: boolean | null;
    onChange: (v: boolean) => void;
    hint?: string;
}

const YesNoField: React.FC<YesNoFieldProps> = ({
    icon: Icon,
    label,
    value,
    onChange,
    hint,
}) => (
    <div>
        <label className="flex items-start gap-2 text-sm font-medium text-gray-700 mb-2">
            <Icon className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{label}</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
            {[
                { v: true, label: "Yes" },
                { v: false, label: "No" },
            ].map((opt) => (
                <motion.button
                    key={String(opt.v)}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onChange(opt.v)}
                    className={`h-12 md:h-auto md:py-3 rounded-xl font-medium text-base md:text-sm transition-all border ${
                        value === opt.v
                            ? "bg-purple-900 text-white border-purple-900 shadow-md shadow-purple-500/20"
                            : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 active:bg-purple-50"
                    }`}
                >
                    {opt.label}
                </motion.button>
            ))}
        </div>
        {hint && <p className="text-xs text-gray-400 mt-1.5 ml-1">{hint}</p>}
    </div>
);

export default EarlyAccessForm;
