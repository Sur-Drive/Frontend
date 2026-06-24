import React, { useState } from "react";
import { motion } from "framer-motion";

export const Contact: React.FC = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "General Inquiry",
        message: "",
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage("");

        try {
            const API_URL =
                import.meta.env.VITE_API_URL || "http://localhost:3000";

            const response = await fetch(`${API_URL}/waitlist/contact`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    subject: formData.subject,
                    inquiryType: formData.subject,
                    message: formData.message,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSubmitted(true);
                console.log("Form submitted successfully:", data);
                setTimeout(() => {
                    setIsSubmitted(false);
                    setFormData({
                        name: "",
                        email: "",
                        subject: "General Inquiry",
                        message: "",
                    });
                    setErrorMessage("");
                }, 3000);
            } else {
                setErrorMessage(
                    data.message || "Something went wrong. Please try again.",
                );
            }
        } catch (error) {
            setErrorMessage(
                "Network error. Please check your connection and try again.",
            );
            console.error("Error submitting form:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <section
            id="contact"
            className="py-16 md:py-24 bg-gradient-to-b from-white to-purple-50 w-full"
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header - Centered */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 md:mb-16"
                >
                    <span className="text-sm font-bold text-gold-500 uppercase tracking-wider inline-block bg-gold-100/50 px-4 py-1.5 rounded-full">
                        Get in Touch
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-archivo text-purple-900 mt-4 mb-3">
                        Let's Connect
                    </h2>
                    <div className="w-20 h-1 bg-gold-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
                        Have questions or want to partner with us? We'd love to
                        hear from you.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-12">
                    {/* Contact Info - Left Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="lg:col-span-2 space-y-6"
                    >
                        {/* Main Contact Card */}
                        <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-2xl p-6 md:p-8 text-white shadow-2xl">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center">
                                    <i className="fas fa-paper-plane text-gold-500 text-xl"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">
                                        Get in Touch
                                    </h3>
                                    <p className="text-purple-300 text-sm">
                                        We reply within 24 hours
                                    </p>
                                </div>
                            </div>

                            {/* Contact Info - Clickable Icons with Links */}
                            <div className="grid grid-cols-3 gap-3">
                                <a
                                    href="mailto:surdriveht@gmail.com"
                                    className="flex flex-col items-center p-3 rounded-xl hover:bg-white/5 transition-colors group"
                                >
                                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-gold-500/20 transition-colors">
                                        <i className="fas fa-envelope text-gold-500 text-xl group-hover:scale-110 transition-transform"></i>
                                    </div>
                                    <p className="text-xs text-purple-300 group-hover:text-gold-500 transition-colors">
                                        Email
                                    </p>
                                </a>

                                <a
                                    href="https://surdrive.org"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center p-3 rounded-xl hover:bg-white/5 transition-colors group"
                                >
                                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-gold-500/20 transition-colors">
                                        <i className="fas fa-globe text-gold-500 text-xl group-hover:scale-110 transition-transform"></i>
                                    </div>
                                    <p className="text-xs text-purple-300 group-hover:text-gold-500 transition-colors">
                                        Website
                                    </p>
                                </a>

                                <div className="flex flex-col items-center p-3 rounded-xl">
                                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-2">
                                        <i className="fas fa-clock text-gold-500 text-xl"></i>
                                    </div>
                                    <p className="text-xs text-purple-300">
                                        Status
                                    </p>
                                </div>
                            </div>

                            {/* Social Links - Centered */}
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <p className="text-sm text-purple-300 text-center mb-3">
                                    Follow us
                                </p>
                                <div className="flex justify-center space-x-3">
                                    {[
                                        {
                                            icon: "fa-facebook-f",
                                            color: "hover:bg-[#1877f2]",
                                        },
                                        {
                                            icon: "fa-instagram",
                                            color: "hover:bg-gradient-to-br hover:from-[#f09433] hover:to-[#bc1888]",
                                        },
                                        {
                                            icon: "fa-linkedin-in",
                                            color: "hover:bg-[#0a66c2]",
                                        },
                                        {
                                            icon: "fa-twitter",
                                            color: "hover:bg-[#000000]",
                                        },
                                        {
                                            icon: "fa-youtube",
                                            color: "hover:bg-[#ff0000]",
                                        },
                                    ].map((social, index) => (
                                        <motion.a
                                            key={index}
                                            href="#"
                                            whileHover={{ scale: 1.1, y: -2 }}
                                            whileTap={{ scale: 0.9 }}
                                            className={`w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white hover:text-white transition-all duration-300 ${social.color}`}
                                        >
                                            <i
                                                className={`fab ${social.icon}`}
                                            ></i>
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Info Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100 hover:shadow-lg transition-shadow text-center">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <i className="fas fa-phone text-purple-700"></i>
                                </div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="text-sm font-medium text-purple-900">
                                    Coming Soon
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100 hover:shadow-lg transition-shadow text-center">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <i className="fas fa-map-marker-alt text-purple-700"></i>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Location
                                </p>
                                <p className="text-sm font-medium text-purple-900">
                                    Global
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Form - Right Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="lg:col-span-3"
                    >
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-purple-100/50 hover:shadow-2xl transition-shadow duration-300">
                            <div className="flex items-center space-x-2 mb-6">
                                <div className="w-1 h-8 bg-gold-500 rounded-full"></div>
                                <h3 className="text-xl font-archivo text-purple-900">
                                    Send us a message
                                </h3>
                            </div>

                            {/* Error Message */}
                            {errorMessage && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    <i className="fas fa-exclamation-circle mr-2"></i>
                                    {errorMessage}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 text-left">
                                        <i className="fas fa-user text-purple-500 mr-1"></i>
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none transition-all duration-300 text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 text-left">
                                        <i className="fas fa-envelope text-purple-500 mr-1"></i>
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none transition-all duration-300 text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 text-left">
                                        <i className="fas fa-tag text-purple-500 mr-1"></i>
                                        Subject
                                    </label>
                                    <select
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none transition-all duration-300 text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option>General Inquiry</option>
                                        <option>Partnership</option>
                                        <option>Fleet Services</option>
                                        <option>Government Partnership</option>
                                        <option>Insurance Partnership</option>
                                        <option>Press/Media</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 text-left">
                                        <i className="fas fa-comment text-purple-500 mr-1"></i>
                                        Your Message
                                    </label>
                                    <textarea
                                        rows={5}
                                        name="message"
                                        placeholder="Tell us how we can help..."
                                        value={formData.message}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none transition-all duration-300 text-sm resize-none text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                    />
                                </div>

                                <motion.button
                                    whileHover={
                                        !isLoading ? { scale: 1.01 } : {}
                                    }
                                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-700 to-purple-800 text-white rounded-xl hover:from-purple-800 hover:to-purple-900 transition-all duration-300 font-medium text-sm shadow-lg shadow-purple-700/30 hover:shadow-xl hover:shadow-purple-700/40 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg
                                                className="animate-spin h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            <span>Sending...</span>
                                        </>
                                    ) : isSubmitted ? (
                                        <>
                                            <i className="fas fa-check-circle text-green-400"></i>
                                            <span>Message Sent!</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-paper-plane"></i>
                                            <span>Send Message</span>
                                        </>
                                    )}
                                </motion.button>

                                <p className="text-xs text-center text-gray-400 mt-2">
                                    <i className="fas fa-lock mr-1"></i>
                                    Your information is safe with us. We'll
                                    never share your data.
                                </p>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
