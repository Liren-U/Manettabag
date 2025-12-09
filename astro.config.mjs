// astro.config.mjs

// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare'; // 导入 Cloudflare 适配器

// https://astro.build/config
export default defineConfig({
  // 🚀 关键：设置输出模式为 'server' (SSR)
  output: 'server',

  // 🚀 关键：应用 Cloudflare 适配器，不添加任何额外的配置对象
  adapter: cloudflare(),

});