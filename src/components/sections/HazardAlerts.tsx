import React from "react";
import { motion } from "framer-motion";
import { HAZARD_TYPES } from "../../constants";
import { HazardBadge } from "../ui/HazardBadge";

export const HazardAlerts: React.FC = () => {
    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-12"
                >
                    <span className="text-sm font-bold text-gold-500 uppercase tracking-wider">
                        Real-Time Intelligence
                    </span>
                    <h2 className="text-3xl md:text-4xl font-archivo text-purple-900 mt-2">
                        See Road Hazards in Real Time
                    </h2>
                    <p className="text-gray-600 mt-4 text-lg">
                        Get alerts for potholes, floods, accidents, debris, road
                        works, checkpoints, and danger zones before you reach
                        them.
                    </p>
                </motion.div>

                <div className="flex flex-wrap justify-center gap-3">
                    {HAZARD_TYPES.map((hazard, index) => (
                        <HazardBadge
                            key={hazard.label}
                            label={hazard.label}
                            color={hazard.color}
                            delay={index * 0.05}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
