import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", "[data-theme='dark']"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--heading)",
        },
        popover: {
          DEFAULT: "var(--card)",
          foreground: "var(--heading)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "#ffffff",
          50: "#EBF4FD",
          100: "#D7E9FB",
          200: "#AFD3F7",
          300: "#87BDF3",
          400: "#5FA7EF",
          500: "#1D7FEC",
          600: "#1666C4",
          700: "#124E9C",
          800: "#0C3574",
          900: "#061B4C",
        },
        secondary: {
          DEFAULT: "var(--fill)",
          foreground: "var(--body)",
        },
        muted: {
          DEFAULT: "var(--fill)",
          foreground: "var(--muted)",
        },
        accent: {
          DEFAULT: "var(--primary-light)",
          foreground: "var(--primary)",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "#ffffff",
        },
        border: "var(--border)",
        input: "var(--border)",
        ring: "var(--primary)",
        surface: "var(--surface)",
        heading: "var(--heading)",
        body: "var(--body)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "12px",
        btn: "8px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
        "card-hover":
          "0 4px 12px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)",
        nav: "0 1px 0 rgba(0,0,0,0.06)",
        modal: "0 20px 60px rgba(0,0,0,0.15)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
