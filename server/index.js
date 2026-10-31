// Kyber Chain node: a private proof-of-work testnet.
//   Argon2id proof of work, blocks every ~30s, private transactions only:
//   16-member MLSAG ring signatures + key images, stealth one-time outputs, Pedersen-committed amounts with
//   range proofs, and ML-KEM-768 payment detection for quantum ("kybq1") addresses.
// One process serves the chain API, the explorer, the browser wallet and the site.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
import * as K from '../client/rct.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), CLIENT = path.join(ROOT, 'client');
const PORT = +process.env.PORT || 8266, DATA = process.env.DATA_PATH || path.join(ROOT, 'data.json');
const BLOCK_SEC = +process.env.BLOCK_SEC || 30, ARGON_KIB = +process.env.ARGON_KIB || 8192, MIN_FEE = 10_000n;
const KYBER_MINT = process.env.KYBER_MINT || '';                         // $KYBER on Solana, shown on the site once set
const FAUCET = 25n * K.UNIT, MATURITY = 3, SUPPLY = 100_000_000n * K.UNIT, TAIL = 2n * K.UNIT;
const now = () => Date.now(), big = (x) => BigInt(x), fmt = (v) => (Number(v) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 6 });

// ---------- state ----------
let S = { blocks: [], outs: [], kis: {}, txs: {}, emitted: '0', seeds: null, faucet: {} };
try { S = { ...S, ...JSON.parse(fs.readFileSync(DATA, 'utf8')) }; } catch {}
if (!S.seeds) S.seeds = Array.from({ length: 7 }, () => K.wallet().seed);
const W = S.seeds.map((s) => K.wallet(s)), MINER = W[0], BOTS = W.slice(1);
const NAMES = ['miner', 'nyx', 'umbra', 'vesper', 'halcyon', 'ghostline', 'cipher'];
let mempool = [], saveT = 0;
const save = () => { if (saveT) return; saveT = setTimeout(() => { saveT = 0; fs.writeFileSync(DATA + '.tmp', JSON.stringify(S)); fs.renameSync(DATA + '.tmp', DATA); }, 1500); };
const tip = () => S.blocks[S.blocks.length - 1], height = () => S.blocks.length - 1;
const getOut = (g) => S.outs[g] && { P: S.outs[g].P, C: S.outs[g].C };
const spent = (ki) => !!S.kis[ki] || mempool.some((t) => t.vin.some((v) => v.ki === ki));

// ---------- server-held wallets (miner + bots) scan the chain like any wallet ----------
const owned = W.map(() => []);                                        // [{g,v,mask,x,ki}]
function scanOut(g) { const o = S.outs[g]; W.forEach((w, k) => { const r = K.scan(w, o, o.R, o.i); if (r) owned[k].push({ g, v: r.v, mask: r.mask, x: r.x, ki: K.keyImage(r.x, o.P) }); }); }
function balance(k) { return owned[k].filter((u) => !S.kis[u.ki]).reduce((a, u) => a + u.v, 0n); }
function decoys(avoid, n = 15) { const lim = S.outs.length; const pool = S.outs.map((o, g) => g).filter((g) => height() - S.outs[g].h >= MATURITY || S.outs.length < 200);
  const s = new Set(avoid), d = []; let tries = 0; while (d.length < n && tries++ < 5000) { const g = pool[Math.floor(Math.random() * pool.length)]; if (s.has(g)) continue; s.add(g); d.push({ gidx: g, ...getOut(g) }); } if (d.length < n) throw 'not enough outputs for a ring yet'; return d; }
function walletSend(k, address, v) {
  const fee = MIN_FEE, need = big(v) + fee, inflight = new Set(mempool.flatMap((t) => t.vin.map((x) => x.ki)));
  const utxo = owned[k].filter((u) => !S.kis[u.ki] && !inflight.has(u.ki) && height() - S.outs[u.g].h >= MATURITY).sort((a, b) => (a.v > b.v ? -1 : 1));
  const pick = []; let sum = 0n; for (const u of utxo) { if (sum >= need) break; pick.push(u); sum += u.v; } if (sum < need) throw 'faucet is refilling, try again in a minute';
  const ins = pick.map((u) => ({ v: u.v, mask: u.mask, x: u.x, gidx: u.g, ...getOut(u.g), decoys: decoys([u.g]) }));
  const outs = [{ address, v: big(v) }]; if (sum - need > 0n) outs.push({ address: W[k].address, v: sum - need });
  return K.buildTx(ins, outs, fee);
}

