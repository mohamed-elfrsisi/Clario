/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        clario: {
          rail: '#1e1b4b',
          'rail-hover': '#312e81',
          surface: '#ffffff',
          bg: '#f1f5f9',
        },
      },
    },
  },
  plugins: [],
}
