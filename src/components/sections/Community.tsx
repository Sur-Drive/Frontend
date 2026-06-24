import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { STATS } from "../../constants";

interface StatItem {
    number: string;
    label: string;
}

const AnimatedCounter: React.FC<{
    target: string;
    label: string;
    delay: number;
}> = ({ target, label, delay }) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Parse the target number (remove + and commas)
    const parseTarget = (str: string): number => {
        return parseInt(str.replace(/[+,]/g, ""));
    };

    const targetNumber = parseTarget(target);
    const hasPlus = target.includes("+");

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 },
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        let startTime: number;
        let animationFrame: number;
        const duration = 2000; // 2 seconds

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * targetNumber);

            setCount(current);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(targetNumber);
            }
        };

        // Small delay before starting
        const timeout = setTimeout(() => {
            animationFrame = requestAnimationFrame(animate);
        }, delay);

        return () => {
            clearTimeout(timeout);
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [isVisible, targetNumber, delay]);

    const formatNumber = (num: number): string => {
        return num.toLocaleString();
    };

    return (
        <div ref={ref} className="text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: delay / 1000 }}
                viewport={{ once: true }}
                className="stat-number text-4xl md:text-5xl lg:text-6xl font-archivo text-gold-500"
            >
                {isVisible ? formatNumber(count) : "0"}
                {hasPlus && "+"}
            </motion.div>
            <p className="text-purple-300 mt-2 text-sm md:text-base">{label}</p>
        </div>
    );
};

export const Community: React.FC = () => {
    return (
        <section className="py-16 md:py-24 bg-purple-900 text-white w-full overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <span className="text-sm font-bold text-gold-500 uppercase tracking-wider inline-block bg-gold-500/10 px-4 py-1.5 rounded-full">
                        Community Powered
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl text-white font-archivo mt-4">
                        Powered by Drivers. <br className="hidden sm:block" />
                        <span className="text-gold-500">
                            Built for Safer Roads.
                        </span>
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-gold-500 to-gold-400 mx-auto mt-4 rounded-full"></div>
                    <p className="text-purple-300 mt-4 text-lg max-w-2xl mx-auto">
                        Every report helps other drivers avoid hazards and makes
                        road intelligence more accurate.
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    {STATS.map((stat, index) => (
                        <AnimatedCounter
                            key={stat.label}
                            target={stat.number}
                            label={stat.label}
                            delay={index * 200} // 200ms delay between each counter
                        />
                    ))}
                </div>

                {/* Bottom decorative element */}
                <motion.div
                    className="flex justify-center mt-12"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    viewport={{ once: true }}
                >
                    <div className="flex items-center space-x-3 text-purple-300/60">
                        <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></span>
                        <span className="text-sm font-medium">
                            Live Community Data
                        </span>
                        <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse delay-150"></span>
                        <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse delay-300"></span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
