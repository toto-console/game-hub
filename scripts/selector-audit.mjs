import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
const rows=[];const methods=new Set(['querySelector','querySelectorAll','closest','matches','contains','getElementsByClassName']);
function add(file,line,kind,expression){
 if(expression.length>1500)expression=expression.slice(0,1500)+' [see source]';
 const owned=/(?:\.gh[a-z-]*-|\.gcc-|\.gq-|\.gbs-|data-gh|data-library|data-detail)/.test(expression)&&!/(?:GamepadMode|BasicUI|gpfocus|DialogButton|profile_page|responsive_page)/.test(expression);
 const external=/store-theme\//.test(file)&&!owned;
 rows.push({file,line,kind,original:expression,feature:file.startsWith('store-theme/')?'Store/Community presentation':file.includes('/home/')?'Home/Library':file.split('/').pop(),ownership:owned?'Game Hub':external?'Steam web / semantic or unresolved':'Review native/dynamic',stable:'UNTESTED per-selector',beta:'UNTESTED',verifiedBetaReplacement:'None; awaiting tester evidence',domChange:'UNVERIFIED',risk:owned?'LOW':/fullscreen|entry|navigation|module/.test(file)?'HIGH':'MEDIUM',testCoverage:'See feature suite; inventory is not proof',repairStatus:owned?'No hash replacement required':'Review / evidence pending'});
}
function scan(dir){for(const ent of readdirSync(dir,{withFileTypes:true})){const file=dir+'/'+ent.name;if(ent.isDirectory()){scan(file);continue;}if(!/\.(?:css|scss|js|mjs|ts|tsx|jsx)$/.test(file))continue;const text=readFileSync(file,'utf8');if(/\.(css|scss)$/.test(file)){for(const m of text.matchAll(/(?:^|[{}])\s*([^{}]+)\{/g)){const value=m[1].trim();if(!value.startsWith('@')&&!/^\d+%|^from$|^to$/.test(value))add(file,text.slice(0,m.index).split('\n').length,'CSS rule',value);}continue;}
 const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.JS);
 const line=n=>ast.getLineAndCharacterOfPosition(n.getStart(ast)).line+1;
 function walk(n){if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&methods.has(n.expression.name.text)){if(n.expression.name.text!=='contains'||n.expression.expression.getText(ast).endsWith('classList'))add(file,line(n),'DOM '+n.expression.name.text,n.arguments[0]?.getText(ast)??'');}
 if(ts.isNewExpression(n)&&n.expression.getText(ast).includes('MutationObserver'))add(file,line(n),'MutationObserver',n.getText(ast));
 if(ts.isCallExpression(n)&&/findModule|resolveSteamUI|headerClasses|footerSelector/.test(n.expression.getText(ast)))add(file,line(n),'Resolver',n.getText(ast));
 if((ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)||ts.isTemplateExpression(n))&&n.getText(ast).includes('{')&&n.getText(ast).includes('}')){const v=n.getText(ast);for(const m of v.matchAll(/(?:^|[{}])\s*([^{};]+)\{/g)){if(/[.#\[]/.test(m[1])&&!m[1].includes('=>'))add(file,line(n),'Embedded CSS candidate',m[1]);}}
 ts.forEachChild(n,walk);
 }walk(ast);
}}
for(const folder of ['src','store-theme','integrations'])scan(folder);
mkdirSync('docs/steam-css-compat',{recursive:true});writeFileSync('docs/steam-css-compat/selector-inventory.json',JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify({entries:rows.length,files:new Set(rows.map(r=>r.file)).size,review:rows.filter(r=>r.ownership!=='Game Hub').length}));
