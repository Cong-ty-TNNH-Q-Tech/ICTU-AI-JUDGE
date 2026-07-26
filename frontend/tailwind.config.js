/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#6366F1', // Indigo
        'bg-dark': '#0F0F1A',
        'surface-dark': '#1A1A2E',
        'text-primary': '#E2E8F0',
        accent: '#818CF8',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
