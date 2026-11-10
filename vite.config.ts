import {defineConfig} from 'vite';
export default defineConfig({root:'preview',base:'./',resolve:{preserveSymlinks:true,alias:{'@decky/ui':new URL('./preview/decky-stub.tsx',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')}},build:{outDir:'../demo',emptyOutDir:true}});
