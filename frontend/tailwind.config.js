/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ===== ICTU Brand — Xanh nước biển ===== */
        primary: {
          50:  '#E0F7FA',
          100: '#B2EBF2',
          200: '#80DEEA',
          300: '#4DD0E1',
          400: '#26C6DA',
          500: '#00ACC1',   /* Main primary */
          600: '#0097A7',
          700: '#00838F',
          800: '#006064',
          900: '#004D40',
          DEFAULT: '#00ACC1',
        },
        accent: {
          50:  '#E1F5FE',
          100: '#B3E5FC',
          200: '#81D4FA',
          300: '#4FC3F7',
          400: '#29B6F6',
          500: '#039BE5',
          600: '#0288D1',
          DEFAULT: '#039BE5',
        },
        /* ===== Surfaces ===== */
        surface: {
          DEFAULT: '#FFFFFF',
          50:  '#F8FAFB',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          dark: '#111827',
          'dark-hover': '#1F2937',
        },
        background: {
          DEFAULT: '#F0F4F8',
          dark: '#0B0F19',
        },
        /* ===== Text ===== */
        content: {
          primary: '#0F172A',
          secondary: '#475569',
          tertiary: '#94A3B8',
          inverse: '#F8FAFC',
          'dark-primary': '#F1F5F9',
          'dark-secondary': '#94A3B8',
        },
        /* ===== Status ===== */
        success: { DEFAULT: '#10B981', light: '#D1FAE5', dark: '#065F46' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7', dark: '#92400E' },
        danger:  { DEFAULT: '#EF4444', light: '#FEE2E2', dark: '#991B1B' },
        info:    { DEFAULT: '#3B82F6', light: '#DBEAFE', dark: '#1E40AF' },
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '800' }],
        'heading': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        'subheading': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
        'elevated': '0 20px 40px -12px rgb(0 0 0 / 0.12)',
        'glow':     '0 0 20px rgb(0 172 193 / 0.25)',
        'glow-lg':  '0 0 40px rgb(0 172 193 / 0.3)',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
      },
      animation: {
        'fade-in':     'fade-in 0.3s ease-out',
        'fade-in-up':  'fade-in-up 0.4s ease-out',
        'slide-down':  'slide-down 0.3s ease-out',
        'scale-in':    'scale-in 0.2s ease-out',
        'shimmer':     'shimmer 2s linear infinite',
        'float':       'float 4s ease-in-out infinite',
        'pulse-soft':  'pulse-soft 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
