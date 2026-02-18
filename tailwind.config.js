/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/client/**/*.{js,ts,jsx,tsx}',
    './src/client/index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Shopify colors
        shopify: {
          green: '#008060',
          dark: '#202223',
          light: '#f6f6f7',
        },
        // Bsale colors
        bsale: {
          primary: '#4F46E5',
          secondary: '#7C3AED',
          accent: '#10B981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'modal': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
    },
  },
  plugins: [],
  important: '#app-root',
}