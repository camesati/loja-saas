/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
    "./node_modules/@tremor/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:     "#F8FAFB",
        card:   "#FFFFFF",
        border: "#E4ECF2",
        text:   "#2D4A5E",
        muted:  "#8FA3B1",
        accent: "#4A8FC1",
      },
      fontFamily: {
        sans:    ["'Open Sans'", "system-ui", "sans-serif"],
        heading: ["'Montserrat'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
}
