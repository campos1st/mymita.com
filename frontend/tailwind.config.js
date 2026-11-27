/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          red: '#E53935',
          redHover: '#C62828',
          graphite: '#202124',
          green: '#2E7D32',
          greenLight: '#E8F5E9',
          greenDark: '#143628',
          blue: '#1E88E5',
        },
        dark: {
          bg: '#101418',
          surface: '#171D23',
          card: '#1C252D',
          border: '#26323D',
        },
      },
      boxShadow: {
        card: '0 2px 12px rgba(16, 20, 24, 0.05)',
        cardDark: '0 4px 16px rgba(0, 0, 0, 0.28)',
      },
    },
  },
  plugins: [],
};
