/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // shadcn-style palette
        background: "#ffffff",
        foreground: "#0a0a0a",
        card: "#ffffff",
        primary: { DEFAULT: "#18181b", foreground: "#fafafa" },
        secondary: { DEFAULT: "#f4f4f5", foreground: "#18181b" },
        muted: { DEFAULT: "#f4f4f5", foreground: "#71717a" },
        destructive: { DEFAULT: "#dc2626", foreground: "#fafafa" },
        success: { DEFAULT: "#16a34a", foreground: "#fafafa" },
        warning: { DEFAULT: "#d97706", foreground: "#fafafa" },
        border: "#e4e4e7",
      },
      borderRadius: { xl: "12px" },
    },
  },
  plugins: [],
};
