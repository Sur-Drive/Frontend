import React from "react";
import { motion } from "framer-motion";

export const EmergencySOS: React.FC = () => {
    return (
        <section className="py-12 md:py-24 bg-red-50 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div className="order-2 lg:order-1" data-aos="fade-right">
                        <span className="text-xs md:text-sm font-bold text-red-700 uppercase tracking-wider">
                            Emergency SOS
                        </span>
                        <h2 className="text-2xl md:text-4xl font-archivo text-purple-900 mt-2">
                            Emergency Help When It Matters Most
                        </h2>
                        <p className="text-gray-600 mt-3 md:mt-4 text-sm md:text-lg">
                            With one tap, drivers can send emergency alerts to
                            nearby users and saved emergency contacts.
                        </p>

                        <div className="mt-6 md:mt-8 space-y-3 md:space-y-4">
                            <div className="border-l-4 border-red-700 pl-3 md:pl-4 py-1.5 md:py-2 text-left">
                                <p className="text-sm md:text-base font-bold text-purple-900 text-left">
                                    Nearby Driver Broadcast
                                </p>
                                <p className="text-xs md:text-sm text-gray-600 text-left">
                                    Alert drivers in your area instantly.
                                </p>
                            </div>
                            <div className="border-l-4 border-red-700 pl-3 md:pl-4 py-1.5 md:py-2 text-left">
                                <p className="text-sm md:text-base font-bold text-purple-900 text-left">
                                    Emergency Contact Alert
                                </p>
                                <p className="text-xs md:text-sm text-gray-600 text-left">
                                    Notify your saved emergency contacts.
                                </p>
                            </div>
                            <div className="border-l-4 border-red-700 pl-3 md:pl-4 py-1.5 md:py-2 text-left">
                                <p className="text-sm md:text-base font-bold text-purple-900 text-left">
                                    Live SOS Location
                                </p>
                                <p className="text-xs md:text-sm text-gray-600 text-left">
                                    Share your real-time location with
                                    responders.
                                </p>
                            </div>
                        </div>

                        <button className="mt-6 md:mt-8 px-5 py-2.5 md:px-6 md:py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-all duration-300 font-medium text-sm md:text-base shadow-lg shadow-red-700/30">
                            Learn About SOS
                        </button>
                    </div>

                    <div className="order-1 lg:order-2" data-aos="fade-left">
                        <div className="bg-purple-900 rounded-3xl p-4 md:p-6 shadow-2xl mx-auto max-w-xs md:max-w-sm border-4 border-red-700/30">
                            <div className="bg-white rounded-2xl overflow-hidden">
                                <div className="bg-red-700 p-4 md:p-6 text-center">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3 animate-pulse">
                                        <span className="text-2xl md:text-4xl text-white font-archivo">
                                            SOS
                                        </span>
                                    </div>
                                    <h4 className="text-white font-bold text-base md:text-lg">
                                        Emergency Alert
                                    </h4>
                                    <p className="text-white/80 text-xs md:text-sm">
                                        Alert sent to nearby drivers
                                    </p>
                                </div>
                                <div className="p-3 md:p-4 bg-white">
                                    <div className="flex items-center space-x-2 md:space-x-3 text-xs md:text-sm text-left">
                                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-600 rounded-full flex-shrink-0"></span>
                                        <span className="text-gray-600 text-left">
                                            Emergency contacts notified
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2 md:space-x-3 text-xs md:text-sm mt-1.5 md:mt-2 text-left">
                                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-600 rounded-full flex-shrink-0"></span>
                                        <span className="text-gray-600 text-left">
                                            Location shared with nearby drivers
                                        </span>
                                    </div>
                                    <button className="w-full mt-3 md:mt-4 px-3 py-2 md:px-4 md:py-2.5 bg-red-700 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-red-800 transition-all">
                                        Cancel SOS
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
