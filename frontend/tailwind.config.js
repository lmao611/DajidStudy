/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'from-blue-500', 'to-cyan-400',
    'from-emerald-500', 'to-teal-400',
    'from-indigo-500', 'to-purple-500',
    'from-blue-600', 'to-cyan-500',
    'from-amber-500', 'to-orange-400',
    'from-pink-500', 'to-rose-400',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}
