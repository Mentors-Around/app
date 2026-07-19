/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#F5F9FF',
        navy: {
          DEFAULT: '#16355F',
          hover: '#1E4A80',
          dark: '#0e2340',
          light: '#25508a',
        },
        amber: {
          DEFAULT: '#F59E0B',
          hover: '#d97706',
          light: 'rgba(245,158,11,0.1)',
        },
        sky: {
          DEFAULT: '#38BDF8',
          light: 'rgba(56,189,248,0.1)',
        },
        coral: {
          DEFAULT: '#FF6B6B',
          hover: '#e85a5a',
        },
        cream: {
          DEFAULT: '#F8FAFC',
          warm: '#F1F5F9',
        },
        surface: '#ffffff',
        muted: '#64748B',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'lg': '12px',
        'xl': '12px',
        '2xl': '18px',
        brand: '12px',
        'brand-lg': '18px',
      },
      boxShadow: {
        brand: '0 4px 20px rgba(15,23,42,0.06)',
        'brand-lg': '0 8px 30px rgba(15,23,42,0.08)',
        'brand-xl': '0 12px 40px rgba(15,23,42,0.1)',
      },
      maxWidth: {
        'container': '1100px',
      },
      animation: {
        'slide-up': 'slideUp 0.4s ease-out',
        'expand-in': 'expandIn 0.3s ease',
        'shake': 'shake 0.3s',
        'spin-slow': 'spin 0.8s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        expandIn: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(-10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
    },
  },
  plugins: [],
};
