import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Rocket,
    ArrowRight,
    Sparkles,
    Bell,
    ShieldCheck,
    Siren,
    Gift,
    Truck,
    Users,
    Star,
    Crown,
    Briefcase,
    LayoutDashboard,
    Zap,
} from "lucide-react";

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
                if (index < fullText.length) {
                    setDisplayText(fullText.slice(0, index + 1));
                    index++;
                    timeoutId = window.setTimeout(typeCharacter, 80);
                } else {
                    timeoutId = window.setTimeout(() => {
                        isDeleting = true;
                        typeCharacter();
                    }, 2000);
                }
            } else {
                if (index > 0) {
                    setDisplayText(fullText.slice(0, index - 1));
                    index--;
                    timeoutId = window.setTimeout(typeCharacter, 60);
                } else {
                    setDisplayText("");
                    isDeleting = false;
                    timeoutId = window.setTimeout(typeCharacter, 500);
                }
            }
        };

        timeoutId = window.setTimeout(typeCharacter, 500);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    const getDesktopDisplay = () => {
        if (!displayText) {
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
        <section className="w-full min-h-screen flex items-center bg-gradient-to-br from-slate-50 via-white to-purple-50/30 pt-16 pb-8 md:pt-20 md:pb-12 overflow-hidden relative">
            {/* Dynamic Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 left-20 w-72 h-72 bg-gold-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
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
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium border border-purple-100 shadow-sm"
                        >
                            <motion.div
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [1, 0.3, 1],
                                }}
                                transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                className="w-2 h-2 rounded-full bg-gold-500"
                            />
                            <span>Now live..</span>
                        </motion.div>

                        <div className="hidden md:block">
                            <div className="text-5xl lg:text-6xl font-archivo leading-tight mt-4">
                                {getDesktopDisplay()}
                            </div>
                        </div>

                        <div className="block md:hidden">
                            <div className="text-4xl font-archivo leading-tight mt-4">
                                {getMobileDisplay()}
                            </div>
                        </div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-base md:text-lg text-gray-600 mb-10 leading-relaxed max-w-lg mt-4"
                        >
                            Complete fleet management solution with real-time
                            tracking, hazard intelligence, and enterprise-grade
                            operations control.
                        </motion.p>

                        {/* Dashboard Access Cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-col gap-4 w-full max-w-md"
                        >
                            <motion.button
                                whileHover={{
                                    scale: 1.02,
                                    boxShadow:
                                        "0 20px 40px -10px rgba(99, 102, 241, 0.3)",
                                }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate("welcome")}
                                className="group relative w-full bg-white rounded-2xl overflow-hidden shadow-lg border border-indigo-100 hover:border-indigo-300 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="absolute -right-20 -top-20 w-56 h-56 bg-indigo-200/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="absolute -left-20 -bottom-20 w-56 h-56 bg-blue-200/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                                <div className="relative z-10 flex items-center justify-between p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-1 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl">
                                            <img
                                                src="/navigation.svg"
                                                alt="Navigation"
                                                className="w-12 h-12"
                                            />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-bold text-gray-900">
                                                Navigation
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center gap-1.5">
                                                <span>Plan & Track Routes</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-indigo-100 rounded-full text-xs font-medium text-indigo-700">
                                            Routes
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-1.5 transition-transform duration-300" />
                                    </div>
                                </div>
                            </motion.button>
                            {/* Fleet Owner Card */}
                            <motion.button
                                whileHover={{
                                    scale: 1.02,
                                    boxShadow:
                                        "0 20px 40px -10px rgba(124, 58, 237, 0.4)",
                                }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate("/fleet")}
                                className="group relative w-full bg-white rounded-2xl overflow-hidden shadow-lg border border-purple-100 hover:border-purple-300 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="absolute -right-20 -top-20 w-56 h-56 bg-purple-200/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="absolute -left-20 -bottom-20 w-56 h-56 bg-indigo-200/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                                <div className="relative z-10 flex items-center justify-between p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                                            <Crown className="w-6 h-6 text-purple-700" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-bold text-gray-900">
                                                Fleet Owner
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center gap-1.5">
                                                <LayoutDashboard className="w-3.5 h-3.5" />
                                                <span>Access Dashboard</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-purple-100 rounded-full text-xs font-medium text-purple-700">
                                            Owner
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1.5 transition-transform duration-300" />
                                    </div>
                                </div>
                            </motion.button>

                            {/* Fleet Manager Card */}
                            <motion.button
                                whileHover={{
                                    scale: 1.02,
                                    boxShadow:
                                        "0 20px 40px -10px rgba(212, 175, 55, 0.3)",
                                }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate("/manager")}
                                className="group relative w-full bg-white rounded-2xl overflow-hidden shadow-lg border border-gold-100 hover:border-gold-300 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-gold-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="absolute -right-20 -top-20 w-56 h-56 bg-amber-200/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="absolute -left-20 -bottom-20 w-56 h-56 bg-gold-200/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                                <div className="relative z-10 flex items-center justify-between p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-amber-100 to-gold-100 rounded-xl">
                                            <Briefcase className="w-6 h-6 text-amber-700" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-bold text-gray-900">
                                                Fleet Manager
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center gap-1.5">
                                                <LayoutDashboard className="w-3.5 h-3.5" />
                                                <span>Access Dashboard</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-amber-100 rounded-full text-xs font-medium text-amber-700">
                                            Manager
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1.5 transition-transform duration-300" />
                                    </div>
                                </div>
                            </motion.button>

                            {/* Navigation Button - New */}
                        </motion.div>

                        {/* Feature Badges */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex flex-wrap gap-2 mt-8"
                        >
                            {[
                                {
                                    icon: Bell,
                                    color: "bg-gold-500",
                                    label: "Real-Time Alerts",
                                },
                                {
                                    icon: ShieldCheck,
                                    color: "bg-purple-700",
                                    label: "Community Verified",
                                },
                                {
                                    icon: Siren,
                                    color: "bg-red-700",
                                    label: "Emergency SOS",
                                },
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100"
                                >
                                    <div
                                        className={`p-0.5 rounded-full ${item.color}`}
                                    >
                                        <item.icon className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-700">
                                        {item.label}
                                    </span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Right Content - Mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex justify-center"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-gold-500/20 to-purple-400/20 rounded-full blur-3xl scale-150"></div>

                            <img
                                src="/images/mockup1.png"
                                alt="SUR-DRIVEHT App"
                                className="w-full max-w-[280px] md:max-w-[380px] lg:max-w-[420px] h-auto rounded-3xl relative z-10 shadow-2xl shadow-purple-500/20"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    const parent = target.parentElement;
                                    if (parent) {
                                        const fallback =
                                            document.createElement("div");
                                        fallback.className =
                                            "h-64 md:h-80 w-full max-w-[280px] md:max-w-[380px] lg:max-w-[420px] bg-gradient-to-b from-purple-50 to-white flex items-center justify-center rounded-3xl relative z-10";
                                        fallback.innerHTML = `
                                <div class="text-center px-4">
                                    <div class="text-5xl mb-3">🚛</div>
                                    <p class="text-gray-800 font-bold text-lg">SUR-DRIVE<span style="color:#D4AF37;">HT</span></p>
                                    <p class="text-sm text-gray-500 mt-1">Fleet Management</p>
                                </div>
                            `;
                                        parent.appendChild(fallback);
                                    }
                                }}
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
