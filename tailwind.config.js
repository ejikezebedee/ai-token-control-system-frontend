/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151819",
        panel: "#fbfbf8",
        line: "#deddd6",
        moss: "#536b4d",
        copper: "#a7653a",
        marine: "#1f5d6b",
        plum: "#6d5368",
        signal: "#d99a3e"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(26, 31, 29, 0.08)"
      }
    },
  },
  plugins: [],
};
