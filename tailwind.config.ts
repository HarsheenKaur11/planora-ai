import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ivory: {
          DEFAULT: "#FAF9F5",
          warm: "#F5F3EC",
          card: "#FFFFFF",
          border: "#E9E5DC",
        },
        plum: {
          50: "#F8F5FB",
          100: "#F1E9F7",
          200: "#E2D2ED",
          300: "#CEB0DE",
          400: "#AF7DC7",
          500: "#8B52A7",
          600: "#6B3588",
          700: "#502468",
          800: "#361548",
          900: "#240B32",
          DEFAULT: "#2C1242",
        },
        lavender: {
          50: "#FAF7FD",
          100: "#F2ECFA",
          200: "#E3D5F4",
          300: "#CFB6EB",
          DEFAULT: "#B792DE",
          muted: "#9D80C1",
        },
        gold: {
          50: "#FCFAF2",
          100: "#F8F3DF",
          200: "#EFE2BA",
          300: "#E4CD8E",
          400: "#D8B862",
          500: "#C8A038",
          DEFAULT: "#D4AF37",
          dark: "#A68222",
          light: "#FDF9EE",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(44, 18, 66, 0.05), 0 2px 6px -1px rgba(44, 18, 66, 0.03)",
        cardHover: "0 10px 30px -4px rgba(44, 18, 66, 0.1), 0 4px 10px -2px rgba(44, 18, 66, 0.05)",
        goldGlow: "0 0 25px rgba(212, 175, 55, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
