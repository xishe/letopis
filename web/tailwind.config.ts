import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FBFBFC',
        sidebar: '#F4F4F6',
        surface: '#FFFFFF',
        border: '#E6E6EA',
        'border-soft': '#EEEEF1',
        ink: '#1B1C1F',
        'ink-2': '#6B6C72',
        'ink-3': '#8A8B91',
        accent: { DEFAULT: '#5E5CE6', hover: '#4F4DD6', soft: '#EFEFFD' },
        ok: { DEFAULT: '#2F9E6B', bg: '#E9F6EF' },
        warn: { DEFAULT: '#B2681C', bg: '#FDF1E6' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['12px', '16px'],
        base: ['13px', '20px'],
        md: ['15px', '22px'],
        lg: ['18px', '26px'],
        xl: ['22px', '30px'],
        '2xl': ['32px', '38px'],
        '3xl': ['44px', '48px'],
      },
      borderRadius: { DEFAULT: '6px', md: '6px', lg: '8px', xl: '12px' },
      boxShadow: {
        pop: '0 8px 24px -4px rgba(27,28,31,0.12), 0 2px 6px -1px rgba(27,28,31,0.06)',
        panel: '-12px 0 32px -8px rgba(27,28,31,0.10)',
      },
      keyframes: {
        spin: { to: { transform: 'rotate(360deg)' } },
      },
    },
  },
  plugins: [],
} satisfies Config;
