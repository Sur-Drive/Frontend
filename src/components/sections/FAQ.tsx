import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FAQS } from "../../constants";

// Helper component to render text with gold superscript
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    // Replace all instances of "SUR-DRIVEHT" with JSX that has gold superscript
    const parts = text.split(/(SUR-DRIVEHT)/g);

    return (
        <>
            {parts.map((part, index) => {
                if (part === "SUR-DRIVEHT") {
                    return (
                        <span key={index}>
                            SUR-DRIVE
                            <span
                                className="text-gold-500 font-bold"
                                style={{
                                    fontSize: "0.55em",
                                    verticalAlign: "super",
                                }}
                            >
                                HT
                            </span>
                        </span>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </>
    );
};

export const FAQ: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-12 md:py-24 bg-white w-full">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-10 md:mb-16"
                >
                    <span className="text-xs md:text-sm font-bold text-gold-500 uppercase tracking-wider">
                        FAQ
                    </span>
                    <h2 className="text-2xl md:text-4xl font-archivo text-purple-900 mt-2">
                        Frequently Asked Questions
                    </h2>
                </motion.div>

                <div className="space-y-2 md:space-y-3">
                    {FAQS.map((faq, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: index * 0.05,
                                }}
                                viewport={{ once: true }}
                                className="faq-item border border-purple-100 rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() =>
                                        setOpenIndex(isOpen ? null : index)
                                    }
                                    className="faq-question p-3 md:p-4 bg-purple-100/50 hover:bg-purple-100 transition-colors w-full flex justify-between items-center text-left"
                                >
                                    <span className="font-bold text-purple-900 text-sm md:text-base">
                                        <FormattedText text={faq.q} />
                                    </span>
                                    <span className="text-purple-700 text-sm md:text-base transition-transform duration-300">
                                        {isOpen ? "▲" : "▼"}
                                    </span>
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                                height: "auto",
                                                opacity: 1,
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="faq-answer p-3 md:p-4 text-gray-600 text-xs md:text-sm">
                                                <FormattedText text={faq.a} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
