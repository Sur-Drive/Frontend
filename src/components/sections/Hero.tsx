import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppButton } from "../ui/AppButton";

interface HeroProps {
    onModalOpen: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onModalOpen }) => {
    const [displayText, setDisplayText] = useState("");
    const [isTypingComplete, setIsTypingComplete] = useState(false);
    const fullText = "Your Road, Your Guide";

    useEffect(() => {
        let index = 0;
        const timer = setInterval(() => {
            if (index < fullText.length) {
                setDisplayText(fullText.substring(0, index + 1));
                index++;
            } else {
                setIsTypingComplete(true);
                clearInterval(timer);
            }
        }, 80);

        return () => clearInterval(timer);
    }, []);

    // Split the text for display
    const splitText = (text: string) => {
        const parts = text.split(", ");
        return parts;
    };

    const textParts = splitText(fullText);

    // Get display with proper colors for desktop
    const getDesktopDisplay = () => {
        if (!displayText) return null;

        if (displayText.includes(", ")) {
            const parts = displayText.split(", ");
            return (
                <>
                    <div className="text-purple-900">{parts[0]},</div>
                    <div className="text-gold-500">
                        {parts[1]}
                        {!isTypingComplete && (
                            <span className="inline-block w-1 h-6 md:h-8 bg-gold-500 ml-1 animate-pulse"></span>
                        )}
                    </div>
                </>
            );
        } else {
            return (
                <div className="text-purple-900">
                    {displayText}
                    <span className="inline-block w-1 h-6 md:h-8 bg-purple-900 ml-1 animate-pulse"></span>
                </div>
            );
        }
    };

    // Get display with proper colors for mobile
    const getMobileDisplay = () => {
        if (!displayText) return null;

        if (displayText.includes(", ")) {
            const parts = displayText.split(", ");
            return (
                <>
                    <div className="text-purple-900">{parts[0]},</div>
                    <div className="text-gold-500">
                        {parts[1]}
                        {!isTypingComplete && (
                            <span className="inline-block w-1 h-6 bg-gold-500 ml-1 animate-pulse"></span>
                        )}
                    </div>
                </>
            );
        } else {
            return (
                <div className="text-purple-900">
                    {displayText}
                    <span className="inline-block w-1 h-6 bg-purple-900 ml-1 animate-pulse"></span>
                </div>
            );
        }
    };

    return (
        <section className="w-full min-h-screen flex items-center bg-gradient-to-br from-purple-100 via-white to-purple-50 pt-20 pb-12 md:pt-24 md:pb-16 overflow-hidden">
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

                        {/* Desktop View - Two lines with proper colors */}
                        <div className="hidden md:block">
                            {isTypingComplete ? (
                                <>
                                    <div className="text-3xl lg:text-4xl font-archivo text-purple-900 leading-tight">
                                        {textParts[0]},
                                    </div>
                                    <div className="text-3xl lg:text-4xl font-archivo text-gold-500 leading-tight">
                                        {textParts[1]}
                                    </div>
                                </>
                            ) : (
                                <div className="text-3xl lg:text-4xl font-archivo leading-tight">
                                    {getDesktopDisplay()}
                                </div>
                            )}
                        </div>

                        {/* Mobile View - Two lines with proper colors */}
                        <div className="block md:hidden">
                            {isTypingComplete ? (
                                <>
                                    <div className="text-2xl sm:text-3xl font-archivo text-purple-900 leading-tight">
                                        {textParts[0]},
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-archivo text-gold-500 leading-tight">
                                        {textParts[1]}
                                    </div>
                                </>
                            ) : (
                                <div className="text-2xl sm:text-3xl font-archivo leading-tight">
                                    {getMobileDisplay()}
                                </div>
                            )}
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
                            <AppButton type="android" onClick={onModalOpen} />
                            <AppButton type="ios" onClick={onModalOpen} />
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

                    {/* Right Content - Phone Mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex justify-center"
                    >
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{
                                duration: 6,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="bg-purple-900 rounded-[40px] p-3 shadow-2xl border-4 border-purple-800 w-[280px] sm:w-[320px] md:w-[380px] lg:w-[420px]"
                        >
                            <div className="bg-white rounded-[28px] overflow-hidden">
                                {/* App Header */}
                                <div className="bg-purple-900 px-3 py-2 flex justify-between items-center">
                                    <div className="flex items-center space-x-1.5">
                                        <img
                                            src="/images/logo.png"
                                            alt="SUR-DRIVEHT"
                                            className="h-5 w-auto object-contain"
                                            onError={(e) => {
                                                const target =
                                                    e.target as HTMLImageElement;
                                                target.style.display = "none";
                                            }}
                                        />
                                        <span className="text-white text-[10px] font-archivo">
                                            SUR-DRIVE
                                            <span className="ht-white">HT</span>
                                        </span>
                                    </div>
                                    <div className="flex space-x-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        <span className="w-1.5 h-1.5 bg-gold-500 rounded-full"></span>
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                    </div>
                                </div>

                                {/* App Mockup Image */}
                                <img
                                    src="/images/app-mockup.png"
                                    alt="SUR-DRIVEHT App"
                                    className="w-full h-auto"
                                    onError={(e) => {
                                        const target =
                                            e.target as HTMLImageElement;
                                        target.style.display = "none";
                                        const parent = target.parentElement;
                                        if (parent) {
                                            const fallback =
                                                document.createElement("div");
                                            fallback.className =
                                                "h-64 md:h-80 bg-gradient-to-b from-purple-50 to-white flex items-center justify-center";
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
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
