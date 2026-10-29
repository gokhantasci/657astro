import { defineConfig } from 'astro/config';
import {archiveSalaryBuild} from './scripts/archive-unvan-build.mjs';
export default defineConfig({
 site: 'https://657.com.tr',
 output: 'static',
 trailingSlash: 'always',
 build: { format: 'directory', inlineStylesheets: 'auto' },
 devToolbar: { enabled: false },
 integrations: [{name:'657-maas-arsivi',hooks:{'astro:build:done':async({dir})=>archiveSalaryBuild(dir)}}],
});
