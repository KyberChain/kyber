// Kyber Chain videos (frame-exact): hype, ring, quantum.  node _studio/videos.cjs [hype|ring|quantum]
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'), { open, sleep } = require('./cdp.cjs');
const B = path.join(__dirname, '..', 'brand'), K = path.join(__dirname, 'kit'), FPS = 30, url = (f) => 'file:///' + f.split(path.sep).join('/');
const MARK = (s) => `<svg width="${32 * s}" height="${32 * s}" viewBox="0 0 32 32" fill="none" style="filter:drop-shadow(0 0 ${6 * s}px rgba(92,225,255,.55))"><rect x="1" y="1" width="30" height="30" rx="3" stroke="#5ce1ff" stroke-width="1.6"/><path d="M10 8v16M10 16l9-8M10 16l9 8" stroke="#5ce1ff" stroke-width="2.4" stroke-linecap="square"/><circle cx="23" cy="16" r="1.8" fill="#5ce1ff"/></svg>`;
const HEAD = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet"><style>
*{margin:0;padding:0;box-sizing:border-box}body{width:1920px;height:1080px;background:#04070a;color:#d3edf5;overflow:hidden;position:relative;font:400 34px 'JetBrains Mono',monospace}
.s{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;opacity:0}.h{font-weight:800;letter-spacing:-.035em;line-height:1.04}
.ac{color:#5ce1ff}.dim{color:#5f7d8a}.q{color:#c6a8ff}.eb{font-size:28px;color:#5f7d8a}.cur{display:inline-block;width:.55em;height:.95em;background:#5ce1ff;vertical-align:-.1em;margin-left:8px;box-shadow:0 0 20px #5ce1ff}
.row{display:grid;grid-template-columns:300px 760px;gap:30px;text-align:left;font-size:40px;padding:16px 0;border-bottom:1px solid #14232d}#cv{position:absolute;inset:0}</style></head><body><canvas id="cv" width="1920" height="1080"></canvas>`;
const JS = `const $=(i)=>document.getElementById(i),cl=(x)=>Math.max(0,Math.min(1,x)),e=(x)=>1-Math.pow(1-cl(x),3),win=(t,a,b,f=.4)=>cl(Math.min((t-a)/f,(b-t)/f));
const show=(id,t,a,b,f)=>{const o=win(t,a,b,f);$(id).style.opacity=o;$(id).style.filter='blur('+((1-o)*8).toFixed(1)+'px)';};
const HX='0123456789abcdef',hr=(n,s)=>{let x=s,o='';for(let i=0;i<n;i++){x=(x*16807)%2147483647;o+=HX[x%16]}return o};
function rain(t,amt){const g=$('cv').getContext('2d');g.clearRect(0,0,1920,1080);if(amt<=0)return;g.font='20px JetBrains Mono, monospace';for(let i=0;i<88;i++){const sp=120+((i*977)%160),y=((t*sp+i*331)%1400)-160;for(let k=0;k<7;k++){const yy=y-k*24;g.globalAlpha=amt*(k?0.22*(1-k/7):0.55);g.fillStyle=k?'#5ce1ff':'#b4f2ff';g.fillText(HX[(i*7+k*3+Math.floor(t*12))%16],i*22,yy);}}g.globalAlpha=1;}`;
const END = (h) => `<div class="s" id="z">${MARK(6)}<div class="h" style="font-size:120px;margin-top:44px">${h}</div><div class="dim" style="font-size:32px;margin-top:40px">Kyber Chain · $KYBER · @KyberChainL1</div></div>`;
const ENDJS = (a) => `$('z').style.opacity=cl((t-${a})/.5);$('z').style.filter='blur('+((1-cl((t-${a})/.5))*8).toFixed(1)+'px)';`;
async function render(c, name, html, dur) { const FR = path.join(__dirname, 'frames-' + name); fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true }); fs.mkdirSync(K, { recursive: true });
  const f = path.join(K, name + '.html'); fs.writeFileSync(f, html);
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false }); await c.send('Page.navigate', { url: url(f) }); await sleep(3000); await c.ev('document.fonts.ready.then(()=>1)');
  const N = Math.round(dur * FPS); for (let i = 0; i < N; i++) { await c.ev('__seek(' + (i / FPS).toFixed(4) + ')'); await c.shot(path.join(FR, 'f_' + String(i).padStart(4, '0') + '.jpg'), 'jpeg'); }
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(FR, 'f_%04d.jpg'), '-vf', 'format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', path.join(B, name + '.mp4')]);
  fs.rmSync(FR, { recursive: true, force: true }); console.log('OK', name + '.mp4'); }

