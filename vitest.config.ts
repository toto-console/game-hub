import {defineConfig} from 'vitest/config';
export default defineConfig({resolve:{preserveSymlinks:true},test:{pool:'threads',maxWorkers:1,environment:'jsdom',include:['tests/**/*.test.ts','tests/**/*.test.tsx'],clearMocks:true}});
