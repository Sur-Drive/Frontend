import React, { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface EmailStepProps {
  onSuccess: (email: string, resetToken: string) => void;
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
  onBack: () => void;
}

const EmailStep: React.FC<EmailStepProps> = ({
  onSuccess,
  onError,
  setLoading,
  onBack,
}) => {
  const [identifier, setIdentifier] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier) {
      onError("Please enter your email or phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset link");
      }

      const sessionId = data.sessionId || data.data?.sessionId || "";

      if (!sessionId) {
        console.error("No sessionId received in response:", data);
        onError("Failed to get reset session. Please try again.");
        return;
      }

      onSuccess(identifier, sessionId);
    } catch (err: any) {
      onError(err.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full" style={{ gap: "40px" }}>
      {/* Header */}
      <div
        className="flex flex-col items-center text-center"
        style={{ width: "520px", gap: "16px" }}
      >
        <h1
          className="text-[32px] font-bold text-black"
          style={{ fontFamily: "Outfit" }}
        >
          Forgot Password?
        </h1>
        <p
          className="text-[16px] text-[#8E98A8]"
          style={{ fontFamily: "Outfit" }}
        >
          Enter your email or phone number to receive a password reset otp.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full"
        style={{ maxWidth: "520px" }}
      >
        <div className="flex flex-col gap-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1F083B]">
              Email or Phone
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or phone number"
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
            className="w-full px-6 py-3 text-white transition rounded-2xl hover:opacity-90"
            style={{
              backgroundColor: "#6E43A3",
              height: "56px",
              borderRadius: "16px",
              fontFamily: "Outfit",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Send Reset OTP
          </button>

          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-2 text-sm text-[#8E98A8] hover:text-[#6E43A3] transition"
            style={{ fontFamily: "Outfit" }}
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailStep;
