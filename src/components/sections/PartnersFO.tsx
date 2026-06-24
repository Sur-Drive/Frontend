import React from "react";
import { motion } from "framer-motion";

export const PartnersFO: React.FC = () => {
    return (
        <section className="py-4 md:py-6 bg-white w-full overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="mx-auto overflow-hidden"
                >
                    <motion.p
                        initial={{ opacity: 0, x: -100 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="text-center text-gray-500 font-medium mb-3 sm:mb-4"
                        style={{
                            fontSize: "clamp(12px, 3vw, 16px)",
                            lineHeight: "1.3",
                        }}
                    >
                        Trusted by partners worldwide
                    </motion.p>

                    {/* Continuous scrolling marquee */}
                    <div className="relative overflow-hidden w-full">
                        <motion.div
                            className="flex items-center gap-6 sm:gap-10 md:gap-16"
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{
                                duration: 15,
                                repeat: Infinity,
                                repeatType: "loop",
                                ease: "linear",
                            }}
                            style={{ width: "fit-content" }}
                        >
                            {/* First set of logos */}
                            {[1, 2, 3, 4, 5].map((num) => (
                                <motion.img
                                    key={`first-${num}`}
                                    whileHover={{
                                        scale: 1.1,
                                        transition: { duration: 0.2 },
                                    }}
                                    src={`/images/patners${num}.jpg`}
                                    alt={`Partner ${num}`}
                                    className="h-12 sm:h-16 md:h-20 w-auto opacity-60 hover:opacity-100 transition-all duration-300 flex-shrink-0 grayscale hover:grayscale-0"
                                    onError={(e) => {
                                        const target =
                                            e.target as HTMLImageElement;
                                        target.src = `https://placehold.co/150x60/e2e8f0/64748b?text=Partner+${num}`;
                                    }}
                                />
                            ))}
                            {/* Duplicate set */}
                            {[1, 2, 3, 4, 5].map((num) => (
                                <motion.img
                                    key={`second-${num}`}
                                    whileHover={{
                                        scale: 1.1,
                                        transition: { duration: 0.2 },
                                    }}
                                    src={`/images/patners${num}.jpg`}
                                    alt={`Partner ${num}`}
                                    className="h-12 sm:h-16 md:h-20 w-auto opacity-60 hover:opacity-100 transition-all duration-300 flex-shrink-0 grayscale hover:grayscale-0"
                                    onError={(e) => {
                                        const target =
                                            e.target as HTMLImageElement;
                                        target.src = `https://placehold.co/150x60/e2e8f0/64748b?text=Partner+${num}`;
                                    }}
                                />
                            ))}
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
