// shared pill nav, footer, CA bar, toasts, formatting
export const X_URL = 'https://x.com/KyberChainL1', GH_URL = 'https://github.com/KyberChain/kyber';
export const $ = (id) => document.getElementById(id), api = (p, d) => fetch(p, d ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) } : undefined).then((r) => r.json());
export const kyb = (v) => (Number(v) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 6 });
export const short = (h, n = 8) => (h ? h.slice(0, n) + '…' + h.slice(-6) : '');
export const ago = (ts) => { const s = Math.max(0, (Date.now() - ts) / 1000); return s < 60 ? Math.floor(s) + 's ago' : s < 3600 ? Math.floor(s / 60) + 'm ago' : Math.floor(s / 3600) + 'h ago'; };
export function toast(m, err) { const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 3600); }
export const copy = (v, what) => navigator.clipboard.writeText(v).then(() => toast((what || 'copied') + ' copied'));
// the K mark, drawn as a stipple of squares so it matches the dot-field hero
export const MARK = (s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="#ff3131" aria-hidden="true">${[[5, 3], [5, 6], [5, 9], [5, 12], [5, 15], [5, 18], [5, 21], [8, 12], [11, 9], [14, 6], [17, 3], [11, 15], [14, 18], [17, 21]].map(([x, y]) => `<rect x="${x - 1.2}" y="${y - 1.2}" width="2.4" height="2.4"/>`).join('')}<rect x="19" y="10.5" width="3" height="3" fill="#ffffff"/></svg>`;
export const LANDING = [['/#top', 'home'], ['/#threat', 'threat'], ['/#design', 'design'], ['/#payments', 'payments'], ['/#compare', 'compare'], ['/#roadmap', 'roadmap']];
export const APP = [['/', 'home'], ['/explorer', 'explorer'], ['/wallet', 'wallet'], ['/docs', 'docs']];
export function chrome(links = APP, cta = ['/wallet', 'open wallet ↗']) {
  const h = document.createElement('header'); h.className = 'nav';
  h.innerHTML = `<a class="logo" href="/">${MARK()}<span>KYBER</span><small>CHAIN</small></a><nav>${links.map(([u, t]) => `<a href="${u}" data-k="${t}" class="${location.pathname === u ? 'on' : ''}">${t}</a>`).join('')}</nav><a class="pbtn" href="${cta[0]}">${cta[1]}</a><button class="pbtn burger" aria-label="menu">menu</button>`;
  document.body.prepend(h); h.querySelector('.burger').onclick = () => h.classList.toggle('open'); h.querySelectorAll('nav a').forEach((a) => (a.onclick = () => h.classList.remove('open')));
  const f = document.createElement('footer'); f.className = 'foot';
  f.innerHTML = `<div class="wrap"><a class="logo" href="/">${MARK()}<span>KYBER</span><small>CHAIN</small></a><p>Kyber Chain is a private proof-of-work chain running as a public testnet. tKYBER has no value; $KYBER is the Solana token that carries the project to mainnet. · <a href="${GH_URL}" target="_blank" rel="noopener">GitHub</a> · <a href="${X_URL}" target="_blank" rel="noopener">X</a></p></div>`;
  document.body.appendChild(f); return h;
}
export function caBar(el, mint) { if (!el) return; el.innerHTML = `<span class="cap">$KYBER</span><code>${mint || 'launching on pump.fun'}</code>`; el.onclick = () => mint && copy(mint, '$KYBER address'); }
