import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface HeroProps {
    onModalOpen: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onModalOpen }) => {
    const [displayText, setDisplayText] = useState("");
    const fullText = "Your Road, Your Guide";
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;
        let timeoutId: number;
        let index = 0;
        let isDeleting = false;

        const typeCharacter = () => {
            if (!isMounted) return;

            if (!isDeleting) {
                // Typing
                if (index < fullText.length) {
                    setDisplayText(fullText.slice(0, index + 1));
                    index++;
                    timeoutId = window.setTimeout(typeCharacter, 80);
                } else {
                    // Fully typed - wait 2 seconds then start deleting
                    timeoutId = window.setTimeout(() => {
                        isDeleting = true;
                        typeCharacter();
                    }, 2000);
                }
            } else {
                // Deleting
                if (index > 0) {
                    setDisplayText(fullText.slice(0, index - 1));
                    index--;
                    timeoutId = window.setTimeout(typeCharacter, 60);
                } else {
                    // Fully deleted - wait 0.5 seconds then start typing again
                    setDisplayText(""); // Ensure it's empty
                    isDeleting = false;
                    timeoutId = window.setTimeout(typeCharacter, 500);
                }
            }
        };

        // Start the cycle after 0.5 seconds
        timeoutId = window.setTimeout(typeCharacter, 500);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    const textParts = fullText.split(", ");

    const getDesktopDisplay = () => {
        if (!displayText) {
            // Return just the cursor when empty
            return (
                <span className="inline-block w-1 h-8 md:h-10 bg-purple-900 ml-1 animate-pulse"></span>
            );
        }

        if (displayText.includes(", ")) {
            const parts = displayText.split(", ");
            return (
                <>
                    <div className="text-purple-900">{parts[0]},</div>
                    <div className="text-gold-500">
                        {parts[1]}
                        <span className="inline-block w-1 h-8 md:h-10 bg-gold-500 ml-1 animate-pulse"></span>
                    </div>
                </>
            );
        } else {
            return (
                <div className="text-purple-900">
                    {displayText}
                    <span className="inline-block w-1 h-8 md:h-10 bg-purple-900 ml-1 animate-pulse"></span>
                </div>
            );
        }
    };

    const getMobileDisplay = () => {
        if (!displayText) {
            // Return just the cursor when empty
            return (
                <span className="inline-block w-1 h-8 bg-purple-900 ml-1 animate-pulse"></span>
            );
        }

        if (displayText.includes(", ")) {
            const parts = displayText.split(", ");
            return (
                <>
                    <div className="text-purple-900">{parts[0]},</div>
                    <div className="text-gold-500">
                        {parts[1]}
                        <span className="inline-block w-1 h-8 bg-gold-500 ml-1 animate-pulse"></span>
                    </div>
                </>
            );
        } else {
            return (
                <div className="text-purple-900">
                    {displayText}
                    <span className="inline-block w-1 h-8 bg-purple-900 ml-1 animate-pulse"></span>
                </div>
            );
        }
    };

    return (
        <section className="w-full min-h-screen flex items-center bg-white pt-20 pb-12 md:pt-24 md:pb-16 overflow-hidden">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center space-x-2 bg-purple-700/10 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-purple-700/20"
                        >
                            <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></span>
                            <span>Currently in Development</span>
                        </motion.div>

                        {/* Desktop View */}
                        <div className="hidden md:block">
                            <div className="text-4xl lg:text-5xl font-archivo leading-tight">
                                {getDesktopDisplay()}
                            </div>
                        </div>

                        {/* Mobile View */}
                        <div className="block md:hidden">
                            <div className="text-4xl sm:text-5xl font-archivo leading-tight">
                                {getMobileDisplay()}
                            </div>
                        </div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg font-dm-sans mt-4"
                        >
                            Real-time navigation with hazard intelligence,
                            turn-by-turn guidance, and community-powered road
                            safety — all in one app.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-wrap gap-3 md:gap-4 mb-8"
                        >
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="#features"
                                className="px-6 py-3 bg-purple-700 text-white rounded-xl hover:bg-purple-800 transition-all duration-300 font-medium shadow-lg shadow-purple-700/30"
                            >
                                Explore Features
                            </motion.a>

                            {/* Join Early Access Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate("/waitlist")}
                                className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-purple-900 rounded-xl hover:from-gold-400 hover:to-gold-300 transition-all duration-300 font-medium shadow-lg shadow-gold-500/30 flex items-center space-x-2"
                            >
                                <i className="fas fa-rocket"></i>
                                <span>Join Early Access List</span>
                            </motion.button>
                        </motion.div>

                        {/* Feature Badges */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex flex-wrap gap-2 md:gap-3"
                        >
                            {[
                                {
                                    color: "bg-gold-500",
                                    label: "Real-Time Alerts",
                                },
                                {
                                    color: "bg-purple-700",
                                    label: "Community Verified",
                                },
                                { color: "bg-red-700", label: "Emergency SOS" },
                                { color: "bg-green-600", label: "100% Free" },
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100/50"
                                >
                                    <span
                                        className={`w-2 h-2 ${item.color} rounded-full flex-shrink-0`}
                                    ></span>
                                    <span className="text-xs font-medium text-gray-700">
                                        {item.label}
                                    </span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Right Content - Mockup Image */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex justify-center"
                    >
                        <img
                            src="/images/mockup1.png"
                            alt="SUR-DRIVEHT App"
                            className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[420px] h-auto rounded-3xl"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                    const fallback =
                                        document.createElement("div");
                                    fallback.className =
                                        "h-64 md:h-80 bg-gradient-to-b from-purple-50 to-white flex items-center justify-center rounded-3xl";
                                    fallback.innerHTML = `
                                        <div class="text-center px-4">
                                            <i class="fas fa-map text-4xl text-purple-700 mb-2"></i>
                                            <p class="text-gray-600 text-sm font-medium">SUR-DRIVE<span style="color:#D4AF37;font-size:0.55em;vertical-align:super;font-weight:700;">HT</span></p>
                                            <p class="text-xs text-gray-400 mt-1">App Mockup</p>
                                        </div>
                                    `;
                                    parent.appendChild(fallback);
                                }
                            }}
                        />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
