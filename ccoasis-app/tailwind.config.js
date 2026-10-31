/** @type {import('tailwindcss').Config} */
const oasisCyan = {
  50: '#eefcfc',
  100: '#d9f7f8',
  200: '#aaeef0',
  300: '#6ddfe3',
  400: '#23d5da', // Cian del logo (cabecera con texto oscuro #1a1a1a)
  500: '#0f9aa2', // Inicio degradado títulos grandes y anillos de foco (3.41:1 sobre blanco)
  600: '#0e7c86', // Primario accesible con texto blanco (4.95:1) y texto sobre blanco (4.95:1)
  700: '#0a5961', // Hover primario / texto sobre 100 (7.96:1 sobre blanco, 7.12:1 sobre #d9f7f8)
  800: '#08474e',
  900: '#06373c',
  950: '#042428',
}

const oasisMagenta = {
  50: '#fdf5f9',
  100: '#f6e6ef',
  200: '#ebcce0',
  300: '#daa3c5',
  400: '#c473a4',
  500: '#ae4a84', // Magenta del logo (5.11:1 con blanco, 5.11:1 sobre blanco)
  600: '#ae4a84', // Barra magenta / acción secundaria (5.11:1 con blanco)
  700: '#8f3b6b', // Hover magenta / texto sobre gris (6.99:1 con blanco)
  800: '#7a2f5a', // Texto sobre #f6e6ef (7.34:1)
  900: '#5e2345',
  950: '#3d152c',
}

const oasisNeutral = {
  50: '#f5f5f5',  // Fondo principal de página (--bg)
  100: '#ebedef', // Superficie secundaria (--surface-muted)
  200: '#d4d7dc', // Divisores y bordes decorativos (--border)
  300: '#858a93', // Bordes de controles >= 3:1 (3.47:1 sobre blanco)
  400: '#5b6068', // Iconos / placeholders accesibles (6.33:1 sobre blanco)
  500: '#4a4f57', // Texto secundario (--text-muted, 8.24:1 sobre blanco)
  600: '#3b3f46',
  700: '#2c3036',
  800: '#22252a',
  900: '#1a1a1a', // Texto principal (--text, 17.40:1 sobre blanco)
  950: '#111316',
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: oasisCyan,
        blue: oasisCyan,
        magenta: oasisMagenta,
        indigo: oasisMagenta,
        slate: oasisNeutral,
        'app-bg': 'var(--bg)',
        surface: 'var(--surface)',
        'surface-muted': 'var(--surface-muted)',
        ink: 'var(--text)',
        'ink-muted': 'var(--text-muted)',
        line: 'var(--border)',
        control: 'var(--border-control)',
        'brand-cyan': 'var(--brand-cyan)',
        'brand-magenta': 'var(--brand-magenta)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          soft: 'var(--primary-soft)',
          ink: 'var(--primary-ink)',
        },
        link: {
          DEFAULT: 'var(--brand-magenta)',
          gray: 'var(--link-on-gray)',
        },
        focus: {
          DEFAULT: 'var(--focus)',
          cyan: 'var(--focus-on-cyan)',
          magenta: 'var(--focus-on-magenta)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          soft: 'var(--danger-soft)',
        },
        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--success-soft)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          soft: 'var(--warning-soft)',
        },
      },
    },
  },
  plugins: [],
}
