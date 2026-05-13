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
        bg:     "#F5F8FC",
        card:   "#FFFFFF",
        border: "#E2EAF2",
        text:   "#1A2E3D",
        muted:  "#4E6A7E",
        accent: "#4A8FC1",
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        sans:    ["'Nunito'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
