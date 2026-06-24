import React from "react";
import { motion } from "framer-motion";
import { FEATURES } from "../../constants";
import { FeatureCard } from "../ui/FeatureCard";

export const Features: React.FC = () => {
    return (
        <section
            id="features"
            className="py-16 md:py-24 bg-gradient-to-b from-purple-100/50 via-white to-purple-50/50 w-full relative overflow-hidden"
        >
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/5 rounded-full blur-3xl"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <motion.span
                        className="text-sm font-bold text-gold-500 uppercase tracking-wider inline-block bg-gold-100/50 px-4 py-1.5 rounded-full"
                        whileHover={{ scale: 1.05 }}
                    >
                        ✦ Features
                    </motion.span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-archivo text-purple-900 mt-4">
                        Everything You Need for{" "}
                        <br className="hidden sm:block" />
                        <span className="text-gold-500">Safer Driving</span>
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-gold-500 to-gold-400 mx-auto mt-4 rounded-full"></div>
                    <p className="text-gray-600 mt-4 text-lg">
                        SUR-DRIVE<span className="ht">HT</span> combines full
                        navigation, hazard intelligence, and community power in
                        one app.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {FEATURES.map((feature, index) => (
                        <FeatureCard
                            key={feature.title}
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.desc}
                            delay={index * 0.05}
                        />
                    ))}
                </div>

                {/* Bottom decorative element */}
                {/* <motion.div
                    className="flex justify-center mt-12"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    viewport={{ once: true }}
                >
                    <div className="flex items-center space-x-2 text-purple-300">
                        <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></span>
                        <span className="text-sm font-medium">
                            Powered by community
                        </span>
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></span>
                    </div>
                </motion.div> */}
            </div>
        </section>
    );
};