// 1. hype: a public ledger → every field scrambles to hidden → tagline
async function hype(c) {
  const F = [['sender', '0x7a3f…your wallet'], ['receiver', '0x91be…their wallet'], ['amount', '1,250.00'], ['history', 'forever, for anyone']];
  const H = [['sender', 'ring of 16'], ['receiver', 'one-time stealth address'], ['amount', 'Pedersen commitment'], ['quantum', 'ML-KEM-768']];
  const html = HEAD + `<div class="s" id="a"><div class="eb">every public chain</div><div class="h" style="font-size:130px;margin-top:26px">Your money is<br><span class="ac">a public diary.</span></div></div>
  <div class="s" id="b"><div>${F.map(([k], i) => `<div class="row"><span class="dim">${k}</span><span id="v${i}"></span></div>`).join('')}</div><div id="bl" class="ac" style="margin-top:50px;font-size:36px;opacity:0">on Kyber Chain</div></div>
  <div class="s" id="c">${MARK(5)}<div class="h" style="font-size:170px;margin-top:40px">Kyber Chain</div><div class="dim" style="font-size:34px;margin-top:20px">the private proof-of-work chain</div></div>
  ${END('Private today.<br>Private after <span class="ac">quantum.</span><span class="cur"></span>')}
  <script>${JS}const F=${JSON.stringify(F)},H=${JSON.stringify(H)};
  window.__seek=(t)=>{rain(t,t<2.8?.9:t<12?.35:.25);show('a',t,0,2.8);show('b',t,2.8,9.2);$('bl').style.opacity=cl((t-5.2)/.4);
  for(let i=0;i<4;i++){const s=5.2+i*.55,el=$('v'+i),p=cl((t-s)/.8);if(t<s){el.textContent=F[i][1];el.style.color='#d3edf5';}else if(p<1){el.textContent=hr(Math.max(6,F[i][1].length-2),Math.floor(t*60)+i*7);el.style.color='#3a5361';}else{el.textContent=H[i][1];el.style.color=i===3?'#c6a8ff':'#5ce1ff';}
    $('v'+i).previousElementSibling.textContent=t>s+.8?H[i][0]:F[i][0];}
  show('c',t,9.2,12.4);$('c').style.transform='scale('+(1.05-.05*e((t-9.2)/1))+')';${ENDJS(12.4)}};</script></body></html>`;
  await render(c, 'kyber-hype-16s', html, 16); }

