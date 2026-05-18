/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0b1220',
        panel: '#121c2d',
        panelSoft: '#1a2940',
        accent: '#36d1dc',
        accentWarm: '#5b86e5',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(54, 209, 220, 0.22), 0 20px 45px -24px rgba(54, 209, 220, 0.6)',
      },
      keyframes: {
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        floatIn: 'floatIn 420ms ease-out both',
      },
    },
  },
  plugins: [],
};
