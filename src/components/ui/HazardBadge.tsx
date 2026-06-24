import React from "react";
import { motion } from "framer-motion";

interface HazardBadgeProps {
    label: string;
    color: string;
    delay?: number;
}

export const HazardBadge: React.FC<HazardBadgeProps> = ({
    label,
    color,
    delay = 0,
}) => {
    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            className={`hazard-badge ${color} text-white`}
        >
            {label}
        </motion.span>
    );
};
