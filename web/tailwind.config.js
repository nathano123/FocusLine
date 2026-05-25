/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        paper: {
          DEFAULT: '#FAFAF7',
          2: '#F2F1EA',
        },
        ink: {
          950: '#0A0A0A',
          900: '#161614',
          800: '#2A2A28',
          700: '#3A3A37',
          600: '#6E6E68',
          500: '#8E8E87',
          400: '#B6B6AE',
          300: '#D4D3CC',
          200: '#E7E6DF',
          100: '#F2F1EA',
        },
        rule: '#E7E6DF',
        tomato: {
          DEFAULT: 'oklch(0.66 0.21 28)',
          ink: 'oklch(0.58 0.21 28)',
        },
      },
      letterSpacing: {
        tighter: '-0.035em',
        tight: '-0.025em',
        normal: '-0.005em',
        wide: '0.06em',
        widest: '0.08em',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.7s cubic-bezier(.2,.7,.2,1)',
        'brand-fill': 'brandFill 4s ease-in-out infinite',
        'hero-underline': 'heroUnderline 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        brandFill: { '0%, 100%': { transform: 'scaleX(0)' }, '60%, 80%': { transform: 'scaleX(1)' } },
        heroUnderline: { '0%, 100%': { transform: 'scaleX(0)' }, '50%': { transform: 'scaleX(1)' } },
      },
    },
  },
  plugins: [],
}
