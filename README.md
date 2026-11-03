# Kyber Chain

**Private money for the quantum era.** A proof-of-work chain where every transaction hides its sender, receiver and amount, and where payments to quantum addresses are found with ML-KEM-768.

[![tests](https://github.com/KyberChain/kyber/actions/workflows/test.yml/badge.svg)](https://github.com/KyberChain/kyber/actions/workflows/test.yml)

- Live testnet, explorer and wallet: https://kyber-e1ev.onrender.com
- Whitepaper: [WHITEPAPER.md](WHITEPAPER.md) · https://kyber-e1ev.onrender.com/whitepaper
- X: [@KyberChainL1](https://x.com/KyberChainL1)
- Token: $KYBER on Solana carries the project to mainnet. The testnet coin (tKYBER) has no value.

## What runs today

One Node.js process is the node, the block explorer and the browser wallet. Everything below is in this repository and exercised by the test suite.

| Piece | How it works | Code |
|---|---|---|
| Hidden sender | Each input signs with 16 outputs from the chain (15 decoys) using a two-row MLSAG over ristretto255 | `client/rct.js` `mlsagSign` / `mlsagVerify` |
| Double-spend protection | Each spend publishes a key image `I = x·Hp(P)`; the node rejects any image it has seen | `keyImage`, `verifyTx`, `server/index.js` |
| Hidden receiver | Every output goes to a one-time address `P = Hs(secret, i)·G + A` | `makeOutput`, `scan` |
| Quantum receive | `kybq1` addresses carry an ML-KEM-768 key. The sender encapsulates, the 1,088-byte ciphertext rides with the output, only the receiver can decapsulate | `makeOutput`, `scan` |
| Hidden amount | Pedersen commitments `C = x·G + v·H`, a 48-bit range proof per output, and `Σ inputs = Σ outputs + fee·H` | `rangeProve`, `rangeVerify`, `verifyTx` |
| Consensus | Argon2id proof of work (memory-hard), difficulty retargets every block toward 30 s | `server/index.js` `mine` |
| Wallet | Keys are made in the browser from a 32-byte seed. The browser scans outputs, builds ring signatures and range proofs, then submits | `client/wallet.html` |
| Verify it yourself | Every transaction in the explorer has a **verify in your browser** button that re-runs `verifyTx` on your machine | `client/explorer.html`, `GET /api/rawtx/:id` |

Cryptography comes from the audited [noble](https://paulmillr.com/noble/) libraries: `@noble/curves` (ristretto255), `@noble/hashes` (SHA-512, SHA3-256), `@noble/post-quantum` (ML-KEM-768). Argon2id is Node's built-in `crypto.argon2`.

## Run it

Requires Node 24 or newer.

```bash
git clone https://github.com/KyberChain/kyber
cd kyber
npm install
npm start              # http://localhost:8266
```

Environment: `PORT`, `DATA_PATH` (chain file), `BLOCK_SEC` (target block time, default 30), `ARGON_KIB` (Argon2id memory, default 8192), `KYBER_MINT` (the $KYBER address shown on the site).

## Test it

```bash
npm test               # crypto: stealth scan, ML-KEM, range proofs, ring signatures, forgeries, double spends
npm run test:e2e       # boots a node, mines, faucet → wallet scan → private send to a kybq1 address → receiver finds it
```

Both run on every push in GitHub Actions.

## API

```
GET  /api/stats                     height, difficulty, outputs, key images, emission
GET  /api/blocks?limit=15&before=N  recent blocks
GET  /api/block/:height|:hash       one block and its transactions
GET  /api/txs                       mempool and recent private transactions
GET  /api/tx/:id                    rings, key images, commitments, ML-KEM ciphertexts
GET  /api/rawtx/:id                 the full transaction and its ring members, for independent verification
GET  /api/search?q=                 height, block hash, tx id or key image
GET  /api/outputs?from=G&limit=N    outputs for wallet scanning
POST /api/spent   {kis:[…]}         which key images are spent
GET  /api/decoys?n=15&avoid=a,b     random ring members
POST /api/tx      {tx}              submit a private transaction
POST /api/faucet  {address}         25 tKYBER, once an hour
```

## Protocol

| | |
|---|---|
| Ring size | 16 |
| Range proofs | 48-bit, one per output |
| Proof of work | Argon2id, 8 MiB on testnet |
| Block time | 30 s target |
| Emission | `(100M − emitted) / 2^19` per block, 2.0 tail forever |
| Coinbase maturity | 3 blocks |
| Addresses | `kyb1…` (97 characters), `kybq1…` (about 1,715 characters) |

## Status and roadmap

- **Live:** private testnet with everything in the table above.
- **Next:** a standalone Argon2id miner so anyone can mine testnet blocks.
- **Faraday:** spends move from elliptic-curve ring signatures to hash-based proofs, and each spend hides among every output on the chain. Payment detection becomes ML-KEM-768 only.
- **Mainnet:** genesis with Faraday on from block 1.

The testnet is run by a single node today. Ring signatures and Pedersen commitments are elliptic-curve constructions; the receive side is post-quantum on `kybq1` addresses, and Faraday is the plan for the spend side.

## License

BSD 3-Clause. See [LICENSE](LICENSE). Security reports: see [SECURITY.md](SECURITY.md).
