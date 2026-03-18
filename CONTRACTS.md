# Contract Addresses

All contracts are deployed on **Stellar Testnet**.

## Core Contracts

### TokenFactory
**Address:** `CASR366SHQINAHN4J5R6NYATEJFD2V6IPGVW5M5XWIBECHCOM2BIFBE7`
**Network:** Stellar Testnet
**Explorer:** https://stellar.expert/explorer/testnet/contract/CASR366SHQINAHN4J5R6NYATEJFD2V6IPGVW5M5XWIBECHCOM2BIFBE7
**Description:** Factory contract for creating meme tokens with bonding curve integration and social links support

### BondingCurve
**Address:** `CBHWDHR5KKV6QRSWNSUA37W4O3XO5LJGLONVHXHIPPNVXMBQAONPP6YU`
**Network:** Stellar Testnet
**Explorer:** https://stellar.expert/explorer/testnet/contract/CBHWDHR5KKV6QRSWNSUA37W4O3XO5LJGLONVHXHIPPNVXMBQAONPP6YU
**Description:** Bonding curve marketplace for meme tokens with automatic market-making

### PerpetualTrading
**Address:** `CC6RDU5HIWOER4FIKL5QWD3TZWOBZRT7NQ2QSQAVPTBHQ5ZGA4PERIMP`
**Network:** Stellar Testnet
**Explorer:** https://stellar.expert/explorer/testnet/contract/CC6RDU5HIWOER4FIKL5QWD3TZWOBZRT7NQ2QSQAVPTBHQ5ZGA4PERIMP
**Description:** Perpetual trading contract for long/short positions with leverage

### PikeToken
**Address:** `CBZATY6XAZ4FI6DHJT6IQDEKS6MJMUAIYBOMOYYQ2EWSTSRIAA47NWU3`
**Network:** Stellar Testnet
**Explorer:** https://stellar.expert/explorer/testnet/contract/CBZATY6XAZ4FI6DHJT6IQDEKS6MJMUAIYBOMOYYQ2EWSTSRIAA47NWU3
**Description:** Template token contract for meme tokens created via TokenFactory

## Network Information

- **Network Name:** Stellar Testnet
- **RPC URL:** https://soroban-testnet.stellar.org
- **Horizon URL:** https://horizon-testnet.stellar.org
- **Block Explorer:** https://stellar.expert/explorer/testnet
- **Native Currency:** XLM

## Contract Interactions

- **BondingCurve** is connected to **TokenFactory**
- **PerpetualTrading** uses **BondingCurve** for price feeds
- All meme tokens created via **TokenFactory** are automatically listed on **BondingCurve**
