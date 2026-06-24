import React from "react";
import { motion } from "framer-motion";

interface ComingSoonProps {
    onModalOpen: () => void;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ onModalOpen }) => {
    return (
        <section className="py-12 md:py-24 bg-purple-900 text-white w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-10 md:mb-16"
                >
                    <span className="text-xs md:text-sm font-bold text-gold-500 uppercase tracking-wider">
                        Coming Soon
                    </span>
                    <h2 className="text-white text-2xl md:text-4xl font-archivo mt-2">
                        Launching Soon Across Platforms
                    </h2>
                    <p className="text-purple-300 mt-3 md:mt-4 text-sm md:text-lg">
                        SUR-DRIVE<span className="ht-white">HT</span> is
                        currently under development. The mobile app, web app,
                        and business dashboards will be available soon.
                    </p>
                </motion.div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
                    {[
                        { label: "Android", icon: "fa-brands fa-android" },
                        { label: "iOS", icon: "fa-brands fa-apple" },
                        { label: "Web", icon: "fa-solid fa-globe" },
                        { label: "Fleet", icon: "fa-solid fa-truck" },
                        { label: "Gov", icon: "fa-solid fa-building" },
                        { label: "API", icon: "fa-solid fa-code" },
                    ].map((item, index) => (
                        <motion.button
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            onClick={onModalOpen}
                            className="bg-purple-800 rounded-2xl p-3 md:p-6 text-center hover:bg-purple-700 transition-all duration-300 hover:shadow-xl"
                        >
                            <i
                                className={`${item.icon} text-2xl md:text-3xl text-gold-500 mb-1 md:mb-2 block`}
                            ></i>
                            <span className="text-sm md:text-lg text-gold-500 font-archivo">
                                {item.label}
                            </span>
                            <p className="text-purple-300 text-[10px] md:text-xs mt-1">
                                Coming Soon
                            </p>
                        </motion.button>
                    ))}
                </div>
            </div>
        </section>
    );
};
