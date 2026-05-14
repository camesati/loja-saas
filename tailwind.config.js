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
        bg:           "#F5F8FC",
        card:         "#FFFFFF",
        border:       "#E2EAF2",
        text:         "#1A2E3D",
        muted:        "#6B7C8A",
        accent:       "#0474AF",
        "accent-deep":"#045C84",
        cyan:         "#33B3CB",
        magenta:      "#E91E8C",
      },
      fontFamily: {
        display: ["'Montserrat'", "system-ui", "sans-serif"],
        sans:    ["'Nunito'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
