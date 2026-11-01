import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' //removed swc
import { visualizer } from 'rollup-plugin-visualizer'

// `ANALYZE=1 npm run build` writes dist-stats.html (treemap) + dist-stats.json so the bundle can be audited.
const analyze = process.env.ANALYZE === '1'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), analyze && visualizer({ filename: 'dist-stats.html', template: 'treemap', gzipSize: true }), analyze && visualizer({ filename: 'dist-stats.json', template: 'raw-data', gzipSize: true })].filter(Boolean),
  server: {
    headers: {
      'Strict-Transport-Security': 'max-age=86400; includeSubDomains', // Adds HSTS options to your website, with a expiry time of 1 day
      'X-Content-Type-Options': 'nosniff', // Protects from improper scripts runnings
      'X-XSS-Protection': '1; mode=block' // Gives XSS protection to legacy browsers
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
