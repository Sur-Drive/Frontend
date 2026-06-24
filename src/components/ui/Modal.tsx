import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            // Reset states when modal opens
            setStatus("idle");
            setEmail("");
            setErrorMessage("");
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) return;

        setIsLoading(true);
        setStatus("idle");
        setErrorMessage("");

        try {
            const API_URL =
                import.meta.env.VITE_API_URL || "http://localhost:3001";
            const response = await fetch(`${API_URL}/waitlist/subscribe`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setEmail("");
                // Close modal after 2 seconds on success
                setTimeout(() => {
                    onClose();
                    setStatus("idle");
                }, 2000);
            } else {
                setStatus("error");
                setErrorMessage(
                    data.message || "Something went wrong. Please try again.",
                );
            }
        } catch (error) {
            setStatus("error");
            setErrorMessage(
                "Network error. Please check your connection and try again.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50"
                >
                    <div
                        className="absolute inset-0 bg-purple-900/70 backdrop-blur-sm"
                        onClick={onClose}
                    ></div>
                    <div className="relative min-h-screen flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl text-center border-2 border-gold-500/30"
                        >
                            {/* Success State */}
                            {status === "success" ? (
                                <>
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i className="fas fa-check-circle text-4xl text-green-600"></i>
                                    </div>
                                    <h3 className="text-2xl font-archivo text-purple-900 mb-2">
                                        You're In! 🎉
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                        Thanks for subscribing! We'll notify you
                                        when SUR-DRIVEHT launches.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-3xl font-archivo text-purple-700">
                                            🚀
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-archivo text-purple-900 mb-2">
                                        SUR-DRIVE<span className="ht">HT</span>{" "}
                                        Coming Soon
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                        The SUR-DRIVEHT platform is currently
                                        under development. The app will be
                                        available soon. Stay connected for
                                        launch updates.
                                    </p>

                                    {/* Error Message */}
                                    {status === "error" && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                            <i className="fas fa-exclamation-circle mr-2"></i>
                                            {errorMessage}
                                        </div>
                                    )}

                                    <form
                                        onSubmit={handleSubmit}
                                        className="space-y-3"
                                    >
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            required
                                            disabled={isLoading}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <motion.button
                                            whileHover={
                                                !isLoading
                                                    ? { scale: 1.02 }
                                                    : {}
                                            }
                                            whileTap={
                                                !isLoading
                                                    ? { scale: 0.98 }
                                                    : {}
                                            }
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full px-6 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-all duration-300 font-medium text-sm shadow-lg shadow-purple-700/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <svg
                                                        className="animate-spin h-4 w-4 text-white"
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
                                                    <span>Subscribing...</span>
                                                </>
                                            ) : (
                                                <span>Follow Updates</span>
                                            )}
                                        </motion.button>
                                    </form>
                                </>
                            )}

                            <button
                                onClick={onClose}
                                className="mt-4 text-gray-500 hover:text-purple-700 transition-colors text-sm font-medium"
                                disabled={isLoading}
                            >
                                {status === "success" ? "Got it!" : "Close"}
                            </button>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
