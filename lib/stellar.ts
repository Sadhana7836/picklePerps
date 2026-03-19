import * as StellarSdk from '@stellar/stellar-sdk';

export const STELLAR_NETWORK = 'TESTNET';
export const STELLAR_NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const STELLAR_RPC_URL = 'https://soroban-testnet.stellar.org';
export const STELLAR_HORIZON_URL = 'https://horizon-testnet.stellar.org';

// Contract IDs - Deployed on Stellar Testnet
export const CONTRACT_IDS = {
  tokenFactory: 'CDKWK6AWTM7BLPWU4AXQFJKDGTHARMQJREEKX3KPNGIP7OG2MYIADVA5',
  bondingCurve: 'CCRG5TLML6YW6I3FUVXZ24YUDESIGD7G6ENO5W44IRVXOA6GK26QYIN4',
  perpetualTrading: 'CDAI2GYRVL5VPPYSSSJACNCP4WSZLF56UYKRMPSTFTZX6IJRAZFT55GQ',
  pickleToken: 'CD7TBCDXM6WNOMN6D3WFP6BALA6AF32EHIUDINXY7SAZ46XMEHS2W7BO',
  copyTrading: '',
  rwaPerpeturalTrading: '',
};

// Create server instance
export const server = new StellarSdk.SorobanRpc.Server(STELLAR_RPC_URL);
export const horizonServer = new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);
