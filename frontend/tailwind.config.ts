import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        esi: {
          1: "#DC2626", // Red - Resuscitation
          2: "#EA580C", // Orange - Emergent
          3: "#EAB308", // Yellow - Urgent
          4: "#16A34A", // Green - Less Urgent
          5: "#2563EB", // Blue - Non-urgent
        }
      },
    },
  },
  plugins: [],
};
export default config;
