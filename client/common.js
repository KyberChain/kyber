// shared header/footer, CA bar, toasts, formatting
export const X_URL = 'https://x.com/KyberChainL1', GH_URL = 'https://github.com/KyberChain/kyber';
export const $ = (id) => document.getElementById(id), api = (p, d) => fetch(p, d ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) } : undefined).then((r) => r.json());
export const kyb = (v) => (Number(v) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 6 });
export const short = (h, n = 8) => (h ? h.slice(0, n) + '…' + h.slice(-6) : '');
export const ago = (ts) => { const s = Math.max(0, (Date.now() - ts) / 1000); return s < 60 ? Math.floor(s) + 's ago' : s < 3600 ? Math.floor(s / 60) + 'm ago' : Math.floor(s / 3600) + 'h ago'; };
export function toast(m, err) { const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 3600); }
export const copy = (v, what) => navigator.clipboard.writeText(v).then(() => toast((what || 'copied') + ' copied'));
const MARK = `<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><rect x="1" y="1" width="30" height="30" rx="3" stroke="#5ce1ff" stroke-width="1.6"/><path d="M10 8v16M10 16l9-8M10 16l9 8" stroke="#5ce1ff" stroke-width="2.4" stroke-linecap="square"/><circle cx="23" cy="16" r="1.8" fill="#5ce1ff"/></svg>`;
export function chrome(on) {
  const h = document.createElement('header'); h.innerHTML = `<div class="wrap"><a class="logo" href="/">${MARK}<span><span class="pr">$</span> kyber</span></a><span class="pill">TESTNET LIVE</span>
    <nav>${[['/#faraday', 'faraday'], ['/explorer', 'explorer'], ['/wallet', 'wallet'], ['/docs', 'docs'], [GH_URL, 'github'], [X_URL, 'x']].map(([u, t]) => `<a href="${u}" class="${location.pathname === u ? 'on' : ''}"${u.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`).join('')}</nav></div>`;
  document.body.prepend(h);
  const f = document.createElement('footer'); f.innerHTML = `<div class="wrap"><span>${MARK}</span><span>Kyber Chain · private money for the quantum era</span><a href="/explorer">explorer</a><a href="/wallet">wallet</a><a href="/docs">docs</a><a href="${GH_URL}" target="_blank" rel="noopener">github</a><a href="${X_URL}" target="_blank" rel="noopener">x</a></div>`;
  document.body.appendChild(f);
}
export function caBar(el, mint) { if (!el) return; el.innerHTML = `<span class="dim">$KYBER</span><code>${mint || 'launching on pump.fun'}</code>`; el.onclick = () => mint && copy(mint, '$KYBER address'); }
