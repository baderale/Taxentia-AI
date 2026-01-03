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
        // Refined Pinecone-inspired colors
        "off-white": "#FBFBFC",
        "warm-black": "#1C1917",
        "slate-medium": "#64748B",
        "amber-accent": "#D97706",
        "success": "#10B981",
        "warning": "#F59E0B",
        "error": "#EF4444",
      },
      fontFamily: {
        heading: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        serif: ["Courier Prime", "Courier", "monospace"],
        mono: ["Source Code Pro", "Monaco", "monospace"],
      },
      // Refined Typography Scale (Pinecone-inspired with Inter font)
      fontSize: {
        // Display & Headings (H1 - Hero)
        'display': ['2.75rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.88px' }],    // 44px - H1
        'h2': ['2rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.5px' }],              // 32px - H2
        'h3': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],                                    // 24px - H3
        'h4': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],                                   // 20px - H4
        // Body Text (Inter)
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],         // 16px - Body
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],  // 18px - Body Large
        'body-bold': ['1rem', { lineHeight: '1.6', fontWeight: '500' }],    // 16px - Body Medium
        'small': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],    // 14px - Caption
        'xs': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],        // 12px - Extra small
        // Code Text
        'code': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],    // 13px - Code
      },
      letterSpacing: {
        tighter: '-0.88px',
        tight: '-0.5px',
        normal: '0px',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "slide-in-left": "slide-in-left 0.6s ease-out",
        "slide-in-right": "slide-in-right 0.6s ease-out",
        "pulse-subtle": "pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
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
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-in-left": {
          from: {
            opacity: "0",
            transform: "translateX(-20px)",
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "slide-in-right": {
          from: {
            opacity: "0",
            transform: "translateX(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      // Landing page-specific confidence colors
      opacity: {
        "high-confidence": "0.95",
        "medium-confidence": "0.80",
        "low-confidence": "0.65",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
