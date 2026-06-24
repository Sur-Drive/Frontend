import React from "react";
import { motion } from "framer-motion";
import { HOW_IT_WORKS } from "../../constants";

export const HowItWorks: React.FC = () => {
    return (
        <section id="how-it-works" className="py-16 md:py-24 bg-purple-100/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <span className="text-sm font-bold text-gold-500 uppercase tracking-wider">
                        How It Works
                    </span>
                    <h2 className="text-3xl md:text-4xl font-archivo text-purple-900 mt-2">
                        How SUR-DRIVE<span className="ht">HT</span> Works
                    </h2>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    {HOW_IT_WORKS.map((item, index) => (
                        <motion.div
                            key={item.step}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="text-center"
                        >
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                className={`w-16 h-16 ${item.isGold ? "bg-gold-500" : "bg-purple-700"} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${item.isGold ? "shadow-gold-500/30" : "shadow-purple-700/30"}`}
                            >
                                <span
                                    className={`font-archivo text-xl ${item.isGold ? "text-purple-900" : "text-white"}`}
                                >
                                    {item.step}
                                </span>
                            </motion.div>
                            <h4 className="font-bold text-purple-900">
                                {item.title}
                            </h4>
                            <p className="text-gray-600 text-sm mt-1">
                                {item.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
