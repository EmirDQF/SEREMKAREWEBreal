/** @type {import('tailwindcss').Config} */
// Misma configuración que tenía el <script> inline del CDN (Tailwind 3.4.17).
module.exports = {
  content: ['./index.html', './main.js', './anatomia.js'],
  // Clases que se agregan/quitan desde JS o con valores arbitrarios críticos
  safelist: [
    'hidden', 'active',
    'opacity-0', 'opacity-80', 'opacity-100',
    'z-0', 'z-10',
    'bg-white', 'bg-white/50', 'bg-white/90',
    'scale-125', 'shadow-md',
    'border-red-500', 'ring-red-500', 'border-gray-300',
    'animate-pulse', 'animate-spin', 'cursor-not-allowed', 'text-xl',
    'rounded-[3rem]', 'rounded-[2.5rem]', 'rounded-[2rem]',
    '[overflow-wrap:anywhere]', 'lg:grid-rows-[auto_1fr]', 'bg-brand-light/50',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      colors: {
        brand: {
          dark: '#08172E',
          blue: '#163C75',
          light: '#F8FAFC',
          whatsapp: '#25D366',
          accent: '#10B981',
        },
      },
      boxShadow: {
        soft: '0 10px 40px -10px rgba(8, 23, 46, 0.05)',
        hover: '0 25px 50px -12px rgba(22, 60, 117, 0.15)',
        premium: '0 30px 60px -15px rgba(8, 23, 46, 0.1)',
      },
    },
  },
  plugins: [],
};
