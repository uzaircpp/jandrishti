import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// `npm run dev` forwards /api to the FastAPI serving layer on :8000 once it is running.
// Until then every screen runs on the bundled sample dataset in src/data.
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: { port: 5174, proxy: { '/api': 'http://localhost:8000' } },
})
