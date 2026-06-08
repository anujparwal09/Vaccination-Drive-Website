import tailwindcssAnimate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#114B3A", // Dark Green
          hover: "#0C362A", // Darker Green
          light: "#E7F0ED", // Light Green
          dark: "#09251D", // Very Dark Green
        },
        secondary: {
          DEFAULT: "#38A169", // Vibrant Green
          hover: "#2F855A",
          light: "#F0FFF4",
        },
        accent: {
          DEFAULT: "#06B6D4", // Cyan
          hover: "#0891B2",
          light: "#CCFBF1",
        },
        success: {
          DEFAULT: "#22C55E", 
          light: "#DCFCE7", 
        },
        warning: {
          DEFAULT: "#F59E0B", // Amber-500
          light: "#FEF3C7", // Amber-100
        },
        error: {
          DEFAULT: "#EF4444", // Red-500
          light: "#FEE2E2", // Red-100
        },
        // Shadcn UI standard colors mapped to CSS variables
        sh_border: "hsl(var(--border))",
        sh_input: "hsl(var(--input))",
        sh_ring: "hsl(var(--ring))",
        sh_background: "hsl(var(--background))",
        sh_foreground: "hsl(var(--foreground))",
        sh_primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        sh_secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        sh_destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        sh_muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        sh_accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        sh_popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        sh_card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        premium: "0 10px 30px -10px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.02)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        glow: "0 0 20px rgba(37, 99, 235, 0.15)",
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
        "pulse-slow": {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.8, transform: "scale(1.03)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-slow": "pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
