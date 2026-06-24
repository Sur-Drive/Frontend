import React from "react";

// Format text with gold superscript for "HT"
export const formatTextWithSuperscript = (text: string): React.ReactNode => {
    const parts = text.split(/(SUR-DRIVEHT)/g);

    return parts.map((part, index) => {
        if (part === "SUR-DRIVEHT") {
            return (
                <span key={index}>
                    SUR-DRIVE
                    <span
                        className="text-gold-500 font-bold"
                        style={{ fontSize: "0.55em", verticalAlign: "super" }}
                    >
                        HT
                    </span>
                </span>
            );
        }
        return <span key={index}>{part}</span>;
    });
};

// For use in classNames or where JSX isn't needed
export const HT_SUPERSCRIPT = {
    text: "HT",
    style: {
        color: "#D4AF37",
        fontSize: "0.55em",
        verticalAlign: "super",
        fontWeight: 700,
    },
};
