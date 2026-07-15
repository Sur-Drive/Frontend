import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AppButton } from "../ui/AppButton";

interface FinalCTAProps {
    onModalOpen: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onModalOpen }) => {
    const navigate = useNavigate();

    return (
        <section className="py-16 md:py-24 bg-gradient-to-b from-purple-100/50 via-white to-purple-50/50 w-full relative overflow-hidden">
            {/* Decorative background elements */}
            <motion.div
                className="absolute top-0 left-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl"
                animate={{
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
                animate={{
                    x: [0, -50, 0],
                    y: [0, -30, 0],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-400/5 rounded-full blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    {/* Badge with pulse */}
                    <motion.span
                        className="inline-block bg-gold-500/10 text-gold-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-gold-500/20"
                        whileHover={{ scale: 1.05 }}
                        animate={{
                            scale: [1, 1.02, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        Launching Soon
                    </motion.span>

                    <motion.h2
                        className="text-3xl md:text-5xl font-archivo text-purple-900"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        Ready to Drive Smarter?
                    </motion.h2>

                    <motion.div
                        className="w-24 h-1 bg-gradient-to-r from-gold-500 to-gold-400 mx-auto mt-4 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: 96 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        viewport={{ once: true }}
                    />

                    <motion.p
                        className="text-gray-600 text-lg mt-4 max-w-2xl mx-auto"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        viewport={{ once: true }}
                    >
                        Join the early access list and be among the first to
                        experience SUR-DRIVE<span className="ht">HT</span> when
                        we launch.
                    </motion.p>

                    {/* Waitlist CTA Button - Navigates to /waitlist */}
                    <motion.button
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate("/waitlist")}
                        className="mt-6 px-8 py-4 bg-gradient-to-r from-purple-700 to-purple-800 text-white rounded-xl hover:from-purple-800 hover:to-purple-900 transition-all duration-300 font-medium text-base md:text-lg shadow-lg shadow-purple-700/30 hover:shadow-xl hover:shadow-purple-700/40 flex items-center justify-center space-x-3 mx-auto group"
                        animate={{
                            y: [0, -5, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1,
                        }}
                    >
                        <motion.i
                            className="fas fa-rocket"
                            animate={{
                                rotate: [-5, 5, -5],
                            }}
                            transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                        <span>Join the Early Access List</span>
                        <motion.i
                            className="fas fa-arrow-right text-sm"
                            animate={{
                                x: [0, 5, 0],
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    </motion.button>

                    <motion.p
                        className="text-xs text-gray-400 mt-3"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <i className="fas fa-lock mr-1"></i>
                        No spam, unsubscribe anytime
                    </motion.p>

                    {/* Divider with animated dots */}
                    <motion.div
                        className="flex items-center gap-4 my-8"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <div className="flex items-center space-x-1">
                            <motion.span
                                className="w-1.5 h-1.5 bg-gold-500 rounded-full"
                                animate={{
                                    scale: [1, 1.5, 1],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: 0,
                                }}
                            />
                            <motion.span
                                className="w-1.5 h-1.5 bg-purple-500 rounded-full"
                                animate={{
                                    scale: [1, 1.5, 1],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: 0.3,
                                }}
                            />
                            <motion.span
                                className="w-1.5 h-1.5 bg-gold-500 rounded-full"
                                animate={{
                                    scale: [1, 1.5, 1],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: 0.6,
                                }}
                            />
                        </div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider">
                            or
                        </span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </motion.div>

                    {/* App Buttons with stagger */}
                    <motion.div
                        className="flex flex-wrap justify-center gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <AppButton type="android" onClick={onModalOpen} />
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <AppButton type="ios" onClick={onModalOpen} />
                        </motion.div>
                        <motion.a
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            href="#contact"
                            className="px-6 py-3 bg-white border-2 border-purple-700 text-purple-700 rounded-lg hover:bg-purple-700 hover:text-white transition-all duration-300 font-medium"
                        >
                            Contact Us
                        </motion.a>
                    </motion.div>

                    {/* Floating particles */}
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-gold-500/30 rounded-full"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -30, 0],
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
