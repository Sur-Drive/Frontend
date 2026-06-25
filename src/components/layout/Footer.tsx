import React from "react";
import { motion } from "framer-motion";

export const Footer: React.FC = () => {
    return (
        <footer className="bg-purple-900 text-white w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand - Centered Social Icons */}
                    <div className="text-center md:text-left">
                        <div className="flex flex-col items-center md:items-start">
                            <span className="text-xl font-archivo text-white">
                                SUR-DRIVE<span className="ht-white">HT</span>
                            </span>
                            <p className="text-purple-300 text-sm mt-2">
                                Your Road, Your Guide.
                            </p>
                        </div>

                        {/* Social Icons - Centered */}
                        <div className="flex justify-center md:justify-start space-x-4 mt-6">
                            {[
                                { name: "facebook", icon: "fa-facebook-f" },
                                { name: "instagram", icon: "fa-instagram" },
                                { name: "linkedin", icon: "fa-linkedin-in" },
                                { name: "twitter", icon: "fa-twitter" },
                                { name: "youtube", icon: "fa-youtube" },
                            ].map((social) => (
                                <motion.a
                                    key={social.name}
                                    href="#"
                                    whileHover={{ scale: 1.15, y: -2 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-purple-300 hover:text-gold-500 hover:bg-white/20 transition-all duration-300"
                                >
                                    <i className={`fab ${social.icon}`}></i>
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links - Centered */}
                    <div className="text-center">
                        <h4 className="font-bold mb-4 text-gold-500">
                            Quick Links
                        </h4>
                        <ul className="space-y-2 text-sm">
                            {[
                                "Home",
                                "Features",
                                "How It Works",
                                "For Fleets",
                            ].map((link) => (
                                <li key={link}>
                                    <a
                                        href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                                        className="text-purple-300 hover:text-white transition-colors hover:underline"
                                    >
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Partners - Centered */}
                    <div className="text-center">
                        <h4 className="font-bold mb-4 text-gold-500">
                            Partners
                        </h4>
                        <ul className="space-y-2 text-sm">
                            {[
                                "Become a Partner",
                                "Government",
                                "Insurance",
                            ].map((link) => (
                                <li key={link}>
                                    <a
                                        href="#partners"
                                        className="text-purple-300 hover:text-white transition-colors hover:underline"
                                    >
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact - Centered */}
                    <div className="text-center">
                        <h4 className="font-bold mb-4 text-gold-500">
                            Contact
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a
                                    href="mailto:surdriveht@gmail.com"
                                    className="text-purple-300 hover:text-gold-500 transition-all duration-300 flex items-center justify-center space-x-2 group"
                                >
                                    <i className="fas fa-envelope text-gold-500 text-xs"></i>
                                    <span className="group-hover:underline">
                                        surdriveht@gmail.com
                                    </span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://surdrive.org"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-300 hover:text-gold-500 transition-all duration-300 flex items-center justify-center space-x-2 group"
                                >
                                    <i className="fas fa-globe text-gold-500 text-xs"></i>
                                    <span className="group-hover:underline">
                                        surdrive.org
                                    </span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://wa.me/2348079781446"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-300 hover:text-gold-500 transition-all duration-300 flex items-center justify-center space-x-2 group"
                                >
                                    <i className="fab fa-whatsapp text-gold-500 text-xs"></i>
                                    <span className="group-hover:underline">
                                        +234 807 978 1446
                                    </span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-purple-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-purple-300">
                    <p>
                        &copy; 2026 SUR-DRIVE
                        <span className="ht-white">HT</span> All rights
                        reserved.
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a
                            href="#"
                            className="hover:text-white transition-colors hover:underline"
                        >
                            Privacy Policy
                        </a>
                        <a
                            href="#"
                            className="hover:text-white transition-colors hover:underline"
                        >
                            Terms of Service
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
