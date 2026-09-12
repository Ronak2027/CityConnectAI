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
          emerald: '#087F5B',
          teal: '#0EA5A4',
          blue: '#2563EB',
          success: '#16A34A',
          warning: '#F59E0B',
          critical: '#DC2626',
          bg: '#F5F7F4',
          card: '#FFFFFF',
          text: '#17201C',
          muted: '#64706A',
          border: '#E1E7E3',
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
