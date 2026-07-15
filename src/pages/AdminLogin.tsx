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
            const API_URL =
                import.meta.env.VITE_API_URL || "http://localhost:3001";

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
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center space-x-2 mb-4">
                            <img
                                src="/images/logo.png"
                                alt="SUR-DRIVEHT"
                                className="h-10 w-auto object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                }}
                            />
                            <span className="text-2xl font-archivo text-white">
                                SUR-DRIVE
                                <span className="text-gold-500">HT</span>
                            </span>
                        </div>
                        <h2 className="text-white text-xl font-semibold">
                            Admin Login
                        </h2>
                        <p className="text-purple-300 text-sm mt-1">
                            Access the admin dashboard
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-purple-200 text-sm font-medium mb-2">
                                Email or Phone Number
                            </label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none text-white placeholder-purple-300/50"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-purple-200 text-sm font-medium mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none text-white placeholder-purple-300/50"
                                required
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-purple-900 rounded-lg hover:from-gold-400 hover:to-gold-300 transition-all duration-300 font-semibold shadow-lg shadow-gold-500/30 disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg
                                        className="animate-spin h-4 w-4 text-purple-900"
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

                    <p className="text-center text-purple-300/70 text-xs mt-6">
                        Secure admin access only
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
