/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#A34B24',
          primaryDark: '#873815',
          primaryLight: '#FDF2E9',
          primaryBorder: '#F4D7C5',
          terracotta: '#A34B24',
          emerald: '#A34B24', // Unified primary accent mapped to the new terracotta theme
          teal: '#C25E2E',
          blue: '#2563EB',
          success: '#16A34A',
          warning: '#D97706',
          critical: '#DC2626',
          bg: '#FAF7F2',
          card: '#FFFFFF',
          text: '#1C1917',
          muted: '#78716C',
          border: '#EBE3D7',
          cream: '#F5EFE6',
          sand: '#EFE7DC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
      }
    },
  },
  plugins: [],
}
