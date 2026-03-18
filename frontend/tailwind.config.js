/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#ffe4e6',
          500: '#e53e3e',
          600: '#c53030',
          700: '#9b2c2c',
        },
        gold: {
          400: '#f6ad55',
          500: '#ed8936',
          600: '#dd6b20',
        }
      },
    },
  },
  plugins: [],
};
