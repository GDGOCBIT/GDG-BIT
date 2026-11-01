/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Google Sans', 'Open Sans', 'system-ui', 'sans-serif'],
        mono: ['Google Sans Code', 'Roboto Mono', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
}
