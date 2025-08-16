/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      colors: {
        'high-contrast': {
          'bg': '#000000',
          'text': '#ffffff',
          'border': '#ffffff',
        }
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-gray-300': {
          'scrollbar-color': '#d1d5db transparent',
        },
        '.dark .scrollbar-thumb-gray-600': {
          'scrollbar-color': '#4b5563 transparent',
        },
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        },
        '.focus\\:not-sr-only:focus': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: 'inherit',
          margin: 'inherit',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
        },
        '.high-contrast': {
          '--tw-bg-opacity': '1',
          'background-color': 'rgb(0 0 0 / var(--tw-bg-opacity))',
          '--tw-text-opacity': '1',
          'color': 'rgb(255 255 255 / var(--tw-text-opacity))',
        },
        '.high-contrast .border': {
          '--tw-border-opacity': '1',
          'border-color': 'rgb(255 255 255 / var(--tw-border-opacity))',
        }
      };
      addUtilities(newUtilities);
    }
  ],
};