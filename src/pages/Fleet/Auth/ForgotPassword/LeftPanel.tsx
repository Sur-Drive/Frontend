import React from "react";

interface LeftPanelProps {
    logoUrl?: string;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
    logoUrl = "/images/logo-white.png",
}) => {
    return (
        <div className="relative h-screen w-full overflow-hidden bg-[#6E43A3]">
            {/* BUS IMAGE */}
            <img
                src="/images/man.png"
                alt="Fleet Management"
                className="absolute inset-0 h-full w-full object-cover object-top"
            />

            {/* GRID LINES - Using SVG for precise control */}
            <svg
                className="absolute inset-0 h-full w-full z-0"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <pattern
                        id="grid"
                        width="50"
                        height="50"
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d="M 50 0 L 0 0 0 50"
                            fill="none"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="1"
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Gradient overlay */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    background: "rgba(12, 26, 44, 0.5)",
                }}
            />

            {/* 6 WHITE BOXES - Using the same grid pattern */}
            <div
                className="absolute z-10"
                style={{ top: "150px", left: "0px" }}
            >
                <div className="w-[50px] h-[50px] bg-white opacity-60" />
            </div>
            <div
                className="absolute z-10"
                style={{ top: "100px", left: "300px" }}
            >
                <div className="w-[50px] h-[50px] bg-white opacity-60" />
            </div>
            <div
                className="absolute z-10"
                style={{ top: "200px", left: "150px" }}
            >
                <div className="w-[50px] h-[50px] bg-white opacity-60" />
            </div>
            <div
                className="absolute z-10"
                style={{ top: "50px", left: "400px" }}
            >
                <div className="w-[50px] h-[50px] bg-white opacity-60" />
            </div>
            <div
                className="absolute z-10"
                style={{ top: "300px", left: "100px" }}
            >
                <div className="w-[50px] h-[50px] bg-white opacity-60" />
            </div>
            <div
                className="absolute z-10"
                style={{ top: "250px", left: "350px" }}
            >
                <div className="w-[50px] h-[50px] bg-white opacity-60" />
            </div>

            {/* Logo */}
            <div
                className="absolute z-20"
                style={{ top: "64px", left: "64px" }}
            >
                <img
                    src="/images/logo-white.png"
                    alt="Logo"
                    style={{
                        width: "294.3369140625px",
                        height: "75.99767303466797px",
                        objectFit: "contain",
                    }}
                />
            </div>
        </div>
    );
};

export default LeftPanel;
