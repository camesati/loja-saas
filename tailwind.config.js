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
        bg:            "#F5F8FC",
        card:          "#FFFFFF",
        border:        "#E2EAF2",
        text:          "#1A2E3D",
        muted:         "#6B7C8A",
        accent:        "#0474AF",
        "accent-deep": "#045C84",
        cyan:          "#33B3CB",
        magenta:       "#E91E8C",
        success:       "#16A34A",
        "success-bg":  "#F0FDF4",
        warning:       "#D97706",
        "warning-bg":  "#FEF9EC",
        danger:        "#E11D48",
        "danger-bg":   "#FFF1F2",
        info:          "#0474AF",
        "info-bg":     "#EEF6FB",
        "hover-row":   "#F0F6FC",
      },
      fontFamily: {
        display: ["'Montserrat'", "system-ui", "sans-serif"],
        sans:    ["'Nunito'", "system-ui", "sans-serif"],
      },
      spacing: {
        card: "22px",
        section: "20px",
      },
      borderRadius: {
        DEFAULT: "10px",
        sm:  "8px",
        md:  "10px",
        lg:  "12px",
        xl:  "16px",
        "2xl": "20px",
      },
      minHeight: {
        touch: "44px",
      },
    },
  },
  plugins: [],
}
