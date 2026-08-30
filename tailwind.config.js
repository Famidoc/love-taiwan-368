import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.resolve(__dirname, 'index.html').replace(/\\/g, '/'),
    path.resolve(__dirname, 'src/**/*.{js,ts,jsx,tsx}').replace(/\\/g, '/'),
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
