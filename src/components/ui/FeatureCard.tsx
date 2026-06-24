import React from "react";
import { motion } from "framer-motion";

interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
    delay?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
    icon,
    title,
    description,
    delay = 0,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay }}
            viewport={{ once: true }}
            whileHover={{
                y: -8,
                transition: { duration: 0.3 },
            }}
            className="feature-card bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl border border-purple-100/50 hover:border-purple-300 transition-all duration-300 group"
        >
            <div className="flex flex-col items-center text-center">
                {/* Icon - Centered */}
                <motion.div
                    className="icon-wrap w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                    whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.5 }}
                >
                    <i
                        className={`fas ${icon} text-2xl text-purple-700 group-hover:text-gold-500 transition-colors duration-300`}
                    ></i>
                </motion.div>

                <h4 className="font-bold text-purple-900 text-lg mb-2 group-hover:text-gold-500 transition-colors duration-300">
                    {title}
                </h4>

                <p className="text-gray-600 text-sm leading-relaxed">
                    {description}
                </p>

                {/* Decorative line */}
                <motion.div
                    className="w-8 h-0.5 bg-gold-500/30 rounded-full mt-4 group-hover:w-12 transition-all duration-300"
                    initial={{ width: 32 }}
                    whileHover={{ width: 48 }}
                ></motion.div>
            </div>
        </motion.div>
    );
};
