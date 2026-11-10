export function parseAccountId(value) {
 const s=value.trim(); let id;
 const url=s.match(/^https?:\/\/steamcommunity\.com\/profiles\/(\d+)\/?$/i);
 const steam=s.match(/^STEAM_[0-5]:([01]):(\d+)$/i);
 if(url) id=BigInt(url[1])-76561197960265728n;
 else if(steam) id=BigInt(steam[2])*2n+BigInt(steam[1]);
 else if(/^\d+$/.test(s)) {id=BigInt(s);if(id>4294967295n) id-=76561197960265728n;}
 else throw new Error('Введите числовой ID Dota 2, SteamID64 или ссылку steamcommunity.com/profiles/…');
 if(id<=0n||id>4294967295n) throw new Error('Проверьте ID: такого номера аккаунта быть не может.');
 return String(id);
}
export const isWin=m=>(m.player_slot<128)===m.radiant_win;
export function summarize(matches) {
 const n=matches.length; const sum=k=>matches.reduce((a,m)=>a+(m[k]??0),0);
 return {count:n,wins:matches.filter(isWin).length,winrate:n?Math.round(matches.filter(isWin).length/n*100):0,kda:n?((sum('kills')+sum('assists'))/Math.max(1,sum('deaths'))).toFixed(2):'—',gpm:n?Math.round(sum('gold_per_min')/n):'—',xpm:n?Math.round(sum('xp_per_min')/n):'—'};
}
export function readSaved(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
export function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
