import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export const AdminLogin: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("admin_token", data.tokens.accessToken);
        localStorage.setItem("admin_user", JSON.stringify(data.user));
        navigate("/admin/dashboard");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="p-8 border shadow-2xl bg-white/10 backdrop-blur-xl rounded-2xl border-white/20">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-4 space-x-2">
              <img
                src="/images/logo.png"
                alt="SUR-DRIVEHT"
                className="object-contain w-auto h-10"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
              <span className="text-2xl text-white font-archivo">
                SUR-DRIVE
                <span className="text-gold-500">HT</span>
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white">Admin Login</h2>
            <p className="mt-1 text-sm text-purple-300">
              Access the admin dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 text-sm text-red-200 border rounded-lg bg-red-500/20 border-red-500/50">
                {error}
              </div>
            )}

            <div>
              <label className="block mb-2 text-sm font-medium text-purple-200">
                Email or Phone Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 text-white border rounded-lg outline-none bg-white/10 border-white/20 focus:ring-2 focus:ring-gold-500 focus:border-transparent placeholder-purple-300/50"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-purple-200">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-white border rounded-lg outline-none bg-white/10 border-white/20 focus:ring-2 focus:ring-gold-500 focus:border-transparent placeholder-purple-300/50"
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center w-full px-6 py-3 space-x-2 font-semibold text-purple-900 transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 shadow-gold-500/30 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-4 h-4 text-purple-900 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  <span>Login</span>
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-xs text-center text-purple-300/70">
            Secure admin access only
          </p>
        </div>
      </motion.div>
    </div>
  );
};
