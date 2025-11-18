// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare'; // 导入 Cloudflare 适配器

// https://astro.build/config
export default defineConfig({
  // 🚀 关键：设置输出模式为 'server' (SSR)，这对于 Cloudflare Pages 上的 Worker 集成是最佳实践。
  output: 'server',
  // 🚀 关键：应用 Cloudflare 适配器
  adapter: cloudflare(),
});