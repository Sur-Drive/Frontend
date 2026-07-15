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
                    <span className="text-xs md:text-sm font-bold text-gold-500 uppercase tracking-wider inline-block bg-gold-500/10 px-4 py-1.5 rounded-full">
                        Coming Soon
                    </span>
                    <h2 className="text-white text-2xl md:text-4xl font-archivo mt-4">
                        Launching Soon Across Platforms
                    </h2>
                    <div className="w-20 h-1 bg-gold-500 mx-auto mt-4 rounded-full"></div>
                    <p className="text-purple-300 mt-4 text-sm md:text-lg">
                        SUR-DRIVE<span className="ht-white">HT</span> is
                        currently under development. The mobile app, web app,
                        and business dashboards will be available soon.
                    </p>
                </motion.div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-6 max-w-4xl mx-auto">
                    {[
                        { label: "Android", icon: "fab fa-android" },
                        { label: "iOS", icon: "fab fa-apple" },
                        { label: "Web", icon: "fas fa-globe" },
                        { label: "Fleet", icon: "fas fa-truck" },
                        { label: "Gov", icon: "fas fa-building" },
                        { label: "API", icon: "fas fa-code" },
                    ].map((item, index) => (
                        <motion.button
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -6, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onModalOpen}
                            className="bg-purple-800/70 rounded-xl md:rounded-2xl p-4 md:p-6 text-center hover:bg-purple-700/70 transition-all duration-300 hover:shadow-lg border border-purple-700/30 flex flex-col items-center justify-center"
                        >
                            <i
                                className={`${item.icon} text-3xl md:text-4xl text-gold-500 mb-2 md:mb-3 block`}
                            ></i>
                            <span className="text-sm md:text-base text-gold-500 font-archivo block">
                                {item.label}
                            </span>
                            <p className="text-purple-400 text-[10px] md:text-xs mt-1 block">
                                Coming Soon
                            </p>
                        </motion.button>
                    ))}
                </div>
            </div>
        </section>
    );
};
