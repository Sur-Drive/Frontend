import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_ITEMS } from "../../constants";
import { AppButton } from "../ui/AppButton";

interface HeaderProps {
    onModalOpen: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onModalOpen }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 25);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isMobileMenuOpen]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isMobileMenuOpen]);

    if (!mounted) return null;

    return (
        <>
            <motion.header
                initial={{ y: -24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="fixed left-0 right-0 top-0 z-50"
            >
                <motion.div
                    animate={{
                        marginTop: isScrolled ? 12 : 0,
                        marginLeft: isScrolled ? 10 : 0,
                        marginRight: isScrolled ? 10 : 0,
                        borderRadius: isScrolled ? 20 : 0,
                        width: isScrolled ? "calc(100% - 20px)" : "100%",
                    }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className={`
                        mx-auto overflow-hidden transition-all duration-300
                        ${
                            isScrolled
                                ? "bg-gradient-to-r from-[#1A0033]/95 via-[#2D0057]/95 to-[#1A0033]/95 shadow-[0_10px_40px_rgba(26,0,51,0.3)] backdrop-blur-xl border border-purple-700/30"
                                : "bg-gradient-to-r from-[#1A0033] via-[#2D0057] to-[#1A0033]"
                        }
                    `}
                >
                    <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
                        {/* Logo */}
                        <a
                            href="#"
                            className="flex shrink-0 items-center space-x-3 group"
                        >
                            <div className="relative flex items-center">
                                <img
                                    src="/images/logo.png"
                                    alt="SUR-DRIVEHT"
                                    className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                                    onError={(e) => {
                                        const target =
                                            e.target as HTMLImageElement;
                                        target.style.display = "none";
                                    }}
                                />
                                {/* Subtle glow behind logo on scroll */}
                                {isScrolled && (
                                    <div className="absolute inset-0 blur-xl opacity-30">
                                        <div className="w-full h-full bg-gold-500/20 rounded-full scale-150"></div>
                                    </div>
                                )}
                            </div>
                            <span className="text-xl font-archivo text-white drop-shadow-lg">
                                SUR-DRIVE<span className="ht-white">HT</span>
                            </span>
                        </a>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {NAV_ITEMS.map((item) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    className="inline-flex h-10 min-w-[80px] items-center justify-center rounded-full px-4 text-sm font-medium text-purple-300 transition-all duration-300 hover:bg-white/10 hover:text-gold-500"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>

                        {/* Desktop Buttons */}
                        <div className="hidden lg:flex items-center space-x-3">
                            <AppButton type="android" onClick={onModalOpen} />
                            <AppButton type="ios" onClick={onModalOpen} />
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.button
                            type="button"
                            aria-label="Close menu backdrop"
                            onClick={() => setIsMobileMenuOpen(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: -18, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -18, scale: 0.96 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="fixed left-4 right-4 top-[80px] z-50 overflow-hidden rounded-2xl border border-purple-700/30 bg-gradient-to-b from-[#1A0033] via-[#2D0057] to-[#1A0033] backdrop-blur-2xl shadow-2xl lg:hidden"
                        >
                            <div className="flex flex-col p-4 gap-2">
                                {/* Logo removed from mobile menu */}

                                {NAV_ITEMS.map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                        className="rounded-full px-5 py-4 text-center text-lg font-medium text-white transition hover:bg-white/10 hover:text-gold-500"
                                    >
                                        {item.label}
                                    </a>
                                ))}

                                <div className="mt-2 flex flex-col gap-3 pt-4 border-t border-purple-700/30">
                                    <AppButton
                                        type="android"
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            onModalOpen();
                                        }}
                                        className="w-full justify-center"
                                    />
                                    <AppButton
                                        type="ios"
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            onModalOpen();
                                        }}
                                        className="w-full justify-center"
                                    />
                                </div>

                                <p className="text-center text-xs text-purple-300 mt-4">
                                    SUR-DRIVEHT © 2026
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
