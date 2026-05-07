/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark:     "#141414",
        card:     "#1C1C1C",
        border:   "#2A2A2A",
        gold:     "#C9A84C",
        "gold-light": "#E5C06A",
        "gold-dim":   "#7A6230",
        muted:    "#9CA3AF",
      },
    },
  },
  plugins: [],
};
