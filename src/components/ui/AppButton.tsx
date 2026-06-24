import React from "react";
import { motion } from "framer-motion";

interface AppButtonProps {
    type: "android" | "ios";
    onClick?: () => void;
    className?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
    type,
    onClick,
    className = "",
}) => {
    const isAndroid = type === "android";

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`btn-app-store ${isAndroid ? "btn-android" : "btn-ios"} ${className}`}
        >
            <i
                className={`fab ${isAndroid ? "fa-android" : "fa-apple"} text-xl`}
            ></i>
            <div className="btn-text flex flex-col leading-tight">
                <small className="text-[9px] opacity-80 font-normal">
                    {isAndroid ? "GET IT ON" : "DOWNLOAD ON THE"}
                </small>
                <span className="text-sm font-semibold">
                    {isAndroid ? "Google Play" : "App Store"}
                </span>
            </div>
        </motion.button>
    );
};
