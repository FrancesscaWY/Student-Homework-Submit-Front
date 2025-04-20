import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
    plugins: [vue(), vuetify({ autoImport: true })],
    server:{
        port: 3000,
        proxy:{
            '/api':{
                target: 'http://localhost:3001',
                changeOrigin: true,
                rewrite: (path)=> path.replace(/^\/api/,'')
            }
        },
        host:true
    }
})
