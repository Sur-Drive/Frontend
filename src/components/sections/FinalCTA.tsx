import React from "react";
import { motion } from "framer-motion";
import { AppButton } from "../ui/AppButton";

interface FinalCTAProps {
    onModalOpen: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onModalOpen }) => {
    return (
        <section className="py-16 md:py-24 bg-purple-100/50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl md:text-5xl font-archivo text-purple-900">
                        Your Road, Your Guide
                    </h2>
                    <p className="text-gray-600 text-lg mt-4 max-w-2xl mx-auto">
                        SUR-DRIVE<span className="ht">HT</span> is coming soon
                        to help drivers see what's ahead before they get there.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                        <AppButton type="android" onClick={onModalOpen} />
                        <AppButton type="ios" onClick={onModalOpen} />
                        <motion.a
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            href="#contact"
                            className="px-6 py-3 bg-white border-2 border-purple-700 text-purple-700 rounded-lg hover:bg-purple-700 hover:text-white transition-all duration-300 font-medium"
                        >
                            Contact Us
                        </motion.a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
