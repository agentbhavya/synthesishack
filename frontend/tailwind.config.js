/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    "border-ornament", "text-ornament", "bg-ornament", "via-ornament",
    "border-gold", "text-gold", "bg-gold", "via-gold",
    "border-gold-dim", "bg-gold-dim",
    "border-danger", "text-danger", "bg-danger-dim",
  ],
  theme: {
    extend: {
      colors: {
        surface:        "#09070504",
        panel:          "#110e09",
        border:         "#2c2318",
        ornament:       "#6b5128",
        gold:           "#c9a84c",
        "gold-dim":     "#1c150a",
        "gold-light":   "#e8c97a",
        danger:         "#c0392b",
        "danger-dim":   "#2d0d09",
        mist:           "#1a1510",
        cream:          "#e8dcc8",
        "cream-dim":    "#8a7a60",
      },
      fontFamily: {
        display:        ["Cinzel", "serif"],
        "display-deco": ["Cinzel Decorative", "serif"],
        body:           ["EB Garamond", "serif"],
        mono:           ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
