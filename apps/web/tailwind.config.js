/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Surface system
        "surface": "#f9f9f9",
        "surface-dim": "#dadada",
        "surface-bright": "#f9f9f9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f3",
        "surface-container": "#eeeeee",
        "surface-container-high": "#e8e8e8",
        "surface-container-highest": "#e2e2e2",
        "surface-variant": "#e2e2e2",
        "surface-tint": "#9d4300",
        "on-surface": "#1a1c1c",
        "on-surface-variant": "#584237",
        "background": "#f9f9f9",
        "on-background": "#1a1c1c",

        // Primary
        "primary": "#9d4300",
        "on-primary": "#ffffff",
        "primary-container": "#f97316",
        "on-primary-container": "#582200",
        "primary-fixed": "#ffdbca",
        "primary-fixed-dim": "#ffb690",
        "on-primary-fixed": "#341100",
        "on-primary-fixed-variant": "#783200",
        "inverse-primary": "#ffb690",

        // Secondary
        "secondary": "#5e5e5e",
        "on-secondary": "#ffffff",
        "secondary-container": "#e2e2e2",
        "on-secondary-container": "#646464",
        "secondary-fixed": "#e2e2e2",
        "secondary-fixed-dim": "#c6c6c6",
        "on-secondary-fixed": "#1b1b1b",
        "on-secondary-fixed-variant": "#474747",

        // Tertiary
        "tertiary": "#006398",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#00a2f4",
        "on-tertiary-container": "#003554",
        "tertiary-fixed": "#cde5ff",
        "tertiary-fixed-dim": "#93ccff",
        "on-tertiary-fixed": "#001d32",
        "on-tertiary-fixed-variant": "#004b74",

        // Error
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        // Outline
        "outline": "#8c7164",
        "outline-variant": "#e0c0b1",

        // Inverse
        "inverse-surface": "#2f3131",
        "inverse-on-surface": "#f1f1f1",
      },
      fontFamily: {
        "sans": ["Plus Jakarta Sans", "sans-serif"],
        "headline": ["Plus Jakarta Sans", "sans-serif"],
        "body": ["Plus Jakarta Sans", "sans-serif"],
        "label": ["Plus Jakarta Sans", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
