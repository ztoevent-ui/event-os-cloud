import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "zto-gold": {
                    DEFAULT: "#D4AF37",
                    50: "#FCFBF5",
                    100: "#F7F3E2",
                    200: "#EBE0B9",
                    300: "#DFC090",
                    400: "#D4AF37", // Base Gold
                    500: "#AA8C2C",
                    600: "#806921",
                    700: "#554616",
                    800: "#2B230B",
                    900: "#000000",
                },
                "zto-dark": "#1a1a1a",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "gold-gradient": "linear-gradient(135deg, #FFC700 0%, #E0AA3E 50%, #B8860B 100%)",
            },
            animation: {
                "glow": "glow 2s ease-in-out infinite alternate",
                "flow": "flow 5s linear infinite",
            },
            keyframes: {
                glow: {
                    "0%": { textShadow: "0 0 10px #D4AF37, 0 0 20px #D4AF37" },
                    "100%": { textShadow: "0 0 20px #FFD700, 0 0 30px #FFD700" },
                },
                flow: {
                    "0%": { backgroundPosition: "0% 50%" },
                    "100%": { backgroundPosition: "100% 50%" },
                },
            },
        },
    },
    plugins: [],
};
export default config;
