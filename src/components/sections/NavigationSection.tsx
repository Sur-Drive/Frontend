import React from "react";
import { motion } from "framer-motion";

export const NavigationSection: React.FC = () => {
    return (
        <section id="navigation" className="py-16 md:py-24 bg-white w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-sm font-bold text-gold-500 uppercase tracking-wider">
                            Navigation
                        </span>
                        <h2 className="text-3xl md:text-4xl font-archivo text-purple-900 mt-2">
                            Navigate Smarter. Arrive Safer.
                        </h2>
                        <p className="text-gray-600 mt-4 text-lg">
                            SUR-DRIVE<span className="ht">HT</span> works just
                            like Google Maps — but with real-time hazard
                            intelligence built in.
                        </p>

                        <div className="mt-8 space-y-4">
                            {[
                                {
                                    color: "border-gold-500",
                                    title: "Turn-by-Turn Voice Guidance",
                                    desc: "Spoken directions with hazard warnings along your route.",
                                },
                                {
                                    color: "border-purple-700",
                                    title: "Interactive Map",
                                    desc: "Zoom, pan, and explore with hazard layers and traffic overlay.",
                                },
                                {
                                    color: "border-orange-600",
                                    title: "Live Route Updates",
                                    desc: "Routes adjust automatically based on new hazards and traffic.",
                                },
                                {
                                    color: "border-green-600",
                                    title: "Lane Guidance",
                                    desc: "Know which lane to be in before you get there.",
                                },
                            ].map((item, index) => (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.1,
                                    }}
                                    viewport={{ once: true }}
                                    className={`border-l-4 ${item.color} pl-4 py-2 text-left`}
                                >
                                    <p className="font-bold text-purple-900 text-left">
                                        {item.title}
                                    </p>
                                    <p className="text-sm text-gray-600 text-left">
                                        {item.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="bg-purple-100 rounded-3xl p-6 shadow-xl"
                    >
                        <div className="bg-white rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-purple-900 text-left">
                                    Live Navigation
                                </span>
                                <span className="text-xs font-bold text-green-600">
                                    ● Live
                                </span>
                            </div>
                            <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center">
                                <div className="text-center">
                                    <i className="fas fa-map text-4xl text-purple-700"></i>
                                    <p className="text-sm text-gray-600 mt-2">
                                        Interactive Map View
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Hazards • Traffic • Routes
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="bg-purple-100 rounded-xl p-3 text-center">
                                    <span className="font-bold text-purple-900 text-left">
                                        12 min
                                    </span>
                                    <p className="text-xs text-gray-600 text-left">
                                        ETA
                                    </p>
                                </div>
                                <div className="bg-purple-100 rounded-xl p-3 text-center">
                                    <span className="font-bold text-green-600 text-left">
                                        85%
                                    </span>
                                    <p className="text-xs text-gray-600 text-left">
                                        Safety Score
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
