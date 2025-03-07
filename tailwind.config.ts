import type { Config } from "tailwindcss";
import flowbite from "flowbite-react/tailwind";

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    flowbite.content(),
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {"50":"#eff6ff","100":"#dbeafe","200":"#bfdbfe","300":"#93c5fd","400":"#60a5fa","500":"#3b82f6","600":"#2563eb","700":"#1d4ed8","800":"#1e40af","900":"#1e3a8a","950":"#172554"},
        midnight: {
          DEFAULT: '#0A0F1E', // Deep Midnight Blue / Black
          dark: '#080C17',
          light: '#1C2233',
        },
        gold: {
          DEFAULT: '#C9A227', // Gold Accents
          dark: '#A7831F',
          light: '#E0B94D',
        },
        softWhite: {
          DEFAULT: '#FDFCF9', // Soft White Light
          dim: '#EAE6DA',
          glow: '#FFFFF0',
        },
        glowing: "#FFD700",
      },
      backgroundImage: {
        'gradient-midnight': 'linear-gradient(to bottom, #0A0F1E, #1C2233)',
        'gradient-gold': 'linear-gradient(to right, #C9A227, #E0B94D)',
      },
      boxShadow: {
        gold: '0 4px 20px rgba(201, 162, 39, 0.5)',
        softGlow: '0 4px 10px rgba(255, 255, 240, 0.3)',
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [flowbite.plugin()],
} satisfies Config;
