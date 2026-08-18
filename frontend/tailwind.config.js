/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        clario: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          accent: 'var(--color-accent)',
          blue: 'var(--color-blue)',
          green: 'var(--color-green)',
          yellow: 'var(--color-yellow)',
          red: 'var(--color-red)',
          text: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          border: 'var(--color-border)',
        },
      },
      boxShadow: {
        clario: 'var(--shadow-sm)',
        'clario-md': 'var(--shadow-md)',
        'clario-lg': 'var(--shadow-lg)',
      },
      borderRadius: {
        clario: 'var(--radius-md)',
        'clario-lg': 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
}
