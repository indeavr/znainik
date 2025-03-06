module.exports = {
  content: [
    // ... other content configurations
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}'
  ],
  plugins: [
    require('flowbite/plugin')
  ],
  theme: {
    extend: {
      // ... your existing extensions
      keyframes: {
        flow: {
          '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
          '50%': { transform: 'translateX(50%) translateY(5%)' },
        }
      },
      animation: {
        'flow': 'flow 15s ease-in-out infinite',
      }
    },
  },
  // ... rest of your config
}