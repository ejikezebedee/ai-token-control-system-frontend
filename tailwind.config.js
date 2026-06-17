/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        graphite: {
          950: "#0b1110",
          900: "#111a18",
          850: "#17221f",
          800: "#1f2d29"
        },
        mint: {
          500: "#26d7ae",
          600: "#14a88a"
        },
        wheat: {
          400: "#e6c36a"
        }
      },
      boxShadow: {
        panel: "0 18px 60px rgba(11, 17, 16, 0.12)"
      }
    }
  },
  plugins: []
};
