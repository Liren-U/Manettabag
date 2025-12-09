// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#D46A22",
        dark: {
          main: "#0A0A0A",
          sec: "#141414",
          card: "#1A1A1A",
        },
        light: {
          text: "#FFFFFF",
          muted: "#A3A3A3",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
      maxWidth: {
        limit: "1440px",
      },
      spacing: {
        gutter: "56px",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(212, 106, 34, 0.5)",
        island: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
