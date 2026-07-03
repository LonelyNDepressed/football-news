/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep navy / gold game palette
        navy: {
          950: '#070b18',
          900: '#0b1124',
          850: '#0f1730',
          800: '#131d3d',
          700: '#1b294f',
          600: '#243766',
          500: '#324a82',
        },
        gold: {
          400: '#f4d06f',
          500: '#e8b339',
          600: '#cf9420',
          700: '#a3741a',
        },
      },
      fontFamily: {
        display: ['"Cinzel"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(232,179,57,0.25), 0 8px 30px -12px rgba(232,179,57,0.35)',
      },
    },
  },
  plugins: [],
}
