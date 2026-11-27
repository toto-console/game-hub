import {StoreAction} from './StoreAction';
import {catalogItems} from './store-account';
import {useEffect,useState} from 'react';
import {Focusable} from '@decky/ui';
import {boundedJSON} from '../store-content';

type News={gid:string;title:string;contents:string;date:number};
type Review={recommendationid:string;review:string;voted_up:boolean};
export function ProductCommunity({id}:{id:number}){
 const [news,setNews]=useState<News[]>([]),[reviews,setReviews]=useState<Review[]>([]),[summary,setSummary]=useState(''),[article,setArticle]=useState('');
 useEffect(()=>{
  let live=true;setArticle('');setNews([]);setReviews([]);setSummary('');
  void catalogItems([{appid:id}],true).then(([item])=>{const q=item?.reviews?.summary_filtered;if(live&&q?.review_count)setSummary(q.review_score_label+' · '+q.percent_positive+'% positive · '+q.review_count.toLocaleString()+' reviews')}).catch(()=>{});
  void boundedJSON('https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid='+id+'&count=4&feeds=steam_community_announcements').then(x=>{if(live)setNews(x?.appnews?.newsitems||[])}).catch(()=>{});
  void boundedJSON('https://store.steampowered.com/appreviews/'+id+'?json=1&filter=all&purchase_type=all&language=all&num_per_page=4').then(x=>{
   if(live&&x?.success===1){setReviews(x.reviews||[]);const q=x.query_summary;if(q?.total_reviews)setSummary(q.review_score_desc+' · '+q.total_reviews.toLocaleString()+' reviews');}
  }).catch(()=>{});
  return()=>{live=false};
 },[id]);
 return <>{news.length>0&&<section><h2>Official news</h2>{news.map(n=><StoreAction noFocusRing key={n.gid} className="cs-control cs-story" focusClassName="cs-focus" onActivate={()=>setArticle(article===n.gid?'':n.gid)}>{n.title}<small>{new Date(n.date*1000).toLocaleDateString()}</small>{article===n.gid&&<p>{new DOMParser().parseFromString(n.contents,'text/html').body.textContent}</p>}</StoreAction>)}</section>}
 {(summary||reviews.length>0)&&<section><h2>User reviews</h2><p>{summary}</p>{reviews.map(r=><StoreAction noFocusRing key={r.recommendationid} className="cs-control cs-story" focusClassName="cs-focus" onActivate={()=>setArticle(article===r.recommendationid?'':r.recommendationid)}>{r.voted_up?'Recommended':'Not recommended'}<p className={article===r.recommendationid?'':'cs-excerpt'}>{r.review}</p></StoreAction>)}</section>}</>;
}
