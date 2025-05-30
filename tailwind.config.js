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
          DEFAULT: '#3B82F6', // Azul principal da logo
          light: '#60A5FA',
          dark: '#1D4ED8',
        },
        success: {
          DEFAULT: '#4ADE80', // Verde da logo
          light: '#A7F3D0',
          dark: '#16A34A',
        },
        warning: {
          DEFAULT: '#F59E42', // Laranja da logo
          light: '#FDE68A',
          dark: '#EA580C',
        },
        danger: {
          DEFAULT: '#EF4444', // Vermelho da logo
          light: '#FCA5A5',
          dark: '#B91C1C',
        },
        background: '#F4F7FD', // Fundo da plataforma
        card: '#FFFFFF', // Cards e áreas principais
        accent: {
          DEFAULT: '#1976d2', // Azul escuro para detalhes
          light: '#64b5f6',
          dark: '#0d47a1',
        },
      },
    },
  },
  plugins: [],
};