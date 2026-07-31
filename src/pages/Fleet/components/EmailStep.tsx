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
        <div
            className="flex w-full flex-col items-center"
            style={{ gap: "40px" }}
        >
            {/* Header */}
            <div
                className="flex flex-col items-center text-center"
                style={{ width: "520px", height: "120px", gap: "16px" }}
            >
                <h1
                    className="text-[40px] font-bold leading-[100%] text-black"
                    style={{ fontFamily: "Outfit" }}
                >
                    Create a Fleet Account
                </h1>
                <p
                    className="text-[18px] font-normal leading-[150%]"
                    style={{ fontFamily: "Outfit", color: "#8E98A8" }}
                >
                    Register your company to start managing vehicles, drivers,
                    and operations from one central dashboard.
                </p>
            </div>

            {/* Google Button */}
            <GoogleLoginButton />

            {/* Divider */}
            <div className="flex w-full items-center gap-4">
                <div
                    className="flex-1 border-t"
                    style={{ borderColor: "#7A8492" }}
                />
                <span className="text-sm text-[#7A8492]">OR</span>
                <div
                    className="flex-1 border-t"
                    style={{ borderColor: "#7A8492" }}
                />
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="w-full">
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
                        className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                        style={{
                            height: "56px",
                            fontFamily: "Outfit",
                            fontSize: "16px",
                        }}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="mt-6 w-full rounded-2xl px-6 py-3 text-white transition hover:opacity-90"
                    style={{
                        backgroundColor: "#6E43A3",
                        height: "56px",
                        borderRadius: "16px",
                        fontFamily: "Outfit",
                        fontSize: "16px",
                        fontWeight: 600,
                    }}
                >
                    Continue
                </button>
            </form>
        </div>
    );
};

export default EmailStep;
