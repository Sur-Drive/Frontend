import React from "react";
import { motion } from "framer-motion";

export const Partners: React.FC = () => {
    return (
        <section
            id="partners"
            className="py-12 md:py-24 bg-purple-100/50 w-full"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-10 md:mb-16"
                >
                    <span className="text-xs md:text-sm font-bold text-gold-500 uppercase tracking-wider">
                        Partners
                    </span>
                    <h2 className="text-2xl md:text-4xl font-archivo text-purple-900 mt-2">
                        Partner With SUR-DRIVE<span className="ht">HT</span>
                    </h2>
                    <p className="text-gray-600 mt-3 md:mt-4 text-sm md:text-lg">
                        We work with governments, insurance companies, and
                        organizations to make roads safer for everyone.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Government */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-purple-100 hover:shadow-xl transition-shadow duration-300"
                    >
                        <h3 className="text-xl md:text-2xl font-archivo text-purple-900">
                            For Governments
                        </h3>
                        <p className="text-gray-600 mt-2 md:mt-3 text-sm">
                            Access road condition data, hazard heatmaps, and
                            road safety analytics to make smarter infrastructure
                            decisions.
                        </p>
                        <ul className="mt-4 md:mt-6 space-y-1.5 md:space-y-2 text-xs md:text-sm">
                            <li className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-gold-500 rounded-full"></span>
                                <span className="text-gray-600">
                                    Road Condition Data
                                </span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-gold-500 rounded-full"></span>
                                <span className="text-gray-600">
                                    Hazard Heatmaps
                                </span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-gold-500 rounded-full"></span>
                                <span className="text-gray-600">
                                    Road Safety Analytics
                                </span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-gold-500 rounded-full"></span>
                                <span className="text-gray-600">
                                    Citizen Reporting &amp; Data API
                                </span>
                            </li>
                        </ul>
                        <a
                            href="#contact"
                            className="inline-block mt-5 md:mt-6 px-5 py-2 md:px-6 md:py-2.5 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-all duration-300 font-medium text-sm"
                        >
                            Partner With Us
                        </a>
                    </motion.div>

                    {/* Insurance */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-purple-100 hover:shadow-xl transition-shadow duration-300"
                    >
                        <h3 className="text-xl md:text-2xl font-archivo text-purple-900">
                            For Insurance Partners
                        </h3>
                        <p className="text-gray-600 mt-2 md:mt-3 text-sm">
                            Leverage driving scores and safety intelligence for
                            better risk assessment and pricing.
                        </p>
                        <ul className="mt-4 md:mt-6 space-y-1.5 md:space-y-2 text-xs md:text-sm">
                            <li className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-gold-500 rounded-full"></span>
                                <span className="text-gray-600">
                                    Driving Scores
                                </span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-gold-500 rounded-full"></span>
                                <span className="text-gray-600">
                                    Risk Insights
                                </span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-gold-500 rounded-full"></span>
                                <span className="text-gray-600">
                                    Opt-In Driver Data
                                </span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-gold-500 rounded-full"></span>
                                <span className="text-gray-600">
                                    Safety Trends
                                </span>
                            </li>
                        </ul>
                        <a
                            href="#contact"
                            className="inline-block mt-5 md:mt-6 px-5 py-2 md:px-6 md:py-2.5 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-all duration-300 font-medium text-sm"
                        >
                            Become a Partner
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
