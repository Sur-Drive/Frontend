import React, { useEffect } from "react";

interface SuccessModalProps {
    onComplete: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
                className="flex max-w-md flex-col items-center rounded-2xl p-12 text-center"
                style={{
                    backgroundColor: "#D6F5DA",
                    borderRadius: "24px",
                    width: "100%",
                    maxWidth: "500px",
                }}
            >
                {/* Success Icon */}
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#4CAF50]/20">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M20 6L9 17L4 12"
                            stroke="#4CAF50"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                <h2
                    className="mb-2 font-semibold"
                    style={{
                        fontFamily: "Outfit",
                        fontSize: "32px",
                        lineHeight: "100%",
                        color: "#1F083B",
                    }}
                >
                    Verification Successful
                </h2>

                <p
                    className="text-center"
                    style={{
                        fontFamily: "Lexend",
                        fontSize: "18px",
                        lineHeight: "150%",
                        color: "#5B646F",
                    }}
                >
                    Your account has been verified. Redirecting you to complete
                    your setup...
                </p>
            </div>
        </div>
    );
};

export default SuccessModal;
