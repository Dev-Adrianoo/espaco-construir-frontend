/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#6B99B0',
          light: '#8CBBCF',
          dark: '#5C829B',
        },
        secondary: {
          DEFAULT: '#88B586',
          light: '#A7CDB1',
          dark: '#739A72',
        },
        success: {
          DEFAULT: '#4B7F7A',
          light: '#7AA3A0',
          dark: '#3E6663',
        },
        warning: {
          DEFAULT: '#E29485',
          light: '#ECC2B9',
          dark: '#CC7C70',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FCA5A5',
          dark: '#B91C1C',
        },
        background: '#F4F4F4',
        card: '#F4F4F4',
        accent: {
          DEFAULT: '#6B99B0',
          light: '#8CBBCF',
          dark: '#5C829B',
        },
      },
    },
  },
  plugins: [],
};