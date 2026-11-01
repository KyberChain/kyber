// Writes brand/X-KIT.md; every tweet must be ≤245 characters.  node _studio/tweets.cjs
'use strict';
const fs = require('fs'), path = require('path');
const len = (t) => [...t].reduce((a, c) => a + (c.codePointAt(0) > 0x10ff ? 2 : 1), 0);
const BIO = 'Private money for the quantum era. Ring signatures, stealth addresses, hidden amounts, ML-KEM-768. Private today. Private after quantum. $KYBER';
const T = [
  ['Pinned', 'kyber-hype-16s.mp4', `Every public chain turns your money into a diary anyone can read.

Kyber Chain hides the sender in a ring of 16, the receiver behind a one-time address, the amount inside a commitment.

Private today. Private after quantum.

$KYBER`],
  ['Ring signatures (video)', 'kyber-ring-16s.mp4', `You spend one coin. You sign with sixteen.

Every Kyber input signs alongside 15 decoys pulled from the chain. The signature proves one is yours, never which.

A key image makes spending it twice impossible.

$KYBER`],
  ['Quantum (video)', 'kyber-quantum-16s.mp4', `Quantum computers break elliptic curves.

Pay a kybq1 address on Kyber Chain and the payment is found with ML-KEM-768: a 1,088-byte ciphertext only the receiver can open.

Live on testnet today.

$KYBER`],
  ['Anatomy', 'kyber-g01-anatomy.png', `Anatomy of a Kyber transaction:

sender → ring of 16
receiver → one-time stealth address
amount → Pedersen commitment + range proof
double spend → key image
quantum receive → ML-KEM-768

What the chain sees: nothing useful.`],
  ['Faraday', 'kyber-g02-faraday.png', `Faraday is the Kyber quantum upgrade.

Spends move to hash-based proofs. Every spend hides in the full chain, not 16 outputs. Payment detection is ML-KEM-768 only.

Same chain. No new coin. The wallet moves you once.

$KYBER`],
  ['Ring', 'kyber-g03-ring.png', `One of these 16 is the real spend.

Nobody watching the chain can tell which. Not exchanges, not trackers, not the node that mined it.

That's every input, on every Kyber transaction, by default.

$KYBER`],
  ['Quantum addresses', 'kyber-g04-quantum.png', `Two addresses, one wallet.

kyb1: classic ECDH payment detection
kybq1: ML-KEM-768, the NIST post-quantum standard

Share the kybq1 address and your incoming payments stay private even against a quantum computer.

$KYBER`],
  ['Spec sheet', 'kyber-g05-specs.png', `Kyber Chain spec sheet:

Argon2id proof of work (memory-hard)
30s blocks
~100M supply + 2.0/block tail
MLSAG ring signatures, ring of 16
Pedersen commitments + 48-bit range proofs
ML-KEM-768 quantum addresses

$KYBER`],
  ['Roadmap', 'kyber-g06-roadmap.png', `Kyber Chain roadmap:

✓ testnet live: explorer, browser wallet, faucet
✓ $KYBER launch
→ open mining with Argon2id
→ Faraday: hash-based spends, full-chain privacy
→ mainnet with Faraday from block 1`],
  ['Where Kyber sits', 'kyber-g07-vs.png', `Transparent chains hide nothing.
Classic privacy coins hide sender, receiver and amount, then stop.

Kyber hides all three, detects payments with ML-KEM-768, and has a path to fully quantum-safe spends.

$KYBER`],
  ['Try it', 'kyber-keyart.png', `Try a private transaction in under a minute:

1. Open the Kyber wallet, keys made in your browser
2. Take 25 tKYBER from the faucet
3. Send to any kyb1 or kybq1 address

Your browser builds the ring signature. The chain sees nothing.`],
  ['Launch (fill CA)', 'kyber-keyart.png', `$KYBER is live.

Kyber Chain: private money for the quantum era. Ring signatures, stealth addresses, hidden amounts, ML-KEM-768.

CA: <paste CA>`],
];
let md = `# Kyber Chain X kit\n\n## Handle\n\`\`\`\n@KyberChainL1\n\`\`\`\n\n## Display name\n\`\`\`\nKyber Chain | $KYBER\n\`\`\`\n\n## Bio (${len(BIO)}/160)\n\`\`\`\n${BIO}\n\`\`\`\n\n## Profile images\n- Avatar: \`kyber-pfp.png\`\n- Header: \`kyber-banner.png\`\n\n## Tweets (all ≤245)\n`;
let bad = 0; T.forEach(([title, media, text], i) => { const n = len(text); if (n > 245) { bad++; console.log('TOO LONG', title, n); } md += `\n### ${i + 1}. ${title} · ${n} chars · media: \`${media}\`\n\`\`\`\n${text}\n\`\`\`\n`; console.log(String(n).padStart(4), title); });
if (len(BIO) > 160) { bad++; console.log('BIO TOO LONG', len(BIO)); }
fs.writeFileSync(path.join(__dirname, '..', 'brand', 'X-KIT.md'), md); process.exit(bad ? 1 : 0);
