import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config({ignores:['node_modules/**','dist/**','demo/**','screenshots/**']},js.configs.recommended,...ts.configs.recommended,{files:['**/*.{ts,tsx,js,mjs}'],languageOptions:{globals:{window:'readonly',document:'readonly',console:'readonly',setInterval:'readonly',clearInterval:'readonly',URL:'readonly',Storage:'readonly',alert:'readonly',process:'readonly',getComputedStyle:'readonly',innerWidth:'readonly'}},rules:{'@typescript-eslint/no-non-null-assertion':'off'}});
