import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Users } from "lucide-react";

interface AppButtonProps {
    type: "android" | "ios";
    className?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
    type,
    className = "",
}) => {
    const navigate = useNavigate();
    const isAndroid = type === "android";

    const handleClick = () => {
        navigate(isAndroid ? "/fleet" : "/manager");
    };

    return (
        <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleClick}
            className={`
                w-full flex items-center justify-between
                rounded-lg px-3 py-1.5
                text-xs font-medium
                whitespace-nowrap
                transition-all duration-200
                ${
                    isAndroid
                        ? "bg-[#1a0a2e] text-white border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:shadow-lg hover:shadow-[#D4AF37]/10"
                        : "bg-white text-[#1a0a2e] border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#1a0a2e] hover:text-white hover:shadow-lg hover:shadow-[#D4AF37]/10"
                }
                ${className}
            `}
        >
            <div className="flex items-center gap-2 min-w-0">
                {isAndroid ? (
                    <Crown size={14} className="flex-shrink-0 text-[#D4AF37]" />
                ) : (
                    <Users size={14} className="flex-shrink-0 text-[#D4AF37]" />
                )}
                <span className="truncate">
                    {isAndroid ? "Fleet Owner" : "Fleet Manager"}
                </span>
            </div>
            <span
                className={`flex-shrink-0 ml-2 ${isAndroid ? "text-[#D4AF37]/60" : "text-[#D4AF37]/50"}`}
            >
                →
            </span>
        </motion.button>
    );
};
