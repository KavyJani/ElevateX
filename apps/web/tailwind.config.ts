import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172236",
        muted: "#687488",
        canvas: "#F7F8FA",
        line: "#E7EAF0",
        cobalt: "#2457D6",
        "cobalt-dark": "#1D45AC",
        sage: "#EAF3EE",
        amber: "#F7F0DE",
      },
      boxShadow: { card: "0 12px 36px rgba(25, 38, 60, 0.06)" },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
export default config;
