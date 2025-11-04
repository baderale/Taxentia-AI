import type { Config } from "tailwindcss";

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
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Official Taxentia Color System
        "taxentia-navy": "var(--taxentia-navy)",
        "taxentia-sky": "var(--taxentia-sky)",
        "taxentia-gold": "var(--taxentia-gold)",
        "taxentia-light-gray": "var(--taxentia-light-gray)",
        "taxentia-white": "var(--taxentia-white)",
        "taxentia-crimson": "var(--taxentia-crimson)",
        "taxentia-emerald": "var(--taxentia-emerald)",
        "taxentia-slate": "var(--taxentia-slate)",
        "taxentia-sky-light": "var(--taxentia-sky-light)",
        "taxentia-text-slate": "var(--taxentia-text-slate)",
        // Legacy compatibility
        "taxentia-blue": "var(--taxentia-sky)",
        "taxentia-bg": "var(--taxentia-light-gray)",
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
        sans: ["var(--font-body)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      // Official Taxentia Typography Scale
      fontSize: {
        // Display & Headings (Rubik)
        'display': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],    // 40px - H1
        'h2': ['1.75rem', { lineHeight: '1.3', fontWeight: '600' }],        // 28px - H2
        'h3': ['1.375rem', { lineHeight: '1.4', fontWeight: '500' }],       // 22px - H3
        // Body Text (Inter)
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],         // 16px - Body
        'body-bold': ['1rem', { lineHeight: '1.6', fontWeight: '600' }],    // 16px - Bold
        'small': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],    // 13-14px - Caption
        // Code Text (Source Code Pro)
        'code': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],    // 13px - Code
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
