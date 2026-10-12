/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F0F0F0',
        ink: '#121212',
        'bauhaus-red': '#D02020',
        'bauhaus-blue': '#1040C0',
        'bauhaus-yellow': '#F0C020',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        hard: '4px 4px 0 0 #121212',
        'hard-lg': '8px 8px 0 0 #121212',
        'hard-xl': '12px 12px 0 0 #121212',
      },
      keyframes: {
        load: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(350%)' },
        },
      },
      animation: {
        load: 'load 1.1s linear infinite',
      },
    },
  },
  plugins: [],
};
