type Service=Record<string,(transport:unknown,request:object)=>Promise<any>>;
const scopes=new Map<string,Service>();
function find(key:string, match:(value:any)=>boolean):any{
 if(scopes.has(key))return scopes.get(key);
 const scope=(window as any).DFL?.findModuleScopeByVar(match);
 const value=scope&&Object.values(scope).find(match);
 if(!value)throw Error('Steam '+key+' service unavailable');
 scopes.set(key,value as Service);return value;
}
export function region(){return find('locale',v=>v?.COUNTRY&&v?.LANGUAGE&&v?.STORE_BASE_URL)}
async function call(group:string,method:string,request:object){
 const pair=group==='Query'?['MoreLikeThis','Query']:group==='Discovery'?['GetDiscoveryQueue','GetRecommendedTagsForUser']:group==='Wishlist'?['GetWishlist','AddToWishlist']:group==='Cart'?['GetCart','AddItemsToCart']:['GetItems','GetStoreCategories'];
 const service=find(group,v=>pair.every(k=>typeof v?.[k]==='function'));
 const transport=(window as any).searchstore.m_cm.GetServiceTransport();
 const response=await service[method](transport,request);
 if(response.GetEResult()!==1)throw Error('Steam declined '+method+' ('+response.GetEResult()+')');
 return response.Body().toObject();
}
export async function wishlistIds():Promise<number[]>{
 const steamid=(window as any).App.m_CurrentUser.strSteamID;
 const r=await call('Wishlist','GetWishlist',{steamid});
 return (r.items||[]).map((x:any)=>x.appid);
}
export async function setWish(appid:number,wanted:boolean){
 await call('Wishlist',wanted?'AddToWishlist':'RemoveFromWishlist',{appid});
 const ids=await wishlistIds();
 if(ids.includes(appid)!==wanted)throw Error('Steam wishlist has not synchronized');
}
export const readCart=async()=>(await call('Cart','GetCart',{user_country:region().COUNTRY})).cart.line_items||[];
export const addPackage=(packageid:number)=>call('Cart','AddItemsToCart',{items:[{packageid}],user_country:region().COUNTRY});
export const removeLine=(line_item_id:string)=>call('Cart','RemoveItemFromCart',{line_item_id,user_country:region().COUNTRY});
export async function catalogItems(ids:object[],reviews=false,basicInfo=false){
 const locale=region(),rows:any[]=[];
 for(let start=0;start<ids.length;start+=50){
  const r=await call('Catalog','GetItems',{ids:ids.slice(start,start+50),context:{country_code:locale.COUNTRY,language:locale.LANGUAGE},data_request:{include_assets:true,include_release:true,include_all_purchase_options:true,include_reviews:reviews,include_basic_info:basicInfo}});
  rows.push(...(r.store_items||[]));
 }
 return rows;
}

export async function discoveryItems(){
 const queue=await call('Discovery','GetDiscoveryQueue',{queue_type:0,country_code:region().COUNTRY,rebuild_queue_if_stale:false});
 return catalogItems((queue.appids||[]).map((appid:number)=>({appid})));
}
export function catalogCapsule(item:any){
 const assets=item.assets,file=assets?.header||assets?.main_capsule;
 if(!file||!assets.asset_url_format?.startsWith('steam/'))return;
 return 'https://shared.steamstatic.com/store_item_assets/'+assets.asset_url_format.replace('${FILENAME}',file);
}

export async function similarGames(appid:number){
 const locale=region();
 const result=await call('Query','MoreLikeThis',{query_name:'Game Hub similar games',item_id:{appid},count:16,context:{country_code:locale.COUNTRY,language:locale.LANGUAGE},data_request:{include_assets:true}});
 return (result.store_items||[]).filter((p:any)=>p.visible&&p.item_type===0&&p.id!==appid);
}

export async function freeShelf(label:string,tags:number[],filters:object={}){
 const locale=region();
 const result=await call('Query','Query',{query_name:label,context:{country_code:locale.COUNTRY,language:locale.LANGUAGE},
  query:{count:12,filters:{type_filters:{include_games:true},price_filters:{only_free_items:true},tagids_must_match:[113,...tags].map(id=>({tagids:[id]})),...filters}},
  data_request:{include_assets:true,include_release:true,apply_user_filters:true}});
 return (result.store_items||[]).filter((p:any)=>p.visible&&p.is_free&&p.type===0);
}
