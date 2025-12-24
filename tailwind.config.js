/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hospital-blue': '#0077be',
        'hospital-green': '#00a86b',
        'hospital-white': '#f0f8ff',
        'hospital-red': '#e32636',
      },
    },
  },
  plugins: [],
}
