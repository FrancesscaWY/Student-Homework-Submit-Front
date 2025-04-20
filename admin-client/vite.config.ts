import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
    plugins:[vue(),vuetify({ autoImport: true })],
    server:{
        port:5174,
        proxy:{
            '/api':{
                target: 'http://localhost:3001', // 后端服务器地址
                changeOrigin:true,
                rewrite:(path)=>path.replace(/^\/api/,''),
            },
        },
        host:true
    },
    resolve:{
        alias:{
            '@':'/src', // 定义路径别名，方便引用组件或工具
        },
    },
    build:{
        outDir:'dist', // 指定打包输出目录
        sourcemap:true
    }
})