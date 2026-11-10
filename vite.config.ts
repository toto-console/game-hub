import {defineConfig} from 'vite';
export default defineConfig({root:'preview',base:'./',resolve:{preserveSymlinks:true},build:{outDir:'../demo',emptyOutDir:true}});
