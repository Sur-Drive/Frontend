import React, { useState } from "react";
import { sendOtp } from "../../../api/auth";

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
            <button
                onClick={handleGoogleSignIn}
                className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-9 py-4 transition hover:bg-gray-50"
                style={{
                    width: "520px",
                    height: "56px",
                    padding: "16px 36px",
                    borderRadius: "16px",
                    backgroundColor: "#FFFFFF",
                }}
            >
                <div className="flex items-center gap-3">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                            d="M19.766 10.223C19.766 9.543 19.704 8.886 19.588 8.25H10.2V11.964H15.59C15.34 13.238 14.618 14.325 13.545 15.04V17.515H16.818C18.714 15.77 19.766 13.247 19.766 10.223Z"
                            fill="#4285F4"
                        />
                        <path
                            d="M10.2 19.998C12.876 19.998 15.125 19.064 16.818 17.515L13.545 15.04C12.63 15.65 11.497 16.013 10.2 16.013C7.622 16.013 5.456 14.302 4.638 12.01H1.26V14.55C2.942 17.886 6.352 19.998 10.2 19.998Z"
                            fill="#34A853"
                        />
                        <path
                            d="M4.638 12.01C4.421 11.31 4.3 10.564 4.3 9.799C4.3 9.034 4.421 8.288 4.638 7.588V5.048H1.26C0.578 6.404 0.2 7.924 0.2 9.799C0.2 11.674 0.578 13.194 1.26 14.55L4.638 12.01Z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M10.2 3.585C11.626 3.585 12.904 4.081 13.91 5.044L16.892 2.059C15.114 0.394 12.875 0 10.2 0C6.352 0 2.942 2.112 1.26 5.048L4.638 7.588C5.456 5.296 7.622 3.585 10.2 3.585Z"
                            fill="#EA4335"
                        />
                    </svg>
                    <span className="text-base font-medium text-[#1F083B]">
                        Continue with Google
                    </span>
                </div>
            </button>

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