// ---------- blocks ----------
function reward() { const left = SUPPLY - big(S.emitted); const r = left >> 19n; return r > TAIL ? r : TAIL; }
function header(b) { return JSON.stringify({ h: b.height, prev: b.prev, ts: b.ts, diff: b.diff, root: b.root, miner: b.minerTx }); }
function nextDiff() { const n = S.blocks.length; if (n < 3) return 6; const t = tip(), back = S.blocks[Math.max(0, n - 11)], span = (t.ts - back.ts) / 1000 / Math.max(1, n - 1 - back.height);
  return Math.max(2, Math.round(t.diff * Math.min(1.5, Math.max(0.67, BLOCK_SEC / Math.max(1, span))))); }
const powHash = (hdr, nonce) => new Promise((ok, no) => crypto.argon2('argon2id', { message: Buffer.from(hdr + '|' + nonce), nonce: Buffer.from('kyber-chain-pow!'), parallelism: 1, tagLength: 32, memory: ARGON_KIB, passes: 1 }, (e, h) => e ? no(e) : ok(h)));
const meets = (h, diff) => BigInt('0x' + h.toString('hex')) * BigInt(diff) < 2n ** 256n;
function addOutputs(txid, tx, h, clear) { tx.vout.forEach((o, i) => { const g = S.outs.length; S.outs.push({ P: o.P, C: o.C, amt: o.amt, ...(o.ct ? { ct: o.ct } : {}), ...(clear ? { clear: true } : {}), R: tx.R, i, h, txid }); scanOut(g); }); }
async function mine() {
  for (;;) {
    const txs = mempool.slice(0, 20), fees = txs.reduce((a, t) => a + big(t.fee), 0n), h = S.blocks.length, r = K.rand();
    // genesis pays 64 small outputs across the wallets so the first rings of 16 have members to hide among
    const pay = h === 0 ? Array.from({ length: 64 }, (_, i) => [W[i % W.length].address, reward() / 64n]) : [[MINER.address, reward() + fees]];
    const cb = { v: 1, coinbase: true, height: h, R: K.ph(K.G.multiply(r)), vout: pay.map(([a, v], i) => K.makeOutput(a, v, i, r, true).o) };
    const ids = [K.txhash(cb), ...txs.map((t) => K.txhash(t))];
    const b = { height: h, prev: h ? tip().hash : '0'.repeat(64), ts: now(), diff: nextDiff(), root: K.txhash(ids), minerTx: ids[0] };
    const hdr = header(b); let nonce = Math.floor(Math.random() * 1e9), hashes = 0, pow;
    for (;;) { pow = await powHash(hdr, nonce); hashes++; if (meets(pow, b.diff)) break; nonce++; if (S.blocks.length !== h) break; }
    if (S.blocks.length !== h) continue;
    b.nonce = nonce; b.pow = pow.toString('hex'); b.hash = K.txhash(hdr + '|' + nonce); b.txs = ids; b.size = JSON.stringify(txs).length + 400; b.reward = String(reward()); b.fees = String(fees);
    const live = txs.filter((t) => t.vin.every((v) => !S.kis[v.ki]));
    S.txs[ids[0]] = { ...cb, h, ts: b.ts }; addOutputs(ids[0], cb, h, true);
    for (const t of live) { const id = K.txhash(t); S.txs[id] = { ...t, h, ts: b.ts }; t.vin.forEach((v) => (S.kis[v.ki] = id)); addOutputs(id, t, h, false); }
    S.emitted = String(big(S.emitted) + reward()); S.blocks.push(b); mempool = mempool.filter((t) => !txs.includes(t)); prune(); save();
    console.log(`block ${h} diff ${b.diff} hashes ${hashes} txs ${live.length}`);
  }
}
// keep full signatures/proofs for recent blocks; older txs keep what wallets and explorers need
function prune() { const cut = height() - 3000; if (cut <= 0) return; for (const id of S.blocks[cut].txs || []) { const t = S.txs[id]; if (t && t.vin && !t.pruned) { t.vin.forEach((v) => { delete v.sig; }); t.vout.forEach((o) => delete o.rp); t.pruned = true; } } }

// ---------- activity: the bot wallets pay each other with real private transactions ----------
async function bots() {
  for (;;) { await new Promise((r) => setTimeout(r, 45_000 + Math.random() * 60_000));
    try { const from = 1 + Math.floor(Math.random() * BOTS.length), cands = W.filter((_, k) => k !== from); let to = cands[Math.floor(Math.random() * cands.length)];
      if (balance(from) < 5n * K.UNIT) { const tx = walletSend(0, W[from][Math.random() < 0.5 ? 'qaddress' : 'address'], 400n * K.UNIT); submit(tx); continue; }
      const amt = BigInt(Math.floor((0.5 + Math.random() * 20) * 1e6)); submit(walletSend(from, Math.random() < 0.35 ? to.qaddress : to.address, amt)); } catch (e) { /* not enough mature coins yet */ } }
}
function submit(tx) { if (mempool.length > 200) throw 'mempool full'; const err = K.verifyTx(tx, getOut, spent); if (err) throw err; if (big(tx.fee) < MIN_FEE) throw 'fee below 0.01 KYBER'; mempool.push(tx); return K.txhash(tx); }

