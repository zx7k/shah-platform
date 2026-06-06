/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#0c0c0c',
        'card-dark': '#0a0a0a',
        'text-light': '#e0e0e0',
        'text-muted': '#888888',
        primary: '#6366f1',
        'primary-hover': '#4f46e5',
        'border-dark': '#1f1f1f',
        'border-light': '#334155',
        'success-green': '#22c55e',
        'error-red': '#ef4444',
      },
    },
  },
  plugins: [],
};