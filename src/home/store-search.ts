import {boundedJSON} from '../store-content';
import {catalogItems,region} from './store-account';

export const pageSize=25;
export async function searchPage(criteria:Record<string,string>,start:number){
 const locale=region();
 const params=new URLSearchParams({...criteria,infinite:'1',cc:locale.COUNTRY,l:locale.LANGUAGE,count:String(pageSize),start:String(start)});
 const page=await boundedJSON('https://store.steampowered.com/search/results/?'+params);
 if(!page.success||typeof page.results_html!=='string')throw Error('Steam search is unavailable');
 const doc=new DOMParser().parseFromString(page.results_html,'text/html');
 const links=Array.from(doc.querySelectorAll('a.search_result_row'));
 const ids=links.map(a=>Number(a.getAttribute('data-ds-appid'))).filter(id=>Number.isSafeInteger(id)&&id>0);
 const products=(await catalogItems(ids.map(appid=>({appid})))).filter(p=>p.visible&&p.success===1);
 return {products,more:links.length>0&&start+pageSize<Number(page.total_count)};
}
