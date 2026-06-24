/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                purple: {
                    900: "#1A0033",
                    800: "#2D0057",
                    700: "#4A148C",
                    600: "#6A1BAD",
                    500: "#8E24AA",
                    400: "#AB47BC",
                    300: "#CE93D8",
                    100: "#F3E5F5",
                },
                gold: {
                    600: "#B8860B",
                    500: "#D4AF37",
                    400: "#F0C040",
                    100: "#FFF8E1",
                },
                safe: {
                    green: "#2E7D32",
                },
                warning: {
                    orange: "#E65100",
                },
                danger: {
                    red: "#C62828",
                },
                sos: {
                    red: "#B71C1C",
                },
                checkpoint: {
                    blue: "#1565C0",
                },
            },
            fontFamily: {
                archivo: ['"Archivo Black"', "sans-serif"],
                "dm-sans": ['"DM Sans"', "sans-serif"],
            },
            animation: {
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                float: "float 6s ease-in-out infinite",
                "slide-up": "slideUp 0.6s ease-out",
                "fade-in": "fadeIn 0.8s ease-out",
                "bounce-gentle": "bounceGentle 2s ease-in-out infinite",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                slideUp: {
                    "0%": { transform: "translateY(30px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                bounceGentle: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" },
                },
            },
        },
    },
    plugins: [],
};
