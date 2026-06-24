import React from "react";

interface SuperscriptProps {
    className?: string;
    children?: React.ReactNode;
}

export const Superscript: React.FC<SuperscriptProps> = ({
    className = "",
    children = "HT",
}) => {
    return (
        <span
            className={`text-gold-500 font-bold ${className}`}
            style={{ fontSize: "0.55em", verticalAlign: "super" }}
        >
            {children}
        </span>
    );
};

export const HT_SUPERSCRIPT = {
    text: "HT",
    style: {
        color: "#D4AF37",
        fontSize: "0.55em",
        verticalAlign: "super",
        fontWeight: 700,
    },
};