// ---------- views ----------
const txSummary = (id) => { const t = S.txs[id]; if (!t) return null; return { id, h: t.h, ts: t.ts, coinbase: !!t.coinbase, ins: t.vin ? t.vin.length : 0, outs: t.vout.length, fee: t.fee || '0', quantum: t.vout.filter((o) => o.ct).length, amount: t.coinbase ? t.vout[0].amt : null }; };
const blockView = (b) => ({ height: b.height, hash: b.hash, prev: b.prev, ts: b.ts, diff: b.diff, nonce: b.nonce, pow: b.pow, size: b.size, reward: b.reward, fees: b.fees, txs: b.txs.length });
function stats() { const n = S.blocks.length, last = S.blocks.slice(-20), span = last.length > 1 ? (last[last.length - 1].ts - last[0].ts) / (last.length - 1) / 1000 : BLOCK_SEC;
  const priv = Object.values(S.txs).filter((t) => !t.coinbase), q = priv.reduce((a, t) => a + t.vout.filter((o) => o.ct).length, 0);
  return { name: 'Kyber Chain', ticker: 'KYBER', network: 'testnet', height: n - 1, outputs: S.outs.length, keyImages: Object.keys(S.kis).length, privateTxs: priv.length, quantumOutputs: q, mempool: mempool.length,
    emitted: S.emitted, supply: String(SUPPLY), reward: String(reward()), diff: tip() ? tip().diff : 0, blockTime: +span.toFixed(1), targetTime: BLOCK_SEC, hashrate: tip() ? +(tip().diff / span).toFixed(2) : 0,
    ring: K.RING, bits: K.BITS, pow: `Argon2id (${ARGON_KIB / 1024} MiB)`, mint: KYBER_MINT || null, faucet: String(FAUCET) }; }
function search(q) { q = String(q || '').trim(); if (/^\d+$/.test(q) && S.blocks[+q]) return { type: 'block', id: q };
  if (/^[0-9a-f]{64}$/.test(q)) { if (S.txs[q]) return { type: 'tx', id: q }; const b = S.blocks.find((x) => x.hash === q); if (b) return { type: 'block', id: String(b.height) }; if (S.kis[q]) return { type: 'tx', id: S.kis[q] }; }
  return null; }

