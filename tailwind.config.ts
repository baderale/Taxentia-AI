import type { Config } from "tailwindcss";

const channel = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: channel("background"),
        foreground: channel("foreground"),
        card: { DEFAULT: channel("card"), foreground: channel("foreground") },
        popover: { DEFAULT: channel("card"), foreground: channel("foreground") },
        primary: { DEFAULT: channel("primary"), foreground: channel("primary-foreground") },
        secondary: { DEFAULT: channel("secondary"), foreground: channel("foreground") },
        muted: { DEFAULT: channel("muted"), foreground: channel("muted-foreground") },
        accent: { DEFAULT: channel("accent"), foreground: channel("primary") },
        destructive: { DEFAULT: channel("destructive"), foreground: channel("primary-foreground") },
        border: channel("border"),
        input: channel("input"),
        ring: channel("ring"),
        // Taxentia brand and status colors
        ink: channel("ink"),
        navy: channel("primary"),
        sky: channel("sky"),
        gold: { DEFAULT: channel("gold"), deep: channel("gold-deep") },
        good: channel("good"),
        warn: channel("warn"),
        bad: channel("destructive"),
      },
      fontFamily: {
        serif: ["Newsreader", "Georgia", "serif"],
        sans: ["IBM Plex Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "Menlo", "monospace"],
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        rise: "rise 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
