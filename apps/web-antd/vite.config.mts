import { defineConfig } from '@vben/vite-config';
import path from 'path';
import { fileURLToPath } from 'url';
interface AppViteConfig {
  application: {
    title: string;
  };
  vite?: import('vite').UserConfig;
}
export default defineConfig(async (): Promise<AppViteConfig>=> {
  return {
    application: {
      title: 'AIDOC',
    },
    vite: {
      server: {
        host: '0.0.0.0',  // 允许外部访问
        port: 5667,       // 明确指定端口
        proxy: {
          // FLD API代理到FLD服务
          '/api/fld': {
            changeOrigin: true,
            target: 'http://localhost:8001',  // FLD服务地址
            ws: true,
          },
          // P2P API代理到P2P服务
          '/api/p2p-bandwidth': {
            changeOrigin: true,
            target: 'http://localhost:8002',  // P2P服务地址
            ws: true,
          },
          // 其他API代理到主后端服务
          '/api/v1': {
            changeOrigin: true,
            target: 'http://127.0.0.1:3000',// 主后端服务地址
            // rewrite: (path) => path.replace(/^\/api\/api/, ''),
            //target: 'http://localhost:5320/api',  // 主后端服务地址
            ws: true,
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src'),
        },
      }
    },
  };
});
