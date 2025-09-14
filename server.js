const WebSocket = require('ws');
const wss = new WebSocket.Server({port:8080});
const players = {};


function broadcast(type, payload){
const msg = JSON.stringify({type,payload});
for(const c of wss.clients) if(c.readyState===1) c.send(msg);
}


wss.on('connection', (ws)=>{
ws.id = Math.random().toString(36).slice(2,9);
players[ws.id] = {id: ws.id, x: Math.random()*1600, y: Math.random()*900, rot:0, health:100, name: 'Player'+ws.id, kills:0, deaths:0};
console.log('connect', ws.id);


ws.on('message', msg=>{
try{ const m = JSON.parse(msg);
if(m.type === 'update'){
players[m.payload.id] = Object.assign(players[m.payload.id]||{}, m.payload);
// broadcast world state
broadcast('state', {players: Object.values(players)});
} else if(m.type === 'shoot'){
// naive hit: loop players and if close to bullet line, reduce health and broadcast hit
const b = m.payload;
for(const pid in players){ if(pid===b.owner) continue;
const p = players[pid];
const dx = p.x - b.x, dy = p.y - b.y;
const dist = Math.hypot(dx,dy);
// naive instant hit if within radius
if(dist < 30){ p.health -= (b.weapon==='ar'?8:18); if(p.health<=0){ players[b.owner].kills = (players[b.owner].kills||0)+1; p.deaths = (p.deaths||0)+1; p.health = 100; }
broadcast('hit', {targetId: pid, damage: (b.weapon==='ar'?8:18), by: b.owner, killed: p.health<=0});
}
}
}
}catch(e){ console.warn('bad msg',e); }
});


ws.on('close', ()=>{ delete players[ws.id]; broadcast('state',{players: Object.values(players)}); });
});
