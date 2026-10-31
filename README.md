# Kyber Chain ($KYBER)

Private money for the quantum era. A private proof-of-work chain:

- **Ring signatures**: every spend hides among 16 outputs (MLSAG over ristretto255, linkable key images)
- **Stealth addresses**: every payment lands at a one-time address
- **Hidden amounts**: Pedersen commitments with 48-bit range proofs
- **Quantum addresses** (`kybq1…`): payment detection with ML-KEM-768
- **Argon2id** memory-hard proof of work, ~30 s blocks, ~100M supply + 2.0/block tail

The node, explorer and browser wallet are one Node 24 process.

```
npm i && npm start        # http://localhost:8266
node _studio/crypto-test.js
```

See `/docs` on a running node for the protocol and API.
