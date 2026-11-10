import type { Friend } from '../src/model';
export const friends:Friend[]=[
  {id:'76561198000000001',name:'Nova',state:'playing',game:'Exploring the stars'},
  {id:'76561198000000002',name:'PixelFox',state:'playing',game:'One more race'},
  {id:'76561198000000003',name:'ArcadeKid',state:'online'},
  {id:'76561198000000004',name:'Skye',state:'away'},
  {id:'76561198000000005',name:'Echo',state:'offline'},
];
export const preview={members:friends.slice(0,4),messages:[{author:'Nova',text:'Same crew tonight?',time:'20:41'},{author:'You',text:'Absolutely. One more adventure.',time:'20:42',self:true},{author:'Nova',text:'See you in the party.',time:'20:42'}]};
