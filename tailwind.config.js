/** @type {import('tailwindcss').Config} */
// Tokens «Clinical Luxury»: los valores viven como variables CSS (canales RGB) en style.css → :root.
// Los alias brand.* mantienen funcionando las clases existentes con la paleta nueva.
const token = name => `rgb(var(--c-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./index.html', './main.js', './anatomia.js', './site-config.js', './tele.js', './booking.js', './src/**/*.js'],
  // Clases que se agregan/quitan desde JS o con valores arbitrarios críticos
  safelist: [
    'hidden', 'active',
    'opacity-0', 'opacity-80', 'opacity-100',
    'z-0', 'z-10',
    'bg-white', 'bg-white/50', 'bg-white/90',
    'scale-125', 'shadow-md',
    'border-red-500', 'ring-red-500', 'border-gray-300',
    'animate-pulse', 'animate-spin', 'cursor-not-allowed', 'text-xl',
    '[overflow-wrap:anywhere]', 'lg:grid-rows-[auto_1fr]', 'bg-brand-light/50',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: token('navy'),
        petrol: token('petrol'),
        cyan: token('cyan'),
        teal: token('teal'),
        gold: { DEFAULT: token('gold'), light: token('gold-light') },
        surface: token('surface'),
        whatsapp: token('whatsapp'),
        brand: {
          dark: token('navy'),
          blue: token('petrol'),
          light: token('surface'),
          whatsapp: token('whatsapp'),
          accent: token('accent'),
        },
      },
      borderRadius: {
        card: '1.25rem',
        ctl: '0.75rem',
      },
      boxShadow: {
        soft: '0 10px 40px -10px rgba(15, 23, 42, 0.06)',
        hover: '0 25px 50px -12px rgba(14, 116, 144, 0.18)',
        premium: '0 30px 60px -15px rgba(15, 23, 42, 0.12)',
      },
      transitionTimingFunction: {
        lux: 'cubic-bezier(.22, 1, .36, 1)',
      },
    },
  },
  plugins: [],
};
