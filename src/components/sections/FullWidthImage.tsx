import React from "react";
import { motion } from "framer-motion";

export const FullWidthImage: React.FC = () => {
    return (
        <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="w-full overflow-hidden"
        >
            <img
                src="/images/last.jpg"
                alt="SUR-DRIVEHT"
                className="w-full h-auto object-cover"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                        const fallback = document.createElement("div");
                        fallback.className =
                            "w-full h-48 md:h-64 bg-gradient-to-r from-purple-900 to-purple-700 flex items-center justify-center";
                        fallback.innerHTML = `
                            <div class="text-center px-4">
                                <span class="text-2xl md:text-4xl font-archivo text-white">SUR-DRIVE<span style="color:#D4AF37;font-size:0.55em;vertical-align:super;font-weight:700;">HT</span></span>
                                <p class="text-purple-300 text-sm md:text-base mt-2">See What's Ahead</p>
                            </div>
                        `;
                        parent.appendChild(fallback);
                    }
                }}
            />
        </motion.section>
    );
};
