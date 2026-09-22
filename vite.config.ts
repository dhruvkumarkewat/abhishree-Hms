import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function vercelApiPlugin() {
  return {
    name: 'vercel-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        
        try {
          const [urlPath, search] = req.url.split('?')
          const apiFilePath = path.join(__dirname, urlPath + '.js')
          
          if (!fs.existsSync(apiFilePath)) return next()

          // Polyfill req.query
          req.query = Object.fromEntries(new URLSearchParams(search || ''))
          
          // Polyfill res.status and res.json
          res.status = (code: number) => {
            res.statusCode = code
            return res
          }
          // @ts-ignore
          res.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          }

          // Read body
          if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
            const buffers = []
            for await (const chunk of req) buffers.push(chunk)
            const bodyStr = Buffer.concat(buffers).toString()
            if (bodyStr) {
              try { 
                // @ts-ignore
                req.body = JSON.parse(bodyStr) 
              } catch { 
                // @ts-ignore
                req.body = bodyStr 
              }
            }
          }

          // Load the module
          const mod = await server.ssrLoadModule(apiFilePath)
          if (mod.default) {
            await mod.default(req, res)
          } else {
            res.statusCode = 500
            res.end('No default export found in ' + urlPath)
          }
        } catch (err) {
          console.error('API Error:', err)
          res.statusCode = 500
          res.end(String(err))
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react(), tailwindcss(), vercelApiPlugin()];
  try {
    // @ts-ignore
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {}

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_', 'SUPABASE_']);
  Object.assign(process.env, env);
  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
  };
})
