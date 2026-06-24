import React from "react";
import { motion } from "framer-motion";

export const Fleets: React.FC = () => {
    return (
        <section id="fleets" className="py-12 md:py-24 bg-white w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-xs md:text-sm font-bold text-gold-500 uppercase tracking-wider">
                            For Fleets
                        </span>
                        <h2 className="text-2xl md:text-4xl font-archivo text-purple-900 mt-2">
                            For Logistics and Fleet Operators
                        </h2>
                        <p className="text-gray-600 mt-3 md:mt-4 text-sm md:text-lg">
                            SUR-DRIVE<span className="ht">HT</span> helps fleet
                            operators monitor vehicles, track road hazards,
                            improve driver safety, and reduce vehicle damage.
                        </p>

                        <div className="mt-6 md:mt-8 grid grid-cols-2 gap-2 md:gap-3">
                            <div className="bg-purple-100 rounded-xl p-3 md:p-4 text-center">
                                <p className="font-bold text-purple-900 text-xs md:text-sm">
                                    Live Vehicle Tracking
                                </p>
                            </div>
                            <div className="bg-purple-100 rounded-xl p-3 md:p-4 text-center">
                                <p className="font-bold text-purple-900 text-xs md:text-sm">
                                    Hazard Monitoring
                                </p>
                            </div>
                            <div className="bg-purple-100 rounded-xl p-3 md:p-4 text-center">
                                <p className="font-bold text-purple-900 text-xs md:text-sm">
                                    Driver Safety Analytics
                                </p>
                            </div>
                            <div className="bg-purple-100 rounded-xl p-3 md:p-4 text-center">
                                <p className="font-bold text-purple-900 text-xs md:text-sm">
                                    Daily Reports
                                </p>
                            </div>
                        </div>

                        <a
                            href="#contact"
                            className="inline-block mt-6 md:mt-8 px-5 py-2.5 md:px-6 md:py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-all duration-300 font-medium text-sm md:text-base shadow-lg shadow-purple-700/30"
                        >
                            Request Partnership
                        </a>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="flex justify-center"
                    >
                        <img
                            src="/images/mockup2.PNG"
                            alt="SUR-DRIVEHT Fleet Dashboard"
                            className="w-full max-w-[320px] sm:max-w-[400px] md:max-w-[480px] lg:max-w-[540px] h-auto rounded-3xl shadow-2xl"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                    const fallback =
                                        document.createElement("div");
                                    fallback.className =
                                        "h-72 md:h-96 bg-gradient-to-b from-purple-50 to-white flex items-center justify-center rounded-3xl shadow-2xl";
                                    fallback.innerHTML = `
                                        <div class="text-center px-4">
                                            <i class="fas fa-truck text-4xl text-purple-700 mb-2"></i>
                                            <p class="text-gray-600 text-sm font-medium">Fleet Dashboard</p>
                                            <p class="text-xs text-gray-400 mt-1">Mockup</p>
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
