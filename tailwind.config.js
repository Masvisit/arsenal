/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f1115',
        card: '#1a1d23',
        line: '#2a2f38',
        accent: { DEFAULT: '#2f5bea', soft: '#6f8ff5' },
        ink: { DEFAULT: '#e8eaed', soft: '#9aa0a6' },
        fat: { 1: '#fde047', 2: '#fdba74', 3: '#fb923c', 4: '#f87171', 5: '#ef4444' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      minHeight: { tap: '44px' },
    },
  },
  plugins: [],
};
