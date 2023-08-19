/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        "nav-bar-yellow": "#DBE8D4",
        "nav-bar-background": "#1B2A60",
        "svg-last": "#c0d8f7",
        "blog-text": "#142f6e",
        "custom-blue": "#142f6e",
        "brown-500": "#8B4513",
        "green-700": "#006400",
      },
    },
  },
  plugins: [],
};
