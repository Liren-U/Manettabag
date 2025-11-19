// astro.config.mjs

// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare'; // 导入 Cloudflare 适配器

// https://astro.build/config
export default defineConfig({
  // 关键：设置输出模式为 'server'
  output: 'server',

  // 关键：应用 Cloudflare 适配器，并明确指定 Functions 目录
  adapter: cloudflare({
    directory: 'functions', // 明确告诉适配器，Function 代码在这里
    // functionPerRoute: true, // 保持此选项默认或不写，因为它不是必需的
  }),
});