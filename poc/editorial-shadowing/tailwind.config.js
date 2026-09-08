/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        arabic: ["var(--font-plex-arabic)", "var(--font-plex-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        reading: "74ch",
      },
    },
  },
  plugins: [],
};
