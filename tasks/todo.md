# Tasks

## Fix Monitor Page — Replace EVM Addresses with Stellar Contract Addresses

**File:** `app/monitor/page.tsx`

**Problem:** `services` array has placeholder EVM-style `0x...` addresses. Must be replaced with real Stellar Testnet contract IDs from `CONTRACTS.md`.

### Checklist

- [ ] Replace `Perpetual Trading Contract` address
  - Current (WRONG): `0x8081b646f349c049f2d5e8a400057d411dd657bd`
  - Correct: `CC6RDU5HIWOER4FIKL5QWD3TZWOBZRT7NQ2QSQAVPTBHQ5ZGA4PERIMP`

- [ ] Replace `Token Factory V3` address
  - Current (WRONG): `0x083c920Eb055997a4becf51d9854dCd441a40b3E`
  - Correct: `CASR366SHQINAHN4J5R6NYATEJFD2V6IPGVW5M5XWIBECHCOM2BIFBE7`

- [ ] Replace `Bonding Curve Market` address
  - Current (WRONG): `0x93b268325A9862645c82b32229f3B52264750Ca2`
  - Correct: `CBHWDHR5KKV6QRSWNSUA37W4O3XO5LJGLONVHXHIPPNVXMBQAONPP6YU`

- [ ] Add `PikeToken` service entry (missing from monitor page)
  - Address: `CBZATY6XAZ4FI6DHJT6IQDEKS6MJMUAIYBOMOYYQ2EWSTSRIAA47NWU3`
  - Name: `Pike Token (Template)`

- [ ] Verify explorer links use correct Stellar testnet explorer format
  - Pattern: `https://stellar.expert/explorer/testnet/contract/{ADDRESS}`
  - Already correct in `ServiceRow` component — just need address values fixed

### Notes
- All contracts on Stellar Testnet, not EVM
- Source of truth: `CONTRACTS.md`
