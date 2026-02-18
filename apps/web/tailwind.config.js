/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: "hsl(var(--app-bg))",
        sidebar: "hsl(var(--sidebar-bg))",
        surface: {
          0: "hsl(var(--surface-0))",
          1: "hsl(var(--surface-1))",
          2: "hsl(var(--surface-2))",
        },
        border: {
          subtle: "hsl(var(--border-subtle))",
          strong: "hsl(var(--border-strong))",
        },
        ink: {
          muted: "hsl(var(--ink-muted))",
          soft: "hsl(var(--ink-soft))",
        },
      },
      boxShadow: {
        panel: "0 20px 50px -30px rgba(15, 23, 42, 0.45)",
      },
    },
  },
  plugins: [],
};
