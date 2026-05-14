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
        bg:            "var(--c-bg)",
        surface:       "var(--c-surface)",
        card:          "var(--c-card)",
        "card-hover":  "var(--c-card-hover)",
        border:        "var(--c-border)",
        text:          "var(--c-text)",
        muted:         "var(--c-muted)",
        accent:        "var(--c-accent)",
        "accent-deep": "var(--c-accent-deep)",
        cyan:          "var(--c-cyan)",
        magenta:       "var(--c-magenta)",
        success:       "var(--c-success)",
        "success-bg":  "var(--c-success-bg)",
        warning:       "var(--c-warning)",
        "warning-bg":  "var(--c-warning-bg)",
        danger:        "var(--c-danger)",
        "danger-bg":   "var(--c-danger-bg)",
        info:          "var(--c-info)",
        "info-bg":     "var(--c-info-bg)",
        "hover-row":   "var(--c-hover-row)",
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
