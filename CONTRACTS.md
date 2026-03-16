# Contract Addresses

All contracts are deployed on **Stellar Testnet**.

## Core Contracts

### TokenFactory
**Address:** `CAJDRJTHKCKZORXKMZXZSMHHEC5AMPAKUDNDVOH2IEXYHLQVDGYJXSHG`
**Network:** Stellar Testnet
**Explorer:** https://stellar.expert/explorer/testnet/contract/CAJDRJTHKCKZORXKMZXZSMHHEC5AMPAKUDNDVOH2IEXYHLQVDGYJXSHG
**Description:** Factory contract for creating meme tokens with bonding curve integration and social links support

### BondingCurve
**Address:** `CC36RRUTOZ5KZ4A6FLTFNFXMAEZVXZFYD4ZGJM74GK23TCIF476DD3SF`
**Network:** Stellar Testnet
**Explorer:** https://stellar.expert/explorer/testnet/contract/CC36RRUTOZ5KZ4A6FLTFNFXMAEZVXZFYD4ZGJM74GK23TCIF476DD3SF
**Description:** Bonding curve marketplace for meme tokens with automatic market-making

### PerpetualTrading
**Address:** `CDYGKON5HEUWWTANFAJZWDJXY5PDYYN3NQHZLO5LAOB4XETPJRNHQ5TS`
**Network:** Stellar Testnet
**Explorer:** https://stellar.expert/explorer/testnet/contract/CDYGKON5HEUWWTANFAJZWDJXY5PDYYN3NQHZLO5LAOB4XETPJRNHQ5TS
**Description:** Perpetual trading contract for long/short positions with leverage

### PickleToken
**Address:** `CDRX5DZVKYBLVOX2HKJLCRNXS4NZ24SZECV55SIRUWJJN2QWCT2EEUTL`
**Network:** Stellar Testnet
**Explorer:** https://stellar.expert/explorer/testnet/contract/CDRX5DZVKYBLVOX2HKJLCRNXS4NZ24SZECV55SIRUWJJN2QWCT2EEUTL
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
