import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // এখানে নির্দিষ্ট আইপি দিলে সে আর ইন্টারফেস স্ক্যান করবে না
    port: 5173,
    strictPort: true,
  },
})

