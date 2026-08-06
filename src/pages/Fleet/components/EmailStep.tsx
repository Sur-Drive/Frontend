import React, { useState } from "react";
import { sendOtp } from "../../../api/auth";
import GoogleLoginButton from "./GoogleLoginButton";

interface EmailStepProps {
    onSuccess: (email: string) => void;
    onError: (error: string) => void;
    setLoading: (loading: boolean) => void;
}

const EmailStep: React.FC<EmailStepProps> = ({
    onSuccess,
    onError,
    setLoading,
}) => {
    const [email, setEmail] = useState("");

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            onError("Please enter your email address");
            return;
        }

        setLoading(true);
        try {
            await sendOtp({
                identifier: email,
                role: "fleet_owner",
            });
            onSuccess(email);
        } catch (err: any) {
            onError(err.message || "Failed to send verification code");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        console.log("Google sign in clicked");
    };

    return (
        <div className="flex w-full flex-col items-center gap-6 px-4 sm:gap-8 sm:px-6 md:gap-10 md:px-8 lg:gap-[40px]">
            {/* Header */}
            <div className="flex w-full max-w-[520px] flex-col items-center gap-4 text-center">
                <h1 className="text-2xl font-bold leading-[100%] text-black sm:text-3xl md:text-[40px]">
                    Create a Fleet Account
                </h1>
                <p className="text-sm font-normal leading-[150%] text-[#8E98A8] sm:text-base md:text-[18px]">
                    Register your company to start managing vehicles, drivers,
                    and operations from one central dashboard.
                </p>
            </div>

            {/* Google Button */}
            <GoogleLoginButton />

            {/* Divider */}
            <div className="flex w-full max-w-[520px] items-center gap-2 sm:gap-4">
                <div className="flex-1 border-t border-[#7A8492]" />
                <span className="text-sm text-[#7A8492]">OR</span>
                <div className="flex-1 border-t border-[#7A8492]" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="w-full max-w-[520px]">
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="email"
                        className="text-sm font-medium text-[#1F083B]"
                    >
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="h-14 w-full rounded-xl border border-[#D1D5DB] px-4 py-3 font-['Outfit'] text-base outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="mt-6 h-14 w-full rounded-2xl bg-[#6E43A3] px-6 py-3 font-['Outfit'] text-base font-semibold text-white transition hover:opacity-90"
                >
                    Continue
                </button>
            </form>
        </div>
    );
};

export default EmailStep;
