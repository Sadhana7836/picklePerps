import * as StellarSdk from '@stellar/stellar-sdk';

export const STELLAR_NETWORK = 'TESTNET';
export const STELLAR_NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const STELLAR_RPC_URL = 'https://soroban-testnet.stellar.org';
export const STELLAR_HORIZON_URL = 'https://horizon-testnet.stellar.org';

// Contract IDs - Deployed on Stellar Testnet
export const CONTRACT_IDS = {
  tokenFactory: 'CAJDRJTHKCKZORXKMZXZSMHHEC5AMPAKUDNDVOH2IEXYHLQVDGYJXSHG',
  bondingCurve: 'CC36RRUTOZ5KZ4A6FLTFNFXMAEZVXZFYD4ZGJM74GK23TCIF476DD3SF',
  perpetualTrading: 'CDYGKON5HEUWWTANFAJZWDJXY5PDYYN3NQHZLO5LAOB4XETPJRNHQ5TS',
  pickleToken: 'CDRX5DZVKYBLVOX2HKJLCRNXS4NZ24SZECV55SIRUWJJN2QWCT2EEUTL',
  copyTrading: '',
  rwaPerpeturalTrading: '',
};

// Create server instance
export const server = new StellarSdk.SorobanRpc.Server(STELLAR_RPC_URL);
export const horizonServer = new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);
