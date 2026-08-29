/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        taiwan: {
          green: '#10b981',
          darkgreen: '#047857',
          forest: '#064e3b',
          amber: '#f59e0b',
          sunset: '#f97316',
          ocean: '#0284c7',
          gold: '#eab308',
          sand: '#fef3c7',
        }
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