// 2. ring: 16 outputs, one real, signature closes, key image, double spend rejected
async function ring(c) {
  const html = HEAD + `<div class="s" id="a"><div class="eb"># ring signatures</div><div class="h" style="font-size:120px;margin-top:24px">You spend one coin.<br><span class="ac">You sign with sixteen.</span></div></div>
  <div class="s" id="b" style="flex-direction:row;gap:120px"><div style="position:relative;width:640px;height:640px">${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2 - Math.PI / 2; return `<div id="n${i}" style="position:absolute;left:${320 + Math.cos(a) * 270 - 26}px;top:${320 + Math.sin(a) * 270 - 26}px;width:52px;height:52px;border-radius:50%;border:2px solid #1d3340;background:#081017;opacity:0"></div>`; }).join('')}
    <svg id="arc" width="640" height="640" style="position:absolute;inset:0"><circle cx="320" cy="320" r="270" fill="none" stroke="#5ce1ff" stroke-width="3" stroke-dasharray="1697" stroke-dashoffset="1697"/></svg><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><div class="h ac" style="font-size:150px" id="cnt">0</div><div class="dim">ring members</div></div></div>
    <div style="text-align:left;width:640px"><div id="l1" style="opacity:0;font-size:40px">15 decoys from the chain</div><div id="l2" style="opacity:0;font-size:40px;margin-top:22px">+ 1 real spend</div><div id="l3" style="opacity:0;font-size:40px;margin-top:22px" class="ac">MLSAG signature: valid</div><div id="l4" style="opacity:0;font-size:26px;margin-top:40px" class="dim">key image<br><span style="color:#d3edf5">${'306df2870f661902102084c1'}…</span></div><div id="l5" style="opacity:0;font-size:40px;margin-top:40px;color:#ff6b8b">spend it again → rejected</div></div></div>
  ${END('Nobody knows<br>which one was <span class="ac">yours.</span>')}
  <script>${JS}window.__seek=(t)=>{rain(t,.22);show('a',t,0,3);show('b',t,3,12.6);
  for(let i=0;i<16;i++){const n=$('n'+i);n.style.opacity=cl((t-3.4-i*.12)/.25);const real=i===11&&t>6&&t<7.6;n.style.background=real?'#5ce1ff':'#081017';n.style.borderColor=real||t>7.6?'#5ce1ff':'#1d3340';n.style.boxShadow=real?'0 0 26px #5ce1ff':'none';}
  $('cnt').textContent=Math.min(16,Math.max(0,Math.floor((t-3.4)/.12)+1));$('arc').firstElementChild.style.strokeDashoffset=1697*(1-e((t-7.6)/1.4));
  ['l1','l2','l3','l4','l5'].forEach((k,i)=>$(k).style.opacity=cl((t-[5,6,8.6,9.6,10.8][i])/.4));${ENDJS(12.6)}};</script></body></html>`;
  await render(c, 'kyber-ring-16s', html, 16); }

// 3. quantum: pay a kybq1 address → ML-KEM ciphertext → only the receiver opens it → Faraday
async function quantum(c) {
  const html = HEAD + `<div class="s" id="a"><div class="eb">the threat</div><div class="h" style="font-size:118px;margin-top:24px">Quantum computers<br>break <span class="ac">elliptic curves.</span></div></div>
  <div class="s" id="b"><div class="eb">pay a <span class="q">kybq1</span> address</div><div class="h" style="font-size:72px;margin:20px 0 40px">ML-KEM-768 encapsulation</div>
    <div id="ct" class="mono" style="width:1500px;height:330px;overflow:hidden;font-size:24px;line-height:1.5;word-break:break-all;text-align:left;color:#c6a8ff;opacity:.85"></div><div id="bl" style="margin-top:34px;opacity:0;font-size:38px">1,088 bytes. <span class="ac">Only the receiver can open it.</span></div></div>
  <div class="s" id="c"><div class="eb"># faraday</div><div style="margin-top:30px">${[['payment detection', 'ML-KEM-768', 'live'], ['spend proofs', 'hash-based', 'next'], ['anonymity set', 'the full chain', 'next']].map(([a, b, s], i) => `<div class="row" id="r${i}" style="opacity:0;grid-template-columns:420px 520px 160px"><span class="dim">${a}</span><span>${b}</span><span class="${s === 'live' ? 'ac' : 'dim'}">${s}</span></div>`).join('')}</div></div>
  ${END('Built to outlive<br><span class="ac">elliptic curves.</span>')}
  <script>${JS}window.__seek=(t)=>{rain(t,.22);show('a',t,0,3.2);show('b',t,3.2,9.4);
  const n=Math.floor(cl((t-3.8)/3.2)*2176);$('ct').textContent=hr(n,987654321);$('bl').style.opacity=cl((t-7.2)/.4);
  show('c',t,9.4,12.8);for(let i=0;i<3;i++)$('r'+i).style.opacity=cl((t-9.8-i*.5)/.35);${ENDJS(12.8)}};</script></body></html>`;
  await render(c, 'kyber-quantum-16s', html, 16); }

(async () => { const only = process.argv[2]; const c = await open('about:blank', 1920, 1080, 9700 + Math.floor(Math.random() * 90));
  if (!only || only === 'hype') await hype(c); if (!only || only === 'ring') await ring(c); if (!only || only === 'quantum') await quantum(c); c.close(); process.exit(0); })();
