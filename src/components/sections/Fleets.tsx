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
                        className="bg-purple-100 rounded-3xl p-4 md:p-6 shadow-xl"
                    >
                        <div className="bg-white rounded-2xl p-4 md:p-6">
                            <div className="flex justify-between items-center mb-3 md:mb-4">
                                <span className="font-bold text-purple-900 text-sm md:text-base">
                                    Fleet Dashboard
                                </span>
                                <span className="text-[10px] md:text-xs font-bold text-green-600">
                                    ● Active
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                                <div className="bg-purple-100 rounded-xl p-2 md:p-3 text-center">
                                    <span className="text-xl md:text-2xl font-archivo text-purple-900">
                                        12
                                    </span>
                                    <p className="text-[10px] md:text-xs text-gray-600">
                                        Active Vehicles
                                    </p>
                                </div>
                                <div className="bg-purple-100 rounded-xl p-2 md:p-3 text-center">
                                    <span className="text-xl md:text-2xl font-archivo text-orange-600">
                                        3
                                    </span>
                                    <p className="text-[10px] md:text-xs text-gray-600">
                                        Hazards Ahead
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-1.5 md:space-y-2">
                                <div className="flex justify-between text-xs md:text-sm">
                                    <span className="text-gray-600">
                                        Driver Safety Score
                                    </span>
                                    <span className="font-bold text-green-600">
                                        92%
                                    </span>
                                </div>
                                <div className="w-full h-1.5 md:h-2 bg-gray-200 rounded-full">
                                    <div
                                        className="h-1.5 md:h-2 bg-green-600 rounded-full"
                                        style={{ width: "92%" }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
