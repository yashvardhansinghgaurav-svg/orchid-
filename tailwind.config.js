/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zenthara: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c2d3ff',
          300: '#93b0ff',
          400: '#6285ff',
          500: '#3d5aff',
          600: '#2236f5',
          700: '#1a26e1',
          800: '#1c22b6',
          900: '#1c228f',
          950: '#11145a',
        },
        aurora: {
          purple: '#7c3aed',
          blue:   '#2563eb',
          cyan:   '#06b6d4',
          pink:   '#ec4899',
          indigo: '#4f46e5',
        }
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'float':        'float 6s ease-in-out infinite',
        'float-slow':   'float 9s ease-in-out infinite',
        'pulse-glow':   'pulseGlow 3s ease-in-out infinite',
        'rotate-slow':  'rotateSlow 20s linear infinite',
        'shimmer':      'shimmer 2.5s linear infinite',
        'gradient-x':   'gradientX 8s ease infinite',
        'beam':         'beam 3s ease-in-out infinite',
        'orb-drift':    'orbDrift 12s ease-in-out infinite',
        'scanner':      'scanner 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-24px)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':     { opacity: '1',   transform: 'scale(1.05)' },
        },
        rotateSlow: {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientX: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%':     { backgroundPosition: '100% 50%' },
        },
        beam: {
          '0%,100%': { opacity: '0.3', transform: 'scaleY(0.8)' },
          '50%':     { opacity: '1',   transform: 'scaleY(1)' },
        },
        orbDrift: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%':     { transform: 'translate(40px,-30px) scale(1.1)' },
          '66%':     { transform: 'translate(-30px,20px) scale(0.95)' },
        },
        scanner: {
          '0%,100%': { transform: 'translateX(-100%)' },
          '50%':     { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