// ---------- http ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.pdf': 'application/pdf' };
const PAGES = { '/': 'index.html', '/explorer': 'explorer.html', '/wallet': 'wallet.html', '/docs': 'docs.html', '/faraday': 'faraday.html' };
const json = (res, code, o) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' }); res.end(JSON.stringify(o)); };
const body = (req) => new Promise((ok) => { let d = ''; req.on('data', (c) => { d += c; if (d.length > 3e6) req.destroy(); }); req.on('end', () => { try { ok(JSON.parse(d || '{}')); } catch { ok({}); } }); });
const hits = new Map(); const limited = (ip, key, per) => { const k = ip + key, t = hits.get(k) || 0; if (now() - t < per) return true; hits.set(k, now()); return false; };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'), p = u.pathname, ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0];
  try {
    if (p === '/api/stats') return json(res, 200, stats());
    if (p === '/api/blocks') { const lim = Math.min(100, +u.searchParams.get('limit') || 15), before = u.searchParams.has('before') ? +u.searchParams.get('before') : S.blocks.length; return json(res, 200, S.blocks.slice(Math.max(0, before - lim), before).reverse().map(blockView)); }
    if (p.startsWith('/api/block/')) { const id = decodeURIComponent(p.slice(11)), b = /^\d+$/.test(id) ? S.blocks[+id] : S.blocks.find((x) => x.hash === id); if (!b) return json(res, 404, { error: 'no such block' }); return json(res, 200, { ...blockView(b), tx: b.txs.map(txSummary).filter(Boolean) }); }
    if (p === '/api/txs') { const ids = []; for (let i = S.blocks.length - 1; i >= 0 && ids.length < 20; i--) for (const id of [...S.blocks[i].txs].reverse()) if (!S.txs[id]?.coinbase && ids.length < 20) ids.push(id); return json(res, 200, { mempool: mempool.map((t) => ({ id: K.txhash(t), ins: t.vin.length, outs: t.vout.length, fee: t.fee, quantum: t.vout.filter((o) => o.ct).length })), recent: ids.map(txSummary) }); }
    if (p.startsWith('/api/tx/')) { const id = p.slice(8), t = S.txs[id] || mempool.find((x) => K.txhash(x) === id); if (!t) return json(res, 404, { error: 'no such transaction' });
      const ring = t.vin ? t.vin.map((v) => ({ ki: v.ki, pseudo: v.pseudo, ring: v.ring, sig: v.sig ? { c0: v.sig.c0, r: v.sig.r.length } : null })) : [];
      return json(res, 200, { id, h: t.h ?? null, ts: t.ts ?? null, confirmations: t.h != null ? height() - t.h + 1 : 0, coinbase: !!t.coinbase, fee: t.fee || '0', R: t.R, vin: ring,
        vout: t.vout.map((o) => ({ P: o.P, C: o.C, quantum: !!o.ct, ct: o.ct ? o.ct.slice(0, 96) : null, ctBytes: o.ct ? o.ct.length / 2 : 0, amount: t.coinbase ? o.amt : null, rangeBits: o.rp ? o.rp.length : t.coinbase ? 0 : K.BITS })), size: JSON.stringify(t).length }); }
    if (p === '/api/search') { const r = search(u.searchParams.get('q')); return json(res, r ? 200 : 404, r || { error: 'nothing found: try a block height, block hash, tx id or key image' }); }
    // wallet sync
    if (p === '/api/outputs') { const from = Math.max(0, +u.searchParams.get('from') || 0), lim = Math.min(4000, +u.searchParams.get('limit') || 2000); return json(res, 200, { height: height(), total: S.outs.length, outs: S.outs.slice(from, from + lim).map((o, k) => ({ g: from + k, ...o })) }); }
    if (p === '/api/spent' && req.method === 'POST') { const d = await body(req); return json(res, 200, { spent: (d.kis || []).slice(0, 5000).map((k) => (S.kis[k] ? 'chain' : mempool.some((t) => t.vin.some((v) => v.ki === k)) ? 'pool' : null)) }); }
    if (p === '/api/decoys') { const avoid = (u.searchParams.get('avoid') || '').split(',').filter(Boolean).map(Number), n = Math.min(15 * 8, +u.searchParams.get('n') || 15); return json(res, 200, { decoys: decoys(avoid, n), height: height() }); }
    if (p === '/api/tx' && req.method === 'POST') { const d = await body(req); try { return json(res, 200, { ok: true, id: submit(d.tx) }); } catch (e) { return json(res, 200, { error: String(e) }); } }
    if (p === '/api/faucet' && req.method === 'POST') { const d = await body(req); try { K.parseAddress(d.address); } catch (e) { return json(res, 200, { error: String(e) }); }
      const key = d.address.slice(0, 80); if (limited(ip, 'f', 30 * 60_000) || (S.faucet[key] && now() - S.faucet[key] < 60 * 60_000)) return json(res, 200, { error: 'one faucet drip per hour' });
      try { const id = submit(walletSend(0, d.address, FAUCET)); S.faucet[key] = now(); save(); return json(res, 200, { ok: true, id, amount: String(FAUCET) }); } catch (e) { hits.delete(ip + 'f'); return json(res, 200, { error: String(e) }); } }
    if (p === '/api/miners') return json(res, 200, W.map((w, k) => ({ name: NAMES[k], address: w.address, outputs: owned[k].length })));
    // static
    if (p.startsWith('/vendor/')) { const f = path.join(ROOT, 'node_modules', '@noble', path.normalize(p.slice(8)).replace(/^(\.\.[\\/])+/, '')); if (!f.startsWith(path.join(ROOT, 'node_modules')) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'public, max-age=86400' }); return fs.createReadStream(f).pipe(res); }
    const file = PAGES[p.replace(/\/$/, '') || '/'] || path.normalize(p).replace(/^(\.\.[\\/])+/, '').slice(1), full = path.join(CLIENT, file);
    if (!full.startsWith(CLIENT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404, { 'content-type': 'text/html' }); return res.end(fs.readFileSync(path.join(CLIENT, '404.html'))); }
    res.writeHead(200, { 'content-type': MIME[path.extname(full)] || 'application/octet-stream', 'cache-control': 'no-cache' }); fs.createReadStream(full).pipe(res);
  } catch (e) { json(res, 500, { error: String(e) }); }
}).listen(PORT, () => { console.log(`Kyber Chain on :${PORT} · height ${height()} · outputs ${S.outs.length}`); });

// rebuild wallet views from stored outputs, then run
for (let g = 0; g < S.outs.length; g++) scanOut(g);
mine(); bots();
